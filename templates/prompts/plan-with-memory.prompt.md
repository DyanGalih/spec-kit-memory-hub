Before planning:

Read:
- constitution or principles
- feature spec
- `specs/<feature>/memory.md`
- durable memory files
- existing `specs/<feature>/memory-synthesis.md` when present

Produce or refresh `memory-synthesis.md` using only:
- current constraints
- reused decisions
- relevant bug patterns
- architecture boundaries
- feature-to-memory conflicts
- assumptions requiring confirmation
- implementation watchpoints
- verification watchpoints

Format rules:
- keep the metadata keys in this order: `feature`, `status`, `hard_conflicts`, `soft_conflicts`, `assumptions_to_confirm`
- keep every required section, even when empty
- use `- [none]` for empty sections
- use stable item IDs such as `[C1]`, `[D1]`, `[B1]`, `[A1]`, `[Q1]`, `[W1]`, `[V1]`
- keep conflict counts aligned with the listed conflicts

Block progress on unresolved hard conflicts.
Warn on soft conflicts.
Keep the synthesis compact and directly usable in planning and implementation.
