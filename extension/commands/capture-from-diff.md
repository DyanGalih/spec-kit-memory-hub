# Capture From Diff

Review the current or provided diff.

Process:
1. Inspect changed files.
2. Identify:
   - architecture decisions
   - integration gotchas
   - recurring bug patterns
   - new conventions
   - meaningful tradeoffs
3. For each finding, verify evidence from:
   - the diff itself
   - completed tasks
   - tests / verification results
   - review findings or incident context when available
4. Decide whether each finding belongs in:
   - DECISIONS.md
   - BUGS.md
   - WORKLOG.md
5. Reject any finding that is obvious, transient, purely feature-local, or unsupported by evidence.
6. Update only the necessary files.
7. Summarize:
   - why the update is durable
   - what mistake it prevents
   - what evidence supports it
   - where maintainers should look next

Do not create noisy memory entries for obvious or low-value changes.
