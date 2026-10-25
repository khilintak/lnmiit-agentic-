---
name: focusmate-study-desk
description: "AI-guided single-window study and task execution agent designed for ADHD/neurodivergent learners. Ingests messy catch-all dumps, extracts immediate assignment steps from PDFs/text, parks distractions into a Later Drawer, dissolves writer's block with scaffolded fill-in-the-blank templates, and provides zero-effort breadcrumb recovery."
version: 1.0.0
authors:
  - Khilin Tak
repository: https://github.com/khilintak/lnmiit-agentic-
tags:
  - adhd-support
  - local-inference
  - study-agent
  - task-chunking
  - cognitive-scaffolding
---

# FocusMate Local: Guided Study & Work Desk Agent

FocusMate Local functions as a real-time GPS for study sessions, preventing ADHD executive dysfunction, tab-switching paralysis, and forgotten progress.

## Agent Capabilities

### 1. Universal Catch-All Parser (`parse_catch_all`)
- Accepts raw, disorganized stream-of-consciousness text or voice transcripts combined with study files (PDFs/notes).
- Uses local semantic reasoning to isolate **Immediate Study Directives** from **Later Reminders / Errands**.
- Automatically routes reminders into a secure "Later Drawer" to clear mental RAM.

### 2. Chunked Extraction & Step Stepper (`chunk_material`)
- Extracts academic questions or sections from documents.
- Presents only **one atomic question** at a time in a high-focus, distraction-free view.
- Precludes visual overwhelm and scrolling exhaustion.

### 3. Cognitive Unsticker (`generate_scaffolding`)
- **ELI5 / Everyday Translation**: Translates formal, dense academic statements into plain, concrete language.
- **Fill-in-the-Blank Scaffolding**: Generates a tailored starter template (Given parameters, formula, calculation lines) injected directly into the user's active scratchpad.
- **Micro-Step Breakdown**: Splits multi-stage questions into three 2-minute actionable steps.

### 4. Zero-Effort Mental Breadcrumb Recovery (`manage_breadcrumbs`)
- Captures automated checkpoints (current question, active scratchpad notes, elapsed focus duration).
- On resume, displays a structured **Resume Card** eliminating re-orientation friction:
  - Completed items.
  - Stopped step snapshot.
  - Recommended next 3-minute action.
  - Energy-based task rerouting option.

## Local Runtime Compatibility
- Compatible with Ollama (`llama3.2:3b`, `qwen2.5:1.5b`, `qwen3:1.7b`) on `http://127.0.0.1:11434`.
- Fallback deterministic cognitive heuristics when running fully disconnected.
