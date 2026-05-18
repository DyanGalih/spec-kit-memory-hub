---
description: "Prepare memory context before writing or revising a feature spec. Reads governance layer, index, and prior synthesis, then refreshes feature memory and memory-synthesis.md."
---

# Specify With Memory

Before writing or revising the feature spec, resolve configuration. If `.specify/extensions/memory-md/config.yml` exists, read it for `memory_root`, `specs_root`, `feature_memory_filename`, `memory_synthesis_filename`, and `optimizer`. Otherwise use defaults: `memory_root: docs/memory`, `specs_root: specs`, `feature_memory_filename: memory.md`, `memory_synthesis_filename: memory-synthesis.md`.

### Optimizer-Aware Flow

When `.specify/extensions/memory-md/config.yml` has `optimizer.enabled: true` and the MCP server is available:

1. **Prepare Context**: Run `/speckit.memory-md.prepare-context --feature specs/<feature>` or call `speckit_memory_refresh_cache(scope="all")` and `speckit_memory_synthesize(feature="specs/<feature>")`.
2. **Read Synthesis**: Read `specs/<feature>/memory-synthesis.md` to identify constraints and decisions relevant to this feature.
3. Open additional durable memory files only if synthesis is insufficient.

When `optimizer.enabled` is `false`, missing, or unavailable, use markdown-only, index-first retrieval below.

## Retrieval Order

**IMPORTANT**: Read these files explicitly using your file-reading tools. Do not rely solely on workspace search or semantic indexers — these files are often in `.gitignore`.

1. Read config.
2. Read the Governance Layer (`.specify/memory/`) constitution, standards, or principles first.
3. Read `{memory_root}/INDEX.md` when present.
4. Read existing `{specs_root}/<feature>/{memory_synthesis_filename}` when present.
5. Read any nearby feature memory from related unfinished work when clearly relevant.
6. Select relevant index entries by feature scope, affected modules, named technologies, security/data boundaries, active decisions, and known bug patterns.
7. Read only the selected source sections from durable memory files.

Do not load all durable memory files. Respect configured retrieval budgets. If the budget is exceeded, summarize and prioritize instead of reading more memory.

## After Reading

- Extract only the constraints, reused decisions, bug patterns, and architecture boundaries relevant to this feature.
- Write or refresh `{specs_root}/<feature>/{feature_memory_filename}` with feature-local notes and open questions.
- Write or refresh `{specs_root}/<feature>/{memory_synthesis_filename}` with a compact summary for planning and implementation, within `retrieval.max_synthesis_words` defaulting to 900 words.
- Call out conflicts between the requested feature and existing durable memory.
- Separate durable project memory from transient feature context.

Do not store transient feature notes in durable memory.
Include only selected summaries in the spec.

**Then proceed with writing the feature spec**, informed by the memory context just prepared.
