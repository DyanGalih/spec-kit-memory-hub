Before writing or revising the feature spec:

Read:
- constitution or project principles
- durable memory:
  - docs/memory/PROJECT_CONTEXT.md
  - docs/memory/ARCHITECTURE.md
  - docs/memory/DECISIONS.md
  - docs/memory/BUGS.md
- any nearby feature memory from related unfinished work

Then:
- extract only the constraints, reused decisions, bug patterns, and architecture boundaries relevant to this feature
- write or refresh `specs/<feature>/memory.md` with feature-local notes and open questions
- write or refresh `specs/<feature>/memory-synthesis.md` with a compact summary for planning and implementation
- call out conflicts between the requested feature and existing durable memory
- separate durable project memory from transient feature context

Do not dump whole memory files into the spec.
Do not store transient feature notes in durable memory.
