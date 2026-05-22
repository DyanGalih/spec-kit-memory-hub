Before planning the feature:

If an optimizer or MCP-backed Memory Hub is available, use `/speckit.memory-md.prepare-context` or the MCP tools exposed by `spec-kit-memory-hub`; do not shell out to `npx memory-hub` directly.

Read:
- config, including retrieval budgets and `show_token_banner`
- Governance Layer (`.specify/memory/`) constitution, standards, or principles first
- feature spec
- `{specs_root}/<feature>/{feature_memory_filename}` when present
- existing `{specs_root}/<feature>/{memory_synthesis_filename}` when present

1. Call `speckit_memory_refresh_cache(scope="all")` if the scope may have changed or the cache needs restoring.
2. Call `speckit_memory_synthesize(feature="specs/<feature>")` to generate or refresh `{specs_root}/<feature>/{memory_synthesis_filename}`.
3. Read `{specs_root}/<feature>/{memory_synthesis_filename}` first.
4. Call `speckit_memory_search` if synthesis is insufficient. Do NOT read `.md` files directly.
5. If `show_token_banner` is enabled, surface the baseline / cached / saved token banner.

Do NOT read or paste entire durable memory files. Use MCP tools to selectively query the SQLite cache.
Do not load all durable memory files during normal planning.

Produce a concise plan synthesis using only:
- relevant project context
- current constraints
- reused decisions
- relevant bug patterns
- architecture boundaries
- feature-to-memory conflicts
- assumptions requiring confirmation
- implementation watchpoints
- verification watchpoints

Block progress on unresolved hard conflicts.
Warn on soft conflicts.
Keep the synthesis compact and directly usable in planning.
