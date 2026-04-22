# Capture

Reflect on completed work and update durable memory only if needed.

Inputs to review:
- active spec / plan / tasks
- final implementation diff or summary
- tests or validation results
- review findings, if any
- incident or bug-fix context, if any

For each candidate lesson, require all of these:
- reusable
- non-obvious
- likely to prevent future mistakes
- evidenced by the diff, tests, review feedback, or incident analysis
- correctly scoped to durable memory rather than feature-local notes

Every new entry must answer:
- why this is durable
- what future mistake it prevents
- what evidence supports it
- where maintainers should look next

Candidate files:
- docs/memory/DECISIONS.md
- docs/memory/BUGS.md
- docs/memory/WORKLOG.md

Rules:
- Prefer `DECISIONS.md` for still-active cross-feature choices and tradeoffs.
- Prefer `BUGS.md` for repeatable failure modes and prevention guidance.
- Use `WORKLOG.md` only for short, durable lessons that do not fit the other two files.
- Refuse routine implementation detail, feature narrative, or speculative lessons.
