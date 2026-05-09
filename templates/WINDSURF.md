# Windsurf Instructions

This repository is built to work with Spec Kit Memory Hub and Windsurf.

## Mandatory Workflow
1. **Core Governance**: You MUST follow the memory-first workflow defined in [.specify/memory/workflow.md](file://.specify/memory/workflow.md).
2. **Proactive Check**: Before planning or tasking, you MUST execute:
   `/speckit.memory-md.prepare-context`
3. **Capture Lessons**: After implementation, you MUST execute:
   `/speckit.memory-md.capture`

## Memory Source of Truth
- **Governance**: `.specify/memory/` (Constitution, Architecture, Workflow)
- **Durable**: `docs/memory/` (History, Decisions, Patterns)
- **Active**: `specs/<feature>/` (Local context and synthesis)

A task is not fully complete until memory has been reviewed and systemic lessons are captured.
