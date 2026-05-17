---
description: "Centralized context preparation: check cache health, refresh caches, search memory, and generate synthesis."
---

# Prepare Context

Use this command to prepare the technical and historical context for the current task. It handles first-time setup, incremental refresh, and post-upgrade scenarios automatically — no manual `npx` commands needed.

## Usage

Run this command by providing the feature directory and an optional search query.

```text
/speckit.memory-md.prepare-context --feature specs/<feature> --query "<optional_search_terms>"
```

## MCP Path (Preferred for Phase 1 durable memory)

If `speckit-memory-hub` MCP server is active, use this streamlined path instead of the full CLI pipeline:

1. **Search & Auto-Index**: Call `speckit_memory_search(query="<your query>")` — the server auto-indexes the durable memory cache if cold. No `doctor` check or `npx` commands needed.
2. **Generate Synthesis**: Call `speckit_memory_synthesize(feature="specs/<feature>")` — writes `specs/<feature>/memory-synthesis.md` directly.
3. **Read the output**: Read the file at the `outputPath` returned by the tool.

> **Phase 2 gap (important)**: MCP tools `speckit_memory_search_docs` and `speckit_memory_synthesize_docs` are not yet implemented. **Phase 2 doc cache synthesis always requires the CLI path below**, even when MCP is active. Do not skip Phase 2 when running via MCP — proceed to the CLI Fallback steps 5–7 after completing the MCP Phase 1 steps above.

---

## Optimizer-Aware Flow (CLI Fallback)

When `.specify/extensions/memory-md/config.yml` has `optimizer.enabled: true` and the local CLI is installed:

### Step 0 — Doctor Check (always run first)

```bash
cd .specify/extensions/memory-md && npx speckit-memory doctor
```

Read the output and record:
- **Phase 1 memory entries** (`Indexed memory entries: N`)
- **Phase 2 doc entries** (`Indexed doc entries: N`)

Use these counts to decide whether Phase 1 and Phase 2 need a full index or just a refresh in the steps below.

> If the CLI is unavailable (command not found), skip to **Markdown-Only Flow**.

### Phase 1 — Durable Memory (always run)

1. **Refresh or Index Memory Cache**:
   - If doctor showed `Indexed memory entries: 0` (cold cache / first run / post-upgrade): `npx speckit-memory index-memory`
   - Otherwise (cache exists): `npx speckit-memory refresh-memory`
2. **Search Memory (Optional)**: If a custom query is provided, execute `npx speckit-memory search-memory "$QUERY"`.
3. **Memory Synthesis**: Execute `npx speckit-memory synthesize --feature $FEATURE ${QUERY ? '--query "$QUERY"' : ''}`.
4. **Read Results**: Read `specs/<feature>/memory-synthesis.md`.

### Phase 2 — Development Docs (always run)

5. **Refresh or Index Doc Cache**:
   - If doctor showed `Indexed doc entries: 0` (cold cache / first run / upgrading from pre-0.9.0): `npx speckit-memory index-docs`
   - Otherwise (cache exists): `npx speckit-memory refresh-docs`
6. **Doc Synthesis**: Execute `npx speckit-memory synthesize-docs --feature $FEATURE`.
7. **Read Results**: Read `specs/<feature>/doc-synthesis.md` in place of opening individual spec, plan, tasks, and constitution files.

**Token Banner**: Show the baseline / cached / saved token summary after the synthesis step so the savings stay visible during normal runs.

## Markdown-Only Flow

When the optimizer is disabled, unavailable, or intentionally left off for MCP-only Phase 1 usage, fall back to manual index retrieval:
1. Run `/speckit.memory-md.plan-with-memory` to manually refresh synthesis and review the index.

## Orchestration Note

This command is **automatically executed** by `spec-kit-architecture-guard` as part of its `governed-*` workflows. Manual execution is optional and typically only necessary if you need to refresh context or synthesis results outside of a formal governed turn.

## Goal

Ensure the agent has the latest "Why" and "How" from durable memory before proposing any changes or review findings.
