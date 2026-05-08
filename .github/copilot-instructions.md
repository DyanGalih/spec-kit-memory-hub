# Copilot Instructions

This repository is built to work with VS Code Copilot agents memory.

For any non-trivial task, memory is part of the workflow, not optional documentation.

## Memory Layers (Source of Truth)

- **Governance Layer (`.specify/memory/`)**:
  Stable operating rules, project constitution, architecture standards, and governance-level decisions.
  *   `.specify/memory/constitution.md` (project-level principles)
  *   `.specify/memory/architecture_constitution.md` (authoritative tech standards)
  *   `.specify/memory/DECISIONS.md` (governance decisions)
  *   `.specify/memory/BUGS.md` (systemic or high-risk patterns)
- **Durable Project Memory (`docs/memory/`)**:
  The historical record of technical choices, architecture boundaries, and recurring bug patterns.
  *   `docs/memory/INDEX.md` (the compact routing map for this layer)
  *   `docs/memory/PROJECT_CONTEXT.md` (system purpose and high-level shape)
  *   `docs/memory/ARCHITECTURE.md` (detailed boundaries and integrations)
  *   `docs/memory/DECISIONS.md` (technical and implementation decisions)
  *   `docs/memory/BUGS.md` (recurring bugs and mitigation patterns)
  *   `docs/memory/WORKLOG.md` (sequential ledger of durable changes)
- **Active Feature Memory (`specs/<feature>/memory.md`)**:
  Feature-local constraints, open questions, and watchpoints for the current feature.
- **Ephemeral Run Context**:
  The current prompt, diff, terminal output, and temporary notes. Do not commit these to durable memory.

## Required Workflow

These requirements are enforced in this repository by prompts, shared instructions, and review expectations.
They are not yet backed by separate `/tasks` or `/verify` extension commands.

Before `/specify`:
- Read constitution, durable project memory, and any closely related bug or decision entries.
- Produce or refresh a compact `memory-synthesis.md` section for constraints, reused decisions, bug patterns, boundaries, conflicts, assumptions, and watchpoints.

Before `/plan` and `/tasks`:
- Read the active spec plus `memory.md` and `memory-synthesis.md`.
- Do not proceed if there is an unresolved hard conflict with project memory or architecture boundaries.

Before `/implement`:
- Re-read `memory-synthesis.md`.
- Treat implementation and verification watchpoints as requirements, not suggestions.

After `/implement` and after `/verify`:
- Review the diff, task completion, tests, and findings.
- Update durable memory only when the lesson is durable, evidenced, reusable, and non-obvious.
- Refuse changelog-style or speculative memory updates.

Treat docs/memory as the repository memory layer.
Keep entries concise, durable, and reviewable in Git.
Do not assume hidden state outside the repository.

A task is not fully complete until memory has been reviewed.
