---
description: Capture durable knowledge and architecture decisions from current or provided diffs.
scripts:
  sh: ../../scripts/bash/detect-changed-files.sh
  ps: ../../scripts/powershell/detect-changed-files.ps1
---

# Capture From Diff

You are capturing durable knowledge for `memory-hub` by analyzing code changes.

## Determine Review Scope

1. **Identify Changed Files**:
   - If the user provided a diff or explicit instructions, follow them.
   - Otherwise, you **MUST** execute the `{SCRIPT}` with `--json` to detect changed files since the merge-base or in the working directory.
   - Use the `changed_files` list as the primary set for knowledge extraction.

## Capture Process

1. **Inspect Changes**: Analyze the diff of the identified files.
2. **Identify High-Signal Knowledge**:
   - **Architecture Decisions**: New boundaries, patterns, or choices.
   - **Integration Gotchas**: Non-obvious failure modes or hidden dependencies.
   - **Recurring Patterns**: Bug patterns to prevent or conventions to follow.
   - **Tradeoffs**: Conscious decisions to prefer one quality over another.
3. **Verify Evidence**: Ensure every finding is backed by:
   - The actual diff content.
   - Successful tests or verification results.
   - Explicit task completion in `tasks.md`.
4. **Categorize and Route**:
   - `DECISIONS.md`: Durable architectural or technical choices.
   - `BUGS.md`: Lessons from fixed bugs and prevention rules.
   - `WORKLOG.md`: High-value project milestones.
5. **Filter Noise**: Reject entries that are obvious, transient, feature-local, or weakly evidenced.

## Output Format

1. **Memory Update Summary**
   - **File**: [Target memory file]
   - **Category**: [Decision / Bug Pattern / Milestone]
   - **Signal**: [Actionable lesson captured]
   - **Evidence**: [Supporting code snippet or task ID]

2. **Action Plan**
   - **Durable Step**: Why this update prevents future drift or repeats.
   - **Next Action**: [e.g. Run /speckit.memory-md.audit to verify quality]

---
## Capture Principles
- **Concise**: 1-2 sentences of durable guidance.
- **Actionable**: Tells a future developer exactly what to do or avoid.
- **Durable**: Remains relevant long after the current feature is shipped.
