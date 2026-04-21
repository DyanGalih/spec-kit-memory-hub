# Copilot Instructions

This repository is built to work with VS Code Copilot agents memory.

For any non-trivial task, follow this order.

## Pre-work
Read:
- the current constitution or project principles
- the active spec / plan / tasks when present
- docs/memory/PROJECT_CONTEXT.md
- docs/memory/ARCHITECTURE.md
- docs/memory/DECISIONS.md
- docs/memory/BUGS.md

Treat docs/memory as the repository memory layer.
Keep entries concise, durable, and reviewable in Git.
Do not assume hidden state outside the repository.

## During work
- Prefer small, testable changes.
- Preserve consistency with prior decisions unless the spec requires change.
- Call out conflicts between requested work and existing memory.

## Post-work reflection
Review the final changes and validation results.
Update memory only if something reusable or non-obvious was learned.

A task is not fully complete until memory has been reviewed.
