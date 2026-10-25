# FocusMate Local: The Guided Work Desk

**A GPS for your study session.** Drop in an assignment PDF and FocusMate shows one question at a time, helps you start, and remembers where you stopped. Everything runs on-device with a 1.5B model. No external APIs.

**Track:** Local Inference Agents | **Team:** The Trinity (Khilin Tak, Murat Mahnot, Dhruv Pankaj Samariya) | **Event:** Hack Day Jaipur

<!-- TODO: add 2 or 3 screenshots here: split-view desk, Resume Card, negative-overtime timer
![Desk view](docs/desk.png) -->

---

## The Problem

**Who:** Students and self-directed knowledge workers, especially neurodivergent users (ADHD, executive dysfunction), who freeze when facing a dense 15-page PDF or a multi-step technical assignment.

**Why existing tools fail:** they make the user manage the app instead of the work.

| Pain point | What happens |
|---|---|
| Window-switching paralysis | PDF viewer, to-do list and notes live in 3 windows. Every switch risks losing attention for good. |
| Dense academic overload | Opening a 15-page PDF causes an instant freeze. Summarising it does not answer the assignment questions. |
| Blank page paralysis | An empty notes file with no first formula or step leads to hours of procrastination. |
| Context loss on interruption | After lunch or a phone call, re-orienting takes about 15 minutes, and many sessions are abandoned. |
| Timer anxiety | A harsh buzz at 00:00 creates guilt and panic that derail working memory. |

## The Idea

Google Maps does not show all 500 turns at once. FocusMate does the same for study: one piece at a time, with a route back if you get lost.

### Four pillars

1. **Universal Catch-All.** Drop the PDF and type or dictate a raw brain dump ("finish assignment by 6, gym, dinner, call mom, revise Chapter 2"). The agent separates immediate study work from later reminders and parks the reminders in a low-guilt **Later Drawer**.
2. **Chunked Reader and Scratchpad.** The screen splits in two. The left panel shows only one atomic question, with given values (for example R = 10 Ω, L = 0.1 H, 50 Hz) highlighted automatically. The right panel is an auto-saving scratchpad with quick formula insertion.
3. **Unstick Me and Cognitive Checker.**
   - *Make This Easier* gives a plain-English explanation, a fill-in-the-blank starter (Given Values, Formula, Substitution) injected straight into the scratchpad, and 3 micro-steps of under 2 minutes each.
   - *Am I on track?* reviews your scratchpad notes and gives encouragement and guidance without spoiling the final answer.
4. **Breadcrumb Recovery (signature feature).** A checkpoint is saved on every keystroke and question change. When you return from a break, a calm **Resume Card** shows what you completed, exactly where you stopped (question and typed snippet), and a concrete next 3-minute step. If energy is low, *Switch to a Lighter Task* swaps a heavy question for a 2-minute errand to rebuild momentum.

### Cognitive shield features

- **Distraction Interceptor** (⚡ Intrusive thought?). Type a distraction in the study ribbon and press Enter. It is parked in the Later Drawer without breaking your flow.
- **Agent triage.** Parked thoughts are sorted into Quick Wins, Post-Session errands and Evening Downtime, with short cognitive advice.
- **Full-screen task timer with negative overtime.** At 00:00 the timer keeps counting into negative time (-00:15, -01:23) with a warm terracotta glow. No alarm, no panic, just room to wrap up.
- **Study sprint timer.** A quiet pill in the ribbon (10, 15, 20, 25, 30 or 45 min). When done, it offers a 1 to 5 minute recharge break or +5 min of flow.
- **Completion screen.** When every question is solved, you see problems solved, scratchpad words typed, distractions shielded, and a one-click Markdown export of the assignment.

### Design

Warm linen and cream tones, editorial serif type (Newsreader) and quiet layouts, inspired by The Moment Journal. No neon gradients or AI glow. Fully responsive, with automatic reading and working tab toggling on mobile.

---

## Quick Start

**Requirements:** Windows, macOS or Linux, Python 3.10+ (tested on 3.14), and [Ollama](https://ollama.com) installed and running locally (required for the local model).

```bash
# 1. Install dependencies
pip install fastapi uvicorn pydantic requests pypdf python-multipart graphifyy

# 2. Download the model
ollama pull qwen2.5:1.5b

# 3. Start the app (or double-click run.bat on Windows)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open <http://localhost:8000>.

### Try it in 60 seconds

1. In the Universal Catch-All box, click **💡 Try Mixed Brain Dump**.
2. Click **📑 Load EEE Lab 4 (Sample PDF)**, then **Auto-Sort & Set Up Desk →**.
3. Question 1 appears on the left with its given values extracted. The scratchpad is on the right.
4. Click **✨ Make This Easier**, then **📥 Inject into Scratchpad**.
5. Click **💬 Am I on track?** for feedback on your notes.
6. Type an intrusive thought in the ribbon (for example "Buy protein powder") and park it.
7. Open the **Later Drawer**, click **⏱️ Start Timer**, and watch the timer go into negative overtime.

### 3-minute judge demo plan

| Time | Segment |
|---|---|
| 0:00 to 0:30 | Problem and target user: window-switching friction and PDF overwhelm |
| 0:30 to 1:45 | Live workflow (steps above), ending on the completion screen |
| 1:45 to 2:20 | Local model and architecture: on-device Qwen2.5 1.5B via Ollama, zero external APIs |
| 2:20 to 2:45 | Benchmark and reliability |
| 2:45 to 3:00 | Limitations and next steps |

---

## Architecture

```
Browser UI  <-->  FastAPI backend (app.main)  <-->  Ollama daemon (127.0.0.1:11434)
 (reader,            PDF parsing (pypdf)               qwen2.5:1.5b, Q4_K_M
  scratchpad,        chunking, triage, prompts         100% on-device
  timers)            checkpoint storage
```

Every request stays on `127.0.0.1`. The app was verified end to end with Wi-Fi disconnected.

## Model Details

| Item | Value |
|---|---|
| Model | qwen2.5:1.5b (1.54B parameters) |
| Licence | Apache-2.0 (open weights) |
| Quantization | Q4_K_M (4-bit) |
| Runtime | Ollama local daemon, Python 3.14 backend |
| External APIs | None (0) |
| Laptop | HP OMEN Gaming Laptop 16, Windows 11 Home 64-bit |
| CPU | Intel Core i7-14650HX (16 cores, 24 threads) |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU, 8 GB GDDR6 |
| RAM | 24 GB DDR5 @ 5600 MT/s |

## Results

Hardware as above. Each workflow was run on the local model.

| Run | Workflow | Latency | Tokens | Speed | Status |
|---|---|---|---|---|---|
| 1 | Universal Catch-All categorization | 1564.23 ms | ~68 | 43.47 tok/s | Passed |
| 2 | Academic question chunking and extraction | 0.31 ms | n/a | n/a | Passed |
| 3 | Unstick scaffolding and fill-in-the-blank generation | 1320.40 ms | ~105 | 79.52 tok/s | Passed |

- **Task success rate:** 100% (3/3).
- **Model-backed runs (1 and 3):** average latency about 1.44 s, average throughput about 61.5 tok/s with CUDA acceleration on the RTX 5060.
- **Note on Run 2:** chunking and given-value extraction is handled by the parser rather than the model (verify and edit this line to match your code), so no token throughput is reported for it. It is excluded from the tok/s average.

<!-- TODO: replace with true repeat runs: run each workflow 3 times and report mean, min and max latency. -->

## Known Limitations

- PDF tables with merged cells are extracted as linear text.
- Scanned, image-only PDFs and handwriting need an OCR preprocessing layer.
- A 1.5B model gives uneven scaffolding quality on hard or unusual questions, and the accuracy of *Am I on track?* has not been formally evaluated.

## Future Scope

- **Offline voice capture:** whisper.cpp (GGML) for fully offline dictation.
- **Multimodal parsing:** Gemma 3 4B or Qwen2-VL for circuit diagrams and handwritten math.
- **LMS sync:** offline export to Canvas, Google Classroom and Moodle.

## Code Graph (Graphify)

- Interactive graph: `graphify-out/graph.html`
- Report: `graphify-out/GRAPH_REPORT.md`
- 106 nodes, 174 edges, 14 code communities (Graphify AST extractor)
- Shared in the Hack Day Jaipur Discord channel
- Agent skill specification: `SKILL.md`, conforming to [agentskills.io/specification](https://agentskills.io/specification)

## Licence

Application code: **MIT** (see `LICENSE`). Model weights (Qwen2.5): **Apache-2.0**.
