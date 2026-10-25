# Graph Report - lmniit-hackathon  (2026-10-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 93 nodes · 153 edges · 16 communities (4 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 4
- Community 6
- Community 7
- Community 11
- Community 12
- Community 13

## God Nodes (most connected - your core abstractions)
1. `FocusMateAgent` - 14 edges
2. `LocalLLMClient` - 11 edges
3. `run_3_repeat_runs()` - 11 edges
4. `export_session()` - 5 edges
5. `get_system_status()` - 4 edges
6. `parse_catch_all()` - 4 edges
7. `unstick_me()` - 4 edges
8. `upload_pdf()` - 4 edges
9. `renderLaterDrawerItems()` - 4 edges
10. `chunk_text()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `FocusMateAgent` --uses--> `LocalLLMClient`  [INFERRED]
  app/agent.py → app/ollama_client.py
- `run_benchmark()` --calls--> `run_3_repeat_runs()`  [EXTRACTED]
  app/main.py → app/benchmark.py
- `run_3_repeat_runs()` --calls--> `FocusMateAgent`  [EXTRACTED]
  app/benchmark.py → app/agent.py
- `run_3_repeat_runs()` --calls--> `LocalLLMClient`  [EXTRACTED]
  app/benchmark.py → app/ollama_client.py

## Import Cycles
- None detected.

## Communities (16 total, 12 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.20
Nodes (4): export_session(), get_breadcrumb(), get_system_status(), serve_index()

### Community 2 - "Community 2"
Cohesion: 0.31
Nodes (7): insertAtCursor(), renderCurrentQuestion(), renderLaterDrawerItems(), saveBreadcrumbCheckpoint(), saveCurrentScratchpad(), updateLaterDrawerBadge(), updateWordCount()

### Community 4 - "Community 4"
Cohesion: 0.43
Nodes (3): FocusMateAgent, run_3_repeat_runs(), LocalLLMClient

### Community 6 - "Community 6"
Cohesion: 0.40
Nodes (3): BreadcrumbSaveRequest, chunk_text(), ChunkTextRequest

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FocusMateAgent` connect `Community 4` to `Community 0`, `Community 3`, `Community 5`, `Community 8`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `run_3_repeat_runs()` (e.g. with `.chunk_text_to_questions()` and `.generate_unstick_aid()`) actually correct?**
  _`run_3_repeat_runs()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Why does `LocalLLMClient` connect `Community 4` to `Community 0`, `Community 3`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `run_3_repeat_runs()` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`, `Community 7`, `Community 8`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._