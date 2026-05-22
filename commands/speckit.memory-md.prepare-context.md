---
description: "Centralized context preparation: check cache health, refresh caches, search memory, and generate synthesis."
---

# Prepare Context

Use this command to prepare the technical and historical context for the current task. It handles first-time setup, incremental refresh, and post-upgrade scenarios automatically through MCP cache tools.

## Usage

Run this command by providing the feature directory and an optional search query.

```text
/speckit.memory-md.prepare-context --feature specs/<feature> --query "<optional_search_terms>"
```

## MCP-Managed Flow

Use MCP tools for the full cache lifecycle:

1. **Refresh Cache**: Call `speckit_memory_refresh_cache(scope="all")`.
2. **Search Memory (Optional)**: If a custom query is provided, call `speckit_memory_search(query="<query>")`.
3. **Memory Synthesis**: Call `speckit_memory_synthesize(feature="specs/<feature>", query="<optional query>")`.
4. **Doc Synthesis**: Call `speckit_memory_synthesize_docs(feature="specs/<feature>")`.
5. **Read Results**: Read the returned `memory-synthesis.md` and `doc-synthesis.md` output paths.

**Token Banner**: Show the baseline / cached / saved token summary after the synthesis step so the savings stay visible during normal runs.

## Orchestration Note

This command is **automatically executed** by `spec-kit-architecture-guard` as part of its `governed-*` workflows. Manual execution is optional and typically only necessary if you need to refresh context or synthesis results outside of a formal governed turn.

## Goal

Ensure the agent has the latest "Why" and "How" from durable memory before proposing any changes or review findings.
