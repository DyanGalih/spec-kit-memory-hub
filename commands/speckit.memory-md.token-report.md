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

Token counts are estimates using `@dqbd/tiktoken` with the **`cl100k_base` encoding (GPT-4 calibrated)**.
Actual provider billing tokens may differ. For Claude or Gemini, estimates may be 15–30% off.


If the optimizer is disabled or unavailable, report the markdown-only baseline and note that the optimized comparison could not be measured.
