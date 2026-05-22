Before writing or revising the feature spec:

Read:
- config from `.specify/extensions/memory-md/config.yml` when present; otherwise use `memory_root: docs/memory` and `specs_root: specs`
- Governance Layer (`.specify/memory/`) constitution, standards, or principles first
- existing `{specs_root}/<feature>/{memory_synthesis_filename}` when present
- any nearby feature memory from related unfinished work when clearly relevant

1. Call `speckit_memory_refresh_cache(scope="all")` if the scope may have changed or SQLite cache needs restoring.
2. Call `speckit_memory_synthesize(feature="specs/<feature>")` to generate or refresh `{specs_root}/<feature>/{memory_synthesis_filename}`.
3. Read `{specs_root}/<feature>/{memory_synthesis_filename}` first.
4. Call `speckit_memory_search` if synthesis is insufficient. Do NOT read `.md` files directly.

Call `speckit_memory_search` to query the SQLite cache. Do NOT read `.md` files directly, rely on the MCP tools.
Respect configured retrieval budgets via MCP search constraints. If the budget is exceeded, summarize and prioritize instead of searching more memory.

Then:
- extract only the constraints, reused decisions, bug patterns, and architecture boundaries relevant to this feature
- write or refresh `{specs_root}/<feature>/memory.md` with feature-local notes and open questions
- write or refresh `{specs_root}/<feature>/memory-synthesis.md` with a compact summary for planning and implementation, within `retrieval.max_synthesis_words` defaulting to 900 words
- call out conflicts between the requested feature and existing durable memory
- separate durable project memory from transient feature context

Do not load all durable memory files during `/specify`.
Include only selected summaries in the spec.
Do not store transient feature notes in durable memory.
