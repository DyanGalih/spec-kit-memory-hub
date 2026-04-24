# Audit Memory

Review the memory files for quality.

Check for:

- stale entries
- duplicate entries
- trivial noise
- contradictions
- missing high-value lessons
- misplaced entries in the wrong memory file
- entries that are too long, vague, or repetitive
- speculative entries
- feature-specific details leaking into durable memory
- missing synthesis or stale synthesis in active feature folders

Suggest:

- removals
- merges
- concise rewrites
- gaps worth documenting
- a follow-up question for each finding: do we need to address or clean up this finding?
- if a finding should be tracked externally, route it to `/speckit.memory-md.log-finding`

Use this scoring rubric for each kept or proposed entry:

- durable
- actionable
- non-obvious
- evidenced
- correctly scoped
- concise

Use these cleanup rules:

- Remove entries that are obsolete, speculative, or routine implementation history.
- Merge entries that describe the same lesson, decision, or bug pattern.
- Rewrite entries that are too verbose into short durable guidance.
- Move entries if they belong in a different file:
  - `PROJECT_CONTEXT.md` for stable product and domain context
  - `ARCHITECTURE.md` for system shape and boundaries
  - `DECISIONS.md` for explicit tradeoffs and chosen direction
  - `BUGS.md` for recurring failure modes and prevention
  - `WORKLOG.md` for concise high-value milestone notes

When proposing changes, prefer this output structure:

1. Findings
   - file
   - issue
   - why it reduces memory quality
2. Proposed cleanup
   - remove / merge / rewrite / move
   - concise replacement text when helpful
3. Gaps
   - missing durable knowledge worth adding

Prefer preserving signal over preserving wording.
Flag hard issues when an entry is contradictory, clearly stale, or stored in the wrong layer.
Flag soft issues when an entry is wordy, weakly evidenced, or duplicative but still salvageable.
Do not invent missing knowledge.
