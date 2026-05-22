---
description: "Compare estimated token usage between full memory reads and optimized synthesis."
---

# Token Report

Compare estimated token usage between the full durable-memory read and the optimized synthesis flow.

Use this when:

- you want a quick estimate of how much context the SQLite cache saves
- you want to compare the full `.md` backup size against the optimized synthesis path

Call:

`speckit_memory_token_report(feature="specs/<feature>")`

Report:

- baseline full durable memory read
- optimized index-and-synthesis flow
- estimated token reduction

When the optimizer is enabled, the same baseline/cached/saved summary should be surfaced after memory-aware MCP search and synthesis runs so the comparison stays visible during normal use.

Token counts are estimates using `@dqbd/tiktoken` with the **`cl100k_base` encoding (GPT-4 calibrated)**.
Actual provider billing tokens may differ. Use these calibration factors when interpreting results for other models:

| Model family | Adjustment |
|---|---|
| GPT-4 / GPT-4o | ×1.00 (baseline) |
| Claude 3.x / 3.5 / 3.7 | ×1.05–1.15 (slightly higher token count) |
| Gemini 1.5 / 2.x | ×0.90–1.10 (varies by content type) |
| Llama / Mistral | ×1.10–1.30 (depends on tokenizer) |

These multipliers are rough estimates. They indicate how many tokens the model will actually consume relative to the `cl100k_base` count. Use them as a planning guide, not billing telemetry.
