Before generating tasks:

Read:
- the approved plan
- `{specs_root}/<feature>/{memory_synthesis_filename}` when present
- feature memory, only if the synthesis is insufficient
- selected index entries relevant to task decomposition

When `optimizer.enabled` is `true` and the CLI is available:
1. Reuse the current synthesis instead of reopening the full durable memory set.
2. Re-check the cache only if the feature scope or approved plan changed.
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
