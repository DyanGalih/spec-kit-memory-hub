# Memory Workflow v0.6

## Architectural Critique

The current `memory-md` approach is directionally good but operationally weak for spec-driven AI execution.

Main issues:
- memory is invoked mainly before planning or after implementation, so an agent can still skip it during `/specify`, `/tasks`, `/implement`, or `/verify`
- durable memory files are present, but there is no active feature memory layer and no required synthesis artifact
- `WORKLOG.md` is easy to misuse as a changelog, which increases noise and weakens reuse
- current prompts tell the AI to read files, but they do not force extraction, conflict classification, or stop conditions
- capture rules are too permissive and do not require evidence from diffs, tests, reviews, or incidents
- audits check cleanliness, but not layer mistakes, synthesis freshness, or whether memory is still aligned with the codebase

## Improved Workflow

### Memory Model

1. Constitution / principles
   Store stable operating rules, product principles, and non-negotiable standards.
   Never store feature-specific notes, transient bugs, or implementation history.
2. Durable project memory
   Store cross-feature constraints, architecture boundaries, active decisions, recurring bug patterns, and a very small lessons ledger.
   Never store task lists, per-feature open questions, or routine change summaries.
3. Active feature memory
   Store feature-local constraints, clarifications, open questions, and short-lived watch items in `specs/<feature>/memory.md`.
   Never store broad project rules here unless referenced as relevant durable memory.
4. Ephemeral run context
   Store current prompt state, terminal output, raw investigation notes, and temporary working assumptions only in the current run.
   Never commit this layer to durable memory unless it becomes evidenced and reusable.

### File Structure

Keep the current durable split for compatibility:
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `BUGS.md`
- `WORKLOG.md`

Add only two feature-local files:
- `specs/<feature>/memory.md`
- `specs/<feature>/memory-synthesis.md`

This is enough. A larger file tree would add more overhead than value.

### Required Synthesis Artifact

Every active feature should maintain `specs/<feature>/memory-synthesis.md`.

In `0.6.0`, this artifact is a workflow requirement enforced by prompts and shared instructions.
It is not yet enforced by separate `/tasks` or `/verify` extension commands.

Required sections:
- current constraints
- reused decisions
- relevant bug patterns
- architecture boundaries
- feature-to-memory conflicts
- assumptions requiring confirmation
- implementation watchpoints
- verification watchpoints

The synthesis must be compact, current, and directly consumable inside planning and implementation prompts.
Use this output contract:
- keep the top metadata block in the same order: `feature`, `status`, `hard_conflicts`, `soft_conflicts`, `assumptions_to_confirm`
- keep every required section, even when empty
- represent empty sections with `- [none]`
- use stable item IDs like `[C1]`, `[D1]`, `[B1]`, `[A1]`, `[Q1]`, `[W1]`, `[V1]`
- keep `hard_conflicts` and `soft_conflicts` counts aligned with the conflict section contents

## Command Integration

### Before `/specify`
- Read: constitution, durable memory, closely related decisions and bugs
- Synthesize: starting constraints, reusable decisions, likely conflict points
- Gate: block only on direct constitution or architecture conflicts
- Allowed updates: `specs/<feature>/memory.md` and `memory-synthesis.md`

### Before `/plan`
- Read: spec, feature memory, synthesis, durable memory
- Synthesize: planning constraints, implementation boundaries, reused decisions, assumptions
- Gate: unresolved hard conflicts block planning
- Allowed updates: refresh `memory.md` and `memory-synthesis.md`

### Before `/tasks`
- Read: plan and memory synthesis
- Synthesize: task-level watchpoints and boundary-aware sequencing
- Gate: warn if tasks cross architecture boundaries or ignore required verification
- Allowed updates: refresh `memory-synthesis.md`

### Before `/implement`
- Read: plan, tasks, memory synthesis
- Synthesize: implementation watchpoints and bug-prevention checks
- Gate: block if synthesis is missing or stale relative to plan changes
- Allowed updates: feature memory only

### After `/implement`
- Read: diff, completed tasks, tests run so far, feature memory
- Synthesize: candidate durable lessons with evidence
- Gate: reject speculative or changelog-style memory updates
- Allowed updates: feature memory and candidate durable entries

### Before `/verify`
- Read: memory synthesis, bug patterns, implementation watchpoints
- Synthesize: verification watchpoints and regressions to prove absent
- Gate: warn if verification does not cover known bug patterns or required boundaries
- Allowed updates: `memory-synthesis.md`

### After `/verify`
- Read: verification results, review findings, incidents if applicable
- Synthesize: durable lessons worth keeping
- Gate: only evidenced entries can enter durable memory
- Allowed updates: `DECISIONS.md`, `BUGS.md`, `WORKLOG.md`, plus stale-status updates

## Conflict Detection Rules

### Hard Conflicts
- spec contradicts constitution or project principles
- plan violates an explicit architecture boundary
- tasks require crossing a prohibited service or module boundary
- implementation diff breaks an active decision without updating that decision
- new work repeats a known bug pattern without mitigation
- verification omits a required safety or regression check named in memory synthesis

These should block progress until clarified or explicitly superseded.

### Soft Conflicts
- memory suggests a preferred pattern, but the new feature can justify a different approach
- a decision looks partially outdated but is not clearly invalid
- tasks appear thin on validation, but not dangerously so
- bug patterns are adjacent rather than directly applicable

These should warn, not block.

### Must Ask For Clarification
- scope, user requirements, or architecture intent must change to satisfy durable memory
- an old decision and the current spec are both plausible, but only one can be true
- evidence is insufficient to decide whether memory is stale or the implementation is wrong

### When To Update Stale Memory
- verified implementation and tests contradict older memory
- recurring work repeatedly follows a new pattern while the old decision is no longer used
- an incident or bug fix proves the older prevention guidance is incomplete or wrong

## Capture Quality Rules

Use evidence from:
- implementation diff
- completed tasks
- verification or test results
- review findings
- production bug fixes or incidents

Every new durable entry must answer:
- why this is durable
- what future mistake it prevents
- what evidence supports it
- where maintainers should look next

### Concise Entry Schemas

`DECISIONS.md`
- title
- status
- why this is durable
- decision
- tradeoffs
- future mistake prevented
- evidence
- where to look next

`BUGS.md`
- title
- status
- symptoms
- root cause
- future mistake prevented
- evidence
- prevention / detection
- where to look next

`WORKLOG.md`
- title
- why this is durable
- future mistake prevented
- evidence
- where to look next

`specs/<feature>/memory.md`
- scope notes
- relevant durable memory
- open questions
- watchlist

`specs/<feature>/memory-synthesis.md`
- feature
- status
- conflict counts
- stable item ids
- required synthesis sections

## Noise Control And Auditing

Audit rules:
- merge duplicate lessons that prevent the same mistake
- remove changelog-style noise
- mark stale decisions as superseded or needs review
- reject speculative entries without evidence
- shorten entries that are longer than their reuse value warrants
- move entries to the correct layer when misplaced
- remove feature-specific details from durable memory

### Quality Rubric
- durable: will it matter beyond this feature?
- actionable: can an AI or maintainer do something differently because of it?
- non-obvious: is it more than common sense or a restatement of code?
- evidenced: is there concrete support?
- correctly scoped: is it in the right layer and file?
- concise: is it short enough to be used repeatedly?

## Prompt And Skill Changes

The revised prompts in `templates/prompts/` now explicitly force the AI to:
- read the right memory files before work
- refresh the synthesis artifact instead of dumping raw memory
- classify hard and soft conflicts
- refuse noisy or speculative memory updates
- produce compact, high-signal outputs

## Minimal Adoption Path

### Phase 1: High impact, low complexity
- add `specs/<feature>/memory.md`
- add required `specs/<feature>/memory-synthesis.md`
- rewrite planning and capture prompts to require synthesis and evidence
- tighten `WORKLOG.md` so it is not used as a changelog
- update Copilot instructions to require memory before planning, implementation, and verification

### Phase 2: Medium complexity
- add conflict classification rules to planning, tasks, and verify workflows
- audit for stale or mis-scoped memory
- require stale-memory updates when verified reality diverges from documentation

### Phase 3: Optional polish
- add helper automation around synthesis freshness checks
- add repo-specific linting or CI checks for required synthesis files in active features
- add lightweight reporting on audit scores

## Migration Guidance

For projects already using the current version:

1. Keep existing durable memory files.
2. Reinterpret `WORKLOG.md` as a durable lessons ledger, not a chronological log.
3. Add `memory.md` and `memory-synthesis.md` only for new or currently active features.
4. Do not backfill synthesis for completed historical features unless they are being reopened.
5. When old decisions are clearly stale, mark them `Superseded` or `Needs review` instead of deleting history blindly.
6. Preserve compatibility with constitution-only repositories by treating constitution as the only durable source until project memory files are added.

## Example Flow

### `/specify`
- Read constitution plus `PROJECT_CONTEXT`, `ARCHITECTURE`, `DECISIONS`, and `BUGS`
- Create `specs/042-search/memory.md`
- Create `specs/042-search/memory-synthesis.md` with constraints, reused API pagination decision, and a known cache invalidation bug pattern

### `/plan`
- Read spec plus synthesis
- Detect that the plan proposes cross-service writes that violate an architecture boundary
- Mark a hard conflict and revise the plan to keep writes inside the owning service

### `/implement`
- Re-read synthesis
- Follow implementation watchpoints for pagination and cache invalidation
- Update feature memory with one open question, but do not touch durable memory yet

### `/verify`
- Use verification watchpoints to run pagination, invalidation, and regression checks
- Confirm a reusable bug-prevention lesson from the diff and test results
- Add one concise `BUGS.md` entry with evidence and the next files to inspect

## Evaluation

Will these changes materially improve AI understanding and memory use during spec-driven development?

Yes. They turn memory from passive reference material into a required workflow input with a compact synthesis artifact, explicit conflict gates, and evidence-based capture. That combination improves recall at the moment decisions are made, reduces prompt noise, prevents stale or irrelevant memory from dominating execution, and makes durable lessons much more likely to be reused correctly in future specs and implementations.
