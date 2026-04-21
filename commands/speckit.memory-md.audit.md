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

Suggest:
- removals
- merges
- concise rewrites
- gaps worth documenting

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
Do not invent missing knowledge.
