Before planning the feature:

If an optimizer or MCP-backed Memory Hub is available, use `/speckit.memory-md.prepare-context` or the MCP tools exposed by `spec-kit-memory-hub`; do not shell out to `npx memory-hub` directly.

Read:
- config, including retrieval budgets and `show_token_banner`
- Governance Layer (`.specify/memory/`) constitution, standards, or principles first
- feature spec
- `{specs_root}/<feature>/{feature_memory_filename}` when present
- `{memory_root}/INDEX.md`
- existing `{specs_root}/<feature>/{memory_synthesis_filename}` when present

When `optimizer.enabled` is `true` and the MCP server is available:
1. Call `speckit_memory_refresh_cache(scope="all")` if the scope may have changed.
2. Call `speckit_memory_synthesize(feature="specs/<feature>")` to generate or refresh `{specs_root}/<feature>/{memory_synthesis_filename}`.
3. Read `{specs_root}/<feature>/{memory_synthesis_filename}` first.
4. Open additional durable memory files only when synthesis is insufficient or audit mode is requested.
5. If `show_token_banner` is enabled, surface the baseline / cached / saved token banner.

Select relevant index entries first, then read only the smallest necessary source sections. Do not read or paste entire durable memory files unless the index is missing, incomplete, or the user explicitly requests a full audit.
Do not load all durable memory files during normal planning when the optimizer is enabled.

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
