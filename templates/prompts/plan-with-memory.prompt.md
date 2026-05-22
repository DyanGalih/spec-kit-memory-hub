Before planning:

If an optimizer or MCP-backed Memory Hub is available, use `/speckit.memory-md.prepare-context` or the MCP tools exposed by `spec-kit-memory-hub`; do not shell out to `npx memory-hub` directly.

Read:
- config, including retrieval budgets
- Governance Layer (`.specify/memory/`) constitution, standards, or principles first
- feature spec
- `{specs_root}/<feature>/{feature_memory_filename}` when present
- existing `{specs_root}/<feature>/{memory_synthesis_filename}` when present

1. Call `speckit_memory_refresh_cache(scope="all")` if the scope may have changed or SQLite cache needs restoring from `.md` backups.
2. Call `speckit_memory_synthesize(feature="specs/<feature>")` to generate or refresh `{specs_root}/<feature>/{memory_synthesis_filename}`.
3. Read `{specs_root}/<feature>/{memory_synthesis_filename}` first.
4. Call `speckit_memory_search` if synthesis is insufficient. Do NOT read `.md` files directly.
5. Surface the token comparison banner (`Baseline`, `Cached flow`, `Saved`) so the optimization benefit stays visible in normal planning runs.

Call `speckit_memory_search` to query the SQLite cache. Do NOT read `.md` files directly, rely on the MCP tools.
Do not load all durable memory files during normal planning.

Produce or refresh `{specs_root}/<feature>/{memory_synthesis_filename}` using only:
- relevant project context
- current constraints
- reused decisions
- relevant bug patterns
- architecture boundaries
- feature-to-memory conflicts
- assumptions requiring confirmation
- implementation watchpoints
- verification watchpoints

Required synthesis structure (match this exactly):

```markdown
# Memory Synthesis

## Current Scope
[Brief description of feature scope and affected modules]

## Relevant Decisions
- [D1] [Decision] (Reason Included: [X], Status: [Y], Source: [Z])

## Active Architecture Constraints
- [A1] [Constraint] (Reason Included: [X], Source: [Z])

## Accepted Deviations
- [Deviation] (Reason Included: [X], Status: Accepted-Deviation)

## Relevant Security Constraints
- [C1] [Constraint] (Reason Included: [X], Source: security-constraints.md)

## Related Historical Lessons
- [B1] [Lesson] (Reason Included: [X])

## Conflict Warnings
- [Explicit conflicts between old and new memory]

## Retrieval Notes
- [Index entries considered, source sections read, budget status]
```

Format rules:
- keep every required section, even when empty
- use `- [none]` for empty sections
- use stable item IDs such as `[C1]`, `[D1]`, `[B1]`, `[A1]`, `[Q1]`, `[W1]`, `[V1]`
- keep conflict counts aligned with the listed conflicts
- keep the synthesis within `retrieval.max_synthesis_words` defaulting to 900 words
- if retrieval budgets are exceeded, summarize and prioritize instead of reading more memory

Block progress on unresolved hard conflicts.
Warn on soft conflicts.
Keep the synthesis compact and directly usable in planning and implementation.
