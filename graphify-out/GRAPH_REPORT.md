# Graph Report - lmniit-hackathon  (2026-10-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 106 nodes · 174 edges · 14 communities (2 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13

## God Nodes (most connected - your core abstractions)
1. `FocusMateAgent` - 16 edges
2. `run_3_repeat_runs()` - 11 edges
3. `LocalLLMClient` - 10 edges
4. `export_session()` - 5 edges
5. `get_system_status()` - 4 edges
6. `chunk_text()` - 4 edges
7. `synthesize_roadmap()` - 4 edges
8. `unstick_me()` - 4 edges
9. `renderLaterDrawerItems()` - 4 edges
10. `run_benchmark()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `run_3_repeat_runs()` --calls--> `FocusMateAgent`  [EXTRACTED]
  app/benchmark.py → app/agent.py
- `run_benchmark()` --calls--> `run_3_repeat_runs()`  [EXTRACTED]
  app/main.py → app/benchmark.py
- `run_3_repeat_runs()` --calls--> `LocalLLMClient`  [EXTRACTED]
  app/benchmark.py → app/ollama_client.py

## Import Cycles
- None detected.

## Communities (14 total, 12 thin omitted)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (3): generate_markdown_table(), run_3_repeat_runs(), LocalLLMClient

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (7): insertAtCursor(), renderCurrentQuestion(), renderLaterDrawerItems(), saveBreadcrumbCheckpoint(), saveCurrentScratchpad(), updateLaterDrawerBadge(), updateWordCount()

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FocusMateAgent` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `run_3_repeat_runs()` (e.g. with `.chunk_text_to_questions()` and `.generate_unstick_aid()`) actually correct?**
  _`run_3_repeat_runs()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `LocalLLMClient` connect `Community 2` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `run_3_repeat_runs()` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._