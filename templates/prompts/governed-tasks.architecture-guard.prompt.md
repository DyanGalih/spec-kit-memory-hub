Before generating tasks:

If an optimizer or MCP-backed Memory Hub is available, use `/speckit.memory-md.prepare-context` or the MCP tools exposed by `spec-kit-memory-hub`; do not shell out to `npx memory-hub` directly.

Read:
- the approved plan
- `{specs_root}/<feature>/{memory_synthesis_filename}` when present
- feature memory, only if the synthesis is insufficient
- selected context from SQLite cache relevant to task decomposition

1. Reuse the current synthesis instead of reopening the full durable memory set.
2. Re-check the cache using MCP tools only if the feature scope or approved plan changed. Do NOT read `.md` files directly.
3. Keep retrieval targeted to the modules and decisions that affect task breakdown.
4. If `show_token_banner` is enabled, surface the baseline / cached / saved token banner.

Generate tasks that:
- preserve existing constraints and decisions
- respect architecture boundaries and migration order
- include verification and review watchpoints
- stay feature-scoped and implementation-ready

Avoid exploding the task list with duplicate context or generic subtasks.
Do not re-open the full memory set unless the synthesis is clearly insufficient.

Block progress on unresolved hard conflicts.
Warn on soft conflicts.
Keep the task breakdown compact and directly actionable.
