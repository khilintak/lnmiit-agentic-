"""
FocusMate Local - Core Agent Logic
Coordinates the 4 Pillars of the Guided Work Desk:
1. Universal Catch-All (Separates immediate study vs later reminders)
2. Chunked Reader & Scratchpad (Atomic questions without overload)
3. Unstick Me Scaffolding (ELI5, Fill-in-the-blank starter templates, Micro-steps)
4. Mental Breadcrumb State Recovery (Zero-effort session restoration)
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
        Takes messy mixed text (e.g. 'Finish this assignment by 6 PM, buy notebook, call home, revise Chapter 2')
        and partitions into:
        - immediate_study: The core assignment / subject focus
        - later_drawer: Low-guilt parking lot for errands, phone calls, chores
        """
        raw_input = raw_input.strip()
        if not raw_input:
            return {"immediate_study": [], "later_drawer": []}

        # Check if local Ollama LLM is available for nuanced NLP extraction
        if self.llm.is_available():
            prompt = f"""You are FocusMate Local, an ADHD-support cognitive assistant.
Parse the following mixed brain-dump into two distinct JSON categories:
1. "immediate_study": Tasks or assignment materials that represent the primary academic/work focus to do right now.
2. "later_drawer": Tasks like errands, calls, chores, or secondary reminders that should be parked safely to clear mental RAM.

For each item in later_drawer, include:
- "title": concise task name
- "category": one of ["errand", "call", "chore", "review", "personal"]
- "estimated_minutes": quick estimate like 2, 5, or 10
- "is_quick_win": true if under 5 minutes

Input brain dump:
\"\"\"{raw_input}\"\"\"

Return STRICTLY valid JSON with structure:
{{
  "immediate_study": [{{"title": "...", "description": "...", "priority": "high"}}],
  "later_drawer": [{{"title": "...", "category": "...", "estimated_minutes": 2, "is_quick_win": true}}]
}}
"""
            llm_result = self.llm.generate(prompt=prompt, system="Output only valid JSON.")
            if llm_result.get("success"):
                try:
                    # Clean potential markdown fences
                    resp_text = llm_result["response"]
                    if "```json" in resp_text:
                        resp_text = resp_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in resp_text:
                        resp_text = resp_text.split("```")[1].split("```")[0].strip()
                    parsed = json.loads(resp_text)
                    parsed["llm_powered"] = True
                    parsed["tokens_per_sec"] = llm_result.get("tokens_per_sec", 0.0)
                    return parsed
                except Exception:
                    pass

        # Robust Built-in Heuristic Parser (Fast, Offline, Deterministic)
        return self._heuristic_catch_all_parser(raw_input)

    def _heuristic_catch_all_parser(self, text: str) -> Dict[str, Any]:
        """Deterministic offline rule-based parser for mixed thoughts."""
        phrases = [p.strip() for p in re.split(r'[,;\n]|\band\b', text, flags=re.IGNORECASE) if p.strip()]
        
        later_keywords = {
            "buy": ("errand", 5, True),
            "purchase": ("errand", 10, False),
            "call": ("call", 5, True),
            "phone": ("call", 5, True),
            "message": ("call", 2, True),
            "text": ("call", 2, True),
            "email": ("call", 5, True),
            "clean": ("chore", 10, False),
            "wash": ("chore", 10, False),
            "laundry": ("chore", 15, False),
            "eat": ("personal", 15, False),
            "lunch": ("personal", 20, False),
            "dinner": ("personal", 20, False),
            "water": ("personal", 1, True),
            "drink": ("personal", 1, True),
            "remind": ("personal", 2, True),
            "medicine": ("personal", 1, True),
            "pill": ("personal", 1, True),
        }

        study_keywords = ["assignment", "study", "homework", "chapter", "read", "revise", "solve", "problem", "write", "pdf", "lab", "math", "code", "report"]

        immediate_study = []
        later_drawer = []

        for p in phrases:
            lower_p = p.lower()
            matched_later = False
            for kw, (cat, est_mins, quick_win) in later_keywords.items():
                if kw in lower_p.split() or lower_p.startswith(kw):
                    later_drawer.append({
                        "title": p.capitalize(),
                        "category": cat,
                        "estimated_minutes": est_mins,
                        "is_quick_win": quick_win
                    })
                    matched_later = True
                    break
            
            if not matched_later:
                # Check study indicators or default to study
                is_study = any(skw in lower_p for skw in study_keywords) or len(p) > 20
                if is_study or not immediate_study:
                    immediate_study.append({
                        "title": p.capitalize(),
                        "description": "Primary study objective",
                        "priority": "high"
                    })
                else:
                    later_drawer.append({
                        "title": p.capitalize(),
                        "category": "personal",
                        "estimated_minutes": 5,
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
        Splits academic text into structured questions/tasks with difficulty & estimated duration.
        """
        # Patterns for questions: "Question 1", "Problem 1", "Q1.", "1.", "Exercise 1"
        pattern = r'(?=(?:(?:\n|^)(?:Question|Problem|Q\.|Exercise|Task)\s*[\d]+|(?:(?:\n|^)[\d]{1,2}[\.\)]\s+)))'
        splits = [s.strip() for s in re.split(pattern, text, flags=re.IGNORECASE) if s.strip()]

        # Filter out tiny headers or page markers
        chunks = []
        q_counter = 1
        for s in splits:
            clean = re.sub(r'--- Page \d+ ---', '', s).strip()
            if len(clean) < 15:
                continue
            
            # Extract title (first line)
            lines = clean.split('\n')
            first_line = lines[0].strip()
            body = "\n".join(lines[1:]).strip() if len(lines) > 1 else clean

            title = first_line if len(first_line) < 80 else f"Question {q_counter}"
            if not any(k in title.lower() for k in ["question", "problem", "q", "task", "part"]):
                title = f"Question {q_counter}: {title[:40]}..."

            chunks.append({
                "id": f"q_{q_counter}",
                "step_number": q_counter,
                "title": title,
                "body": clean,
                "estimated_minutes": 10 + (len(clean) // 100) * 2,
                "source": source
            })
            q_counter += 1

        if not chunks:
            # Fallback if no explicit numbered questions were found: split by logical paragraphs
            paras = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            for idx, p in enumerate(paras[:6], 1):
                chunks.append({
                    "id": f"sec_{idx}",
                    "step_number": idx,
                    "title": f"Study Block {idx}",
                    "body": p,
                    "estimated_minutes": 8,
                    "source": source
                })

        return chunks

    # =========================================================================
    # PILLAR 3: "UNSTICK ME" HELPER (REAL-TIME TASK SHRINKING)
    # =========================================================================
    def generate_unstick_aid(self, question_text: str, current_notes: str = "", aid_type: str = "all") -> Dict[str, Any]:
        """
        Generates cognitive scaffolding when the user freezes:
        - plain_english: ELI5 rewrite of academic jargon
        - starter_template: Fill-in-the-blank prompt injected into scratchpad
        - micro_steps: 3 micro-actions under 3 minutes each
        """
        # If Ollama is available, use generative local model
        if self.llm.is_available():
            prompt = f"""You are the FocusMate Local ADHD Unstick Engine.
The student is stuck on this assignment question:
\"\"\"{question_text}\"\"\"

Their current scratchpad notes so far:
\"\"\"{current_notes or '(scratchpad is currently empty)'}\"\"\"

Generate a response in JSON with these 3 helpful scaffoldings:
1. "plain_english": Rewrite the question in simple, friendly, everyday conversational language. Use an intuitive analogy if helpful.
2. "starter_template": A fill-in-the-blank starter template to paste directly into their scratchpad so they don't face a blank page. Example format:
   Step 1: Given parameters:
   - Input A = ___
   - Input B = ___
   Step 2: Relevant formula:
   ...
   Step 3: Answer:
3. "micro_steps": A list of exactly 3 very small, concrete, 2-minute steps they can tick off.

Return STRICT JSON format:
{{
  "plain_english": "...",
  "starter_template": "...",
  "micro_steps": ["Step 1...", "Step 2...", "Step 3..."]
}}
"""
            llm_result = self.llm.generate(prompt=prompt, system="You are an expert tutor for neurodivergent students. Return ONLY JSON.")
            if llm_result.get("success"):
                try:
                    resp_text = llm_result["response"]
                    if "```json" in resp_text:
                        resp_text = resp_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in resp_text:
                        resp_text = resp_text.split("```")[1].split("```")[0].strip()
                    data = json.loads(resp_text)
                    data["llm_powered"] = True
                    data["tokens_per_sec"] = llm_result.get("tokens_per_sec", 0.0)
                    return data
                except Exception:
                    pass

        # Offline Intelligent Heuristic Scaffolding
        return self._heuristic_unstick_aid(question_text, current_notes)

    def _heuristic_unstick_aid(self, question: str, notes: str) -> Dict[str, Any]:
        """Generates instant, high-quality fill-in-the-blank scaffolding without waiting."""
        # Detect problem characteristics (math, definition, analysis, code)
        is_math = bool(re.search(r'\d+|calculate|find|solve|derive|formula|hz|ohm|v|watt|kg|impedance', question, re.I))
        is_code = bool(re.search(r'code|function|algorithm|class|python|c\+\+|program|loop|array', question, re.I))
        is_concept = bool(re.search(r'explain|describe|what is|define|compare|differentiate', question, re.I))

        # 1. Plain English Rewrite
        first_sentence = question.split('.')[0].strip()
        plain = f"In simple terms: The question is asking you to break down '{first_sentence}'. Don't worry about writing an essay—just identify the core inputs and the goal."

        # 2. Fill-in-the-Blank Starter Template
        if is_math:
            template = (
                "### Step 1: Write Down What's Given\n"
                "- Input 1 = ___\n"
                "- Input 2 = ___\n\n"
                "### Step 2: Formula to Use\n"
                "- Formula: [Write formula here, e.g. Y = f(X)]\n\n"
                "### Step 3: Substitute Values\n"
                "- Calculation: ___ = ___\n\n"
                "### Final Answer\n"
                "- Output = ___ (units: ___)"
            )
        elif is_code:
            template = (
                "# Step 1: What is the expected input and output?\n"
                "# Input: ___\n"
                "# Output: ___\n\n"
                "# Step 2: Pseudocode / Logic\n"
                "# 1. Initialize variable ___ = ___\n"
                "# 2. Loop through ___:\n"
                "# 3. Return ___\n\n"
                "def solve():\n"
                "    pass\n"
            )
        elif is_concept:
            template = (
                "### 1. Core Definition (In My Own Words)\n"
                "- At its heart, this is basically ___\n\n"
                "### 2. Key Characteristics / Working\n"
                "- Characteristic A: ___\n"
                "- Characteristic B: ___\n\n"
                "### 3. Real-World Example\n"
                "- For instance, think of how ___ works when ___."
            )
        else:
            template = (
                "### 1. Key Objective\n"
                "- The main thing to solve is: ___\n\n"
                "### 2. Supporting Points / Evidence\n"
                "- Point 1: ___\n"
                "- Point 2: ___\n\n"
                "### 3. Conclusion\n"
                "- Therefore: ___."
            )

        # 3. Micro-Steps
        micro_steps = [
            "Spot the 2 most important numbers or terms in the question.",
            "Fill in Step 1 of the scratchpad template above.",
            "Write one single sentence or calculation line to wrap it up."
        ]

        return {
            "plain_english": plain,
            "starter_template": template,
            "micro_steps": micro_steps,
            "llm_powered": False
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
        
        # Synthesize next 3-minute micro-step
        q_title = state.get("current_question_title", "Current Question")
        scratchpad = state.get("scratchpad_text", "").strip()
        if not scratchpad:
            next_step = f"Open {q_title} and click 'Make This Easier' to fill in the starter template."
        elif "Step 1" in scratchpad and "Step 2" not in scratchpad:
            next_step = f"Fill in Step 2 formula in your scratchpad for {q_title}."
        else:
            last_line = [line for line in scratchpad.split("\n") if line.strip()][-1] if scratchpad else ""
            next_step = f"Continue right after your last note: '{last_line[:35]}...'."

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
