---
description: "Compare estimated token usage between full memory reads and optimized synthesis."
---

# Token Report

Compare estimated token usage between the full durable-memory read and the optimized synthesis flow.

Use this when:

- you want a quick estimate of how much context the optimizer saves
- you are deciding whether the optional SQLite cache is worth enabling for a repo
- you want to compare the baseline markdown-only read against the synthesis path

When the optimizer is enabled and the CLI is available, run:

```bash
cd .specify/extensions/memory-md && npx speckit-memory token-report --feature specs/<feature>
```

Report:

- baseline full durable memory read
- optimized index-and-synthesis flow
- estimated token reduction

When the optimizer is enabled, the same baseline/cached/saved summary is also printed automatically by memory-aware `search-memory` and `synthesize` runs so the comparison stays visible during normal use.

Token counts are estimates using `@dqbd/tiktoken` with the **`cl100k_base` encoding (GPT-4 calibrated)**.
Actual provider billing tokens may differ. Use these calibration factors when interpreting results for other models:

| Model family | Adjustment |
|---|---|
| GPT-4 / GPT-4o | ×1.00 (baseline) |
| Claude 3.x / 3.5 / 3.7 | ×1.05–1.15 (slightly higher token count) |
| Gemini 1.5 / 2.x | ×0.90–1.10 (varies by content type) |
| Llama / Mistral | ×1.10–1.30 (depends on tokenizer) |

These multipliers are rough estimates. They indicate how many tokens the model will actually consume relative to the `cl100k_base` count. Use them as a planning guide, not billing telemetry.

If the optimizer is disabled or unavailable, report the markdown-only baseline and note that the optimized comparison could not be measured.
