# Copilot Instructions

This repository is built to work with VS Code Copilot agents and Spec Kit Memory Hub.

## Mandatory Workflow
1. **Core Governance**: You MUST follow the memory-first workflow defined in [.specify/memory/workflow.md](file://.specify/memory/workflow.md).
2. **Proactive Check**: Before planning or tasking, you MUST prepare context using the best available path for this repository:
   - If MCP is available, use the Memory Hub MCP tools
   - If Spec Kit command prompts are available, run `/speckit.memory-md.prepare-context`
   - Otherwise follow `.specify/memory/workflow.md` and the markdown-first fallback
3. **Capture Lessons**: After implementation, review whether the work produced durable knowledge worth preserving and use the approved capture flow before closing the task.

## Memory Source of Truth
- **Governance**: `.specify/memory/` (Constitution, Architecture, Workflow)
- **Durable**: `docs/memory/` (History, Decisions, Patterns)
- **Active**: `specs/<feature>/` (Local context and synthesis)

A task is not fully complete until memory has been reviewed and systemic lessons are captured.
