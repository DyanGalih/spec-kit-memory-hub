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

1. **Refresh Cache**: Execute `cd .specify/extensions/memory-md && npx speckit-memory refresh-memory` (or `npx . refresh-memory` if in the extension repo).
2. **Search Memory (Optional)**: If a custom query is provided, execute `cd .specify/extensions/memory-md && npx speckit-memory search-memory "$QUERY"`.
3. **Synthesis Refresh**: Execute `cd .specify/extensions/memory-md && npx speckit-memory synthesize --feature $FEATURE ${QUERY ? '--query "$QUERY"' : ''}`.
4. **Read Results**: Read `specs/<feature>/memory-synthesis.md` and review any search results from step 2.

## Markdown-Only Flow

When the optimizer is disabled, fall back to manual index retrieval:
1. Run `/speckit.memory-md.plan-with-memory` to manually refresh synthesis and review the index.

## Orchestration Note

This command is **automatically executed** by `spec-kit-architecture-guard` as part of its `governed-*` workflows. Manual execution is optional and typically only necessary if you need to refresh context or synthesis results outside of a formal governed turn.

## Goal

Ensure the agent has the latest "Why" and "How" from durable memory before proposing any changes or review findings.
