---
description: "Prepare memory context before writing or revising a feature spec. Reads governance layer, index, and prior synthesis, then refreshes feature memory and memory-synthesis.md."
---

# Specify With Memory

Before writing or revising the feature spec, resolve configuration. If `.specify/extensions/memory-md/config.yml` exists, read it for `memory_root`, `specs_root`, `feature_memory_filename`, `memory_synthesis_filename`, and `optimizer`. Otherwise use defaults: `memory_root: docs/memory`, `specs_root: specs`, `feature_memory_filename: memory.md`, `memory_synthesis_filename: memory-synthesis.md`.

1. **Prepare Context**: Run `/speckit.memory-md.prepare-context --feature specs/<feature>` or call `speckit_memory_refresh_cache(scope="all")` (to sync backup `.md` files to SQLite if empty) and then `speckit_memory_synthesize(feature="specs/<feature>")`.
2. **Read Synthesis**: Read `specs/<feature>/memory-synthesis.md` to identify constraints and decisions relevant to this feature.
3. **Targeted Search**: If the synthesis is insufficient, call `speckit_memory_search` to query the SQLite cache. **Do NOT read `.md` memory files directly.** The SQLite cache is the single source of truth.

## Retrieval Order

1. Read config.
2. Read the Governance Layer (`.specify/memory/`) constitution, standards, or principles first.
3. Call `speckit_memory_search` or use MCP tools for any durable memory queries. Do NOT read `{memory_root}/INDEX.md` or other memory `.md` files directly.
4. Read existing `{specs_root}/<feature>/{memory_synthesis_filename}` when present.
5. Read any nearby feature memory from related unfinished work when clearly relevant.

Do not load all durable memory files. Rely on the MCP tools which respect configured retrieval budgets.

## After Reading

- Extract only the constraints, reused decisions, bug patterns, and architecture boundaries relevant to this feature.
- Write or refresh `{specs_root}/<feature>/{feature_memory_filename}` with feature-local notes and open questions.
- Write or refresh `{specs_root}/<feature>/{memory_synthesis_filename}` with a compact summary for planning and implementation, within `retrieval.max_synthesis_words` defaulting to 900 words.
- Call out conflicts between the requested feature and existing durable memory.
- Separate durable project memory from transient feature context.

Do not store transient feature notes in durable memory.
Include only selected summaries in the spec.

**Then proceed with writing the feature spec**, informed by the memory context just prepared.
