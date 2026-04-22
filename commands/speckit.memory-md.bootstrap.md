# Bootstrap

Set up this repository to use the layered Spec Kit Memory workflow.

Tasks:
1. Ensure these folders exist:
   - docs/memory
   - specs
   - .github
2. Create missing durable memory files from the extension templates:
   - docs/memory/PROJECT_CONTEXT.md
   - docs/memory/ARCHITECTURE.md
   - docs/memory/DECISIONS.md
   - docs/memory/BUGS.md
   - docs/memory/WORKLOG.md
3. Create or update spec starter files so every feature folder can contain:
   - spec.md
   - plan.md
   - tasks.md
   - memory.md
   - memory-synthesis.md
4. Create or update `.github/copilot-instructions.md` so memory is required before planning and implementation.
5. Summarize the memory model:
   - constitution / principles = stable operating rules
   - durable project memory = reusable cross-feature knowledge
   - active feature memory = feature-local constraints, open questions, and carry-forward context
   - ephemeral run context = temporary prompt or terminal state that must not be committed
6. List the first customization steps:
   - fill in project context and architecture
   - migrate any durable lessons into decisions or bugs
   - stop using worklog as a changelog
   - use feature memory plus synthesis on the next spec

Prioritize preserving existing project files.
Never overwrite project-specific memory without explicit approval.
