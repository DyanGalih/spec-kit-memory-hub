---
description: "Centralized context preparation: refresh cache, search memory, and refresh synthesis."
---

# Prepare Context

Use this command to prepare the technical and historical context for the current task.

## Usage

Run this command by providing the feature directory and an optional search query.

```text
/speckit.memory-md.prepare-context --feature specs/<feature> --query "<optional_search_terms>"
```

## Optimizer-Aware Flow

When `.specify/extensions/memory-md/config.yml` has `optimizer.enabled: true` and the CLI is available:

### Phase 1 — Durable Memory (always run)

1. **Refresh Memory Cache**: Execute `cd .specify/extensions/memory-md && npx speckit-memory refresh-memory`.
2. **Search Memory (Optional)**: If a custom query is provided, execute `npx speckit-memory search-memory "$QUERY"`.
3. **Memory Synthesis**: Execute `npx speckit-memory synthesize --feature $FEATURE ${QUERY ? '--query "$QUERY"' : ''}`.
4. **Read Results**: Read `specs/<feature>/memory-synthesis.md`.

### Phase 2 — Development Docs (run when doc cache is populated)

Check whether the Phase 2 doc cache has been populated: `npx speckit-memory audit-docs` should show `Indexed doc entries: N` where N > 0.

If the doc cache is populated:
5. **Refresh Doc Cache**: Execute `npx speckit-memory refresh-docs` (skips unchanged files).
6. **Doc Synthesis**: Execute `npx speckit-memory synthesize-docs --feature $FEATURE`.
7. **Read Results**: Read `specs/<feature>/doc-synthesis.md` in place of opening individual spec, plan, tasks, and constitution files.

If the doc cache is empty (first use or not yet indexed):
5. Run `npx speckit-memory index-docs` to build the cache, then execute steps 6–7.
   Alternatively, skip Phase 2 and read `specs/<feature>/spec.md`, `plan.md`, `tasks.md` directly for this turn.

**Token Banner**: Show the baseline / cached / saved token summary after the synthesis step so the savings stay visible during normal runs.

## Markdown-Only Flow

When the optimizer is disabled, fall back to manual index retrieval:
1. Run `/speckit.memory-md.plan-with-memory` to manually refresh synthesis and review the index.

## Orchestration Note

This command is **automatically executed** by `spec-kit-architecture-guard` as part of its `governed-*` workflows. Manual execution is optional and typically only necessary if you need to refresh context or synthesis results outside of a formal governed turn.

## Goal

Ensure the agent has the latest "Why" and "How" from durable memory before proposing any changes or review findings.
