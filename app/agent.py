"""
FocusMate Local - Core Agent Logic
Coordinates the 4 Practical Pillars of the Guided Work Desk:
1. Universal Catch-All (Separates immediate study vs later reminders)
2. Chunked Reader & Scratchpad (Atomic questions without overload, structured values)
3. Unstick Me Scaffolding (ELI5, Fill-in-the-blank starter templates, Micro-steps, Solution Validator)
4. Mental Breadcrumb State Recovery (Zero-effort session restoration & energy rerouting)
"""

import re
import json
import os
import io
import time
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from app.ollama_client import LocalLLMClient

BREADCRUMBS_FILE = "breadcrumbs_state.json"

class FocusMateAgent:
    def __init__(self, llm_client: Optional[LocalLLMClient] = None):
        self.llm = llm_client or LocalLLMClient()
        self.breadcrumbs_path = os.path.join(os.path.dirname(__file__), "..", BREADCRUMBS_FILE)

    # =========================================================================
    # PILLAR 1: UNIVERSAL CATCH-ALL
    # =========================================================================
    def parse_catch_all(self, raw_input: str) -> Dict[str, Any]:
        """
        Takes messy mixed text (e.g. 'Finish this assignment, go gym, eat dinner, talk to mom, spend time eith gf, play bmw')
        and partitions into:
        - immediate_study: The core assignment / subject focus
        - later_drawer: Low-guilt parking lot for errands, phone calls, chores, social
        """
        raw_input = raw_input.strip()
        if not raw_input:
            return {"immediate_study": [], "later_drawer": []}

        # If local Ollama LLM is available, use generative classification
        if self.llm.is_available():
            prompt = f"""You are FocusMate Local, an empathetic study assistant for neurodivergent students.
Analyze this messy brain dump and separate tasks into two clean categories:
1. "immediate_study": Tasks that represent academic work or the assignment to focus on right now.
2. "later_drawer": Errands, gym, calls, dinner, personal time, gaming, or reminders to park away so the student's mind is calm.

For each item in later_drawer, return:
- "title": concise task name (e.g. "Hit the gym", "Call mom", "Eat dinner")
- "category": one of ["errand", "health", "call", "meal", "personal", "leisure"]
- "estimated_minutes": quick realistic integer estimate (e.g. 5, 15, 30)
- "is_quick_win": true if under 10 minutes

Input brain dump:
\"\"\"{raw_input}\"\"\"

Return STRICT JSON:
{{
  "immediate_study": [{{"title": "...", "description": "...", "priority": "high"}}],
  "later_drawer": [{{"title": "...", "category": "...", "estimated_minutes": 5, "is_quick_win": true}}]
}}
"""
            llm_result = self.llm.generate(prompt=prompt, system="Output only valid JSON.")
            if llm_result.get("success"):
                try:
                    resp_text = llm_result["response"]
                    if "```json" in resp_text:
                        resp_text = resp_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in resp_text:
                        resp_text = resp_text.split("```")[1].split("```")[0].strip()
                    parsed = json.loads(resp_text)
                    if parsed.get("immediate_study") or parsed.get("later_drawer"):
                        parsed["llm_powered"] = True
                        parsed["tokens_per_sec"] = llm_result.get("tokens_per_sec", 0.0)
                        return parsed
                except Exception:
                    pass

        # Offline Intelligent Semantic Heuristics
        return self._heuristic_catch_all_parser(raw_input)

    def _heuristic_catch_all_parser(self, text: str) -> Dict[str, Any]:
        """Deterministic offline rule-based parser for mixed thoughts."""
        phrases = [p.strip() for p in re.split(r'[,;\n]|\band\b', text, flags=re.IGNORECASE) if p.strip()]
        
        later_rules = [
            (r'\bgym\b|\bworkout\b|\bexercise\b|\brun\b', "health", 45, False),
            (r'\bdinner\b|\blunch\b|\bbreakfast\b|\beat\b|\bfood\b|\bmeal\b', "meal", 25, False),
            (r'\bmom\b|\bdad\b|\bparents\b|\bcall\b|\bphone\b|\bmessage\b|\btext\b', "call", 5, True),
            (r'\bgf\b|\bgirlfriend\b|\bfriend\b|\bhangout\b|\bdate\b', "personal", 30, False),
            (r'\bplay\b|\bbmw\b|\bgame\b|\bgaming\b|\bvideo game\b|\bwatch\b|\bmovie\b', "leisure", 20, False),
            (r'\bbuy\b|\bshop\b|\bstore\b|\bgroceries\b|\bnotebook\b|\bpen\b', "errand", 10, True),
            (r'\bclean\b|\bwash\b|\blaundry\b|\broom\b', "chore", 15, False),
            (r'\bwater\b|\bhydrate\b|\bmedicine\b|\bpill\b', "health", 1, True),
            (r'\bbill\b|\bpay\b|\brecharge\b', "errand", 3, True),
        ]

        study_keywords = [
            "assignment", "study", "homework", "chapter", "read", "revise", 
            "solve", "problem", "write", "pdf", "lab", "math", "code", "report", "question"
        ]

        immediate_study = []
        later_drawer = []

        for p in phrases:
            matched = False
            for pattern, cat, est_mins, quick_win in later_rules:
                if re.search(pattern, p, re.I):
                    later_drawer.append({
                        "title": p.capitalize(),
                        "category": cat,
                        "estimated_minutes": est_mins,
                        "is_quick_win": quick_win
                    })
                    matched = True
                    break

            if not matched:
                is_study = any(re.search(rf'\b{kw}\b', p, re.I) for kw in study_keywords)
                if is_study or not immediate_study:
                    immediate_study.append({
                        "title": p.capitalize(),
                        "description": "Primary study focus",
                        "priority": "high"
                    })
                else:
                    later_drawer.append({
                        "title": p.capitalize(),
                        "category": "personal",
                        "estimated_minutes": 10,
                        "is_quick_win": True
                    })

        return {
            "immediate_study": immediate_study,
            "later_drawer": later_drawer,
            "llm_powered": False
        }

    # =========================================================================
    # PILLAR 2: CHUNKED READER & EXTRACTOR
    # =========================================================================
    def parse_pdf_to_chunks(self, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Extracts questions or sections from an assignment PDF.
        Splits text into atomic, bite-sized study steps so user never faces a 15-page wall of text.
        """
        reader = PdfReader(io.BytesIO(file_bytes))
        full_text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            full_text += f"\n--- Page {i+1} ---\n" + page_text

        return self.chunk_text_to_questions(full_text, source=filename)

    def chunk_text_to_questions(self, text: str, source: str = "Assignment") -> List[Dict[str, Any]]:
        """
        Splits academic text into structured questions/tasks with extracted key values & objectives.
        """
        # Patterns for questions: "Question 1", "Problem 1", "Q1.", "1.", "Exercise 1"
        pattern = r'(?=(?:(?:\n|^)(?:Question|Problem|Q\.|Exercise|Task)\s*[\d]+|(?:(?:\n|^)[\d]{1,2}[\.\)]\s+)))'
        splits = [s.strip() for s in re.split(pattern, text, flags=re.IGNORECASE) if s.strip()]

        chunks = []
        q_counter = 1
        for s in splits:
            clean = re.sub(r'--- Page \d+ ---', '', s).strip()
            if len(clean) < 20:
                continue
            
            lines = [l.strip() for l in clean.split('\n') if l.strip()]
            first_line = lines[0] if lines else f"Question {q_counter}"
            
            title = first_line if len(first_line) < 70 else f"Question {q_counter}"
            if not any(k in title.lower() for k in ["question", "problem", "q", "task", "part", "exercise"]):
                title = f"Question {q_counter}: {title[:35]}..."

            # Extract given parameters (numbers, units) to help ADHD working memory
            given_params = self._extract_given_parameters(clean)

            chunks.append({
                "id": f"q_{q_counter}",
                "step_number": q_counter,
                "title": title,
                "body": clean,
                "given_values": given_params,
                "estimated_minutes": 10 + (len(clean) // 120) * 2,
                "source": source
            })
            q_counter += 1

        if not chunks:
            # Fallback if text has no numbered questions: split by logical paragraphs
            paras = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            for idx, p in enumerate(paras[:6], 1):
                chunks.append({
                    "id": f"sec_{idx}",
                    "step_number": idx,
                    "title": f"Study Block {idx}",
                    "body": p,
                    "given_values": self._extract_given_parameters(p),
                    "estimated_minutes": 8,
                    "source": source
                })

        return chunks

    def synthesize_assignment_roadmap(self, task_description: str) -> List[Dict[str, Any]]:
        """
        When the user enters a high-level goal like "finish this assignment" without a PDF,
        synthesize a realistic 4-step guided assignment roadmap instead of echoing their messy words.
        """
        clean_desc = task_description.strip()
        if not clean_desc or clean_desc.lower() in ["finish this assignment", "assignment", "homework", "study"]:
            clean_desc = "Assignment Problem Set"

        return [
            {
                "id": "step_1",
                "step_number": 1,
                "title": "Phase 1: Problem Definition & Given Parameters",
                "body": f"Review your assignment notes for '{clean_desc}'. Write down the exact given values, boundary conditions, and the primary objective to solve.",
                "given_values": ["Given inputs / constants", "Target formulas"],
                "estimated_minutes": 8,
                "source": "Guided Roadmap"
            },
            {
                "id": "step_2",
                "step_number": 2,
                "title": "Phase 2: Core Methodology & Formula Application",
                "body": "Select the governing formula, theorem, or method required. Write down the equation and prepare the substitution line in your scratchpad.",
                "given_values": ["Core Formula", "Units & Conversions"],
                "estimated_minutes": 12,
                "source": "Guided Roadmap"
            },
            {
                "id": "step_3",
                "step_number": 3,
                "title": "Phase 3: Step-by-Step Calculation & Working",
                "body": "Execute the numerical calculation or draft the technical explanation step-by-step. Keep intermediate calculations tidy in your scratchpad.",
                "given_values": ["Intermediate values", "Calculation lines"],
                "estimated_minutes": 15,
                "source": "Guided Roadmap"
            },
            {
                "id": "step_4",
                "step_number": 4,
                "title": "Phase 4: Sanity Check & Final Answer",
                "body": "Verify units, physical plausibility, and answer precision. Write your concluding summary statement.",
                "given_values": ["Final Answer", "Physical Units"],
                "estimated_minutes": 5,
                "source": "Guided Roadmap"
            }
        ]

    def _extract_given_parameters(self, text: str) -> List[str]:
        """Extracts numerical quantities and units to ease working memory overload."""
        found = []
        # Match numbers with units (e.g. 50Hz, 10 ohm, 230 V, 100 uF, 5A, 10 kg, etc.)
        matches = re.findall(r'([A-Za-z_]+\s*=\s*[\d\.]+\s*[A-Za-zµΩ°%]*|[\d\.]+\s*(?:ohm|Ω|hz|khz|mhz|v|kv|mv|a|ma|uf|nf|pf|h|mh|w|kw|mw|rad/s|kg|m/s|cm|mm))', text, re.I)
        for m in matches[:5]:
            m_clean = m.strip()
            if m_clean and m_clean not in found:
                found.append(m_clean)
        return found

    # =========================================================================
    # PILLAR 3: "UNSTICK ME" HELPER & SOLUTION CHECKER
    # =========================================================================
    def generate_unstick_aid(self, question_text: str, current_notes: str = "") -> Dict[str, Any]:
        """
        Generates cognitive scaffolding when the user freezes:
        - plain_english: ELI5 rewrite of academic jargon
        - starter_template: Fill-in-the-blank prompt injected into scratchpad
        - micro_steps: 3 micro-actions under 3 minutes each
        """
        if self.llm.is_available():
            prompt = f"""You are FocusMate Local, an expert, encouraging tutor for ADHD learners.
The student is stuck on this assignment question:
\"\"\"{question_text}\"\"\"

Their current scratchpad notes so far:
\"\"\"{current_notes or '(empty scratchpad)'}\"\"\"

Generate JSON with:
1. "plain_english": An intuitive, calm explanation in everyday conversational English. Avoid intimidation.
2. "starter_template": A fill-in-the-blank starter template tailored to this exact question, so the student never faces a blank page.
3. "micro_steps": Exactly 3 checkable micro-actions taking under 2 minutes each.

Return STRICT JSON:
{{
  "plain_english": "...",
  "starter_template": "...",
  "micro_steps": ["Step 1...", "Step 2...", "Step 3..."]
}}
"""
            llm_result = self.llm.generate(prompt=prompt, system="Output only valid JSON.")
            if llm_result.get("success"):
                try:
                    resp_text = llm_result["response"]
                    if "```json" in resp_text:
                        resp_text = resp_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in resp_text:
                        resp_text = resp_text.split("```")[1].split("```")[0].strip()
                    data = json.loads(resp_text)
                    if data.get("plain_english") and data.get("starter_template"):
                        data["llm_powered"] = True
                        data["tokens_per_sec"] = llm_result.get("tokens_per_sec", 0.0)
                        return data
                except Exception:
                    pass

        # Offline Intelligent Heuristic Scaffolding
        return self._heuristic_unstick_aid(question_text, current_notes)

    def _heuristic_unstick_aid(self, question: str, notes: str) -> Dict[str, Any]:
        """Generates instant, high-quality fill-in-the-blank scaffolding without waiting."""
        is_math = bool(re.search(r'\d+|calculate|find|solve|derive|formula|hz|ohm|v|watt|kg|impedance|frequency', question, re.I))
        is_code = bool(re.search(r'code|function|algorithm|class|python|c\+\+|program|loop|array', question, re.I))
        is_concept = bool(re.search(r'explain|describe|what is|define|compare|differentiate|significance', question, re.I))

        # 1. Plain English Rewrite
        first_clause = question.split('.')[0].strip()
        plain = f"The core task is: {first_clause}. You don't need to write a thesis—just identify the known values and apply the single formula connecting them."

        # 2. Fill-in-the-Blank Starter Template
        if is_math:
            template = (
                "1. Given Values:\n"
                "   • Parameter 1 = ___\n"
                "   • Parameter 2 = ___\n\n"
                "2. Relevant Formula:\n"
                "   • Formula: [e.g. f_0 = 1 / (2 * π * √(L * C))]\n\n"
                "3. Substitution Line:\n"
                "   • Result = ___ / ___\n\n"
                "4. Final Answer:\n"
                "   • Output = ___ (units: ___)"
            )
        elif is_code:
            template = (
                "# 1. Input & Expected Output\n"
                "# Input: ___\n"
                "# Output: ___\n\n"
                "# 2. Step-by-Step Logic\n"
                "# 1. Initialize result = ___\n"
                "# 2. Loop through each item:\n"
                "# 3. Return result\n\n"
                "def solve(data):\n"
                "    pass\n"
            )
        elif is_concept:
            template = (
                "1. Core Definition (In Plain Words):\n"
                "   • In simple terms, this represents ___\n\n"
                "2. Key Characteristics:\n"
                "   • Property A: ___\n"
                "   • Property B: ___\n\n"
                "3. Real-World Application:\n"
                "   • For example, in electrical tuning, this helps ___."
            )
        else:
            template = (
                "1. Main Objective:\n"
                "   • The key goal is to solve: ___\n\n"
                "2. Action Steps:\n"
                "   • Step 1: ___\n"
                "   • Step 2: ___\n\n"
                "3. Conclusion:\n"
                "   • Therefore, ___."
            )

        micro_steps = [
            "Spot and write down the two main numbers in the question.",
            "Fill in line 1 of the scratchpad template above.",
            "Write the formula or one single line of calculation."
        ]

        return {
            "plain_english": plain,
            "starter_template": template,
            "micro_steps": micro_steps,
            "llm_powered": False
        }

    def check_student_thinking(self, question: str, notes: str) -> Dict[str, Any]:
        """
        Validates the student's work in real-time.
        Gives encouraging, non-judgmental feedback without spoiling answers.
        """
        notes_clean = notes.strip()
        if not notes_clean:
            return {
                "feedback": "Your scratchpad is empty right now. Click 'Make This Easier' to insert a starter template so you don't face a blank page!"
            }

        if self.llm.is_available():
            prompt = f"""You are FocusMate Local, an ADHD-friendly academic coach.
Question:
\"\"\"{question}\"\"\"

Student's Working Notes:
\"\"\"{notes_clean}\"\"\"

Provide 2-3 short, encouraging sentences of feedback:
1. Validate what they have done correctly so far (build confidence!).
2. Gently point out the exact next small calculation or formula line to write.
Do not write out the full final solution—guide them to the next step.
"""
            llm_result = self.llm.generate(prompt=prompt)
            if llm_result.get("success"):
                return {"feedback": llm_result["response"].strip()}

        # Heuristic Feedback
        word_count = len(notes_clean.split())
        if word_count < 10:
            return {
                "feedback": "Great start writing down the initial parameters! Next, write down the formula that connects your given values to the target answer."
            }
        elif "=" in notes_clean and any(u in notes_clean.lower() for u in ["ohm", "hz", "v", "a", "q", "f"]):
            return {
                "feedback": "Excellent work! You have laid out the values and equations clearly. Make sure to double check unit conversions (e.g. µF to Farads, mH to Henrys) in your final line."
            }
        else:
            return {
                "feedback": "You are making solid progress. Try breaking down your calculation into one single substitution line to find the final numerical answer."
            }

    # =========================================================================
    # PILLAR 4: AUTOMATIC BREADCRUMB RECOVERY
    # =========================================================================
    def save_breadcrumb(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Persists a mental breadcrumb checkpoint to local storage:
        - current_question_index
        - current_question_title
        - scratchpad_snippet (last typed thoughts)
        - completed_questions (list of IDs/titles)
        - timestamp
        - elapsed_seconds
        """
        state["timestamp"] = time.time()
        state["formatted_time"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(state["timestamp"]))
        
        q_title = state.get("current_question_title", "Current Question")
        scratchpad = state.get("scratchpad_text", "").strip()
        if not scratchpad:
            next_step = f"Open {q_title} and click 'Make This Easier' to fill in the starter template."
        elif "1." in scratchpad and "2." not in scratchpad:
            next_step = f"Fill in Formula line for {q_title}."
        else:
            last_line = [line for line in scratchpad.split("\n") if line.strip()][-1] if scratchpad else ""
            next_step = f"Continue right after your last note: '{last_line[:30]}...'."

        state["next_action"] = next_step

        try:
            with open(self.breadcrumbs_path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2)
            return {"status": "saved", "breadcrumb": state}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_breadcrumb(self) -> Optional[Dict[str, Any]]:
        """Retrieves the last saved mental breadcrumb for zero-effort resume."""
        if os.path.exists(self.breadcrumbs_path):
            try:
                with open(self.breadcrumbs_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None
