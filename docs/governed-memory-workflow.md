# Governed Memory Workflow (v0.8)

## Architectural Critique

The `memory-md` approach is optimized for spec-driven AI execution through layered context and governed workflows.

Main principles:
- **Layered Context**: Separation between durable project memory and active feature memory.
- **Index-First Retrieval**: Normal workflows read a compact memory index before selected source sections.
- **Required Synthesis**: Every feature must have a `memory-synthesis.md` that acts as a focused lens for the AI.
- **Evidence-Based Capture**: Only reusable, evidenced lessons enter durable memory.
- **Governed Orchestration**: Integration with Architecture Guard for coordinated planning and implementation.

---

## Governed Delivery Lifecycle

Memory Hub acts as a cooperative citizen in the Spec Kit ecosystem. When used with Architecture Guard, it provides the "historical context" for the governed lifecycle:

1. **`/specify`** -> Write initial feature spec.
2. **`/speckit.architecture-guard.governed-plan`** -> Orchestrates memory synthesis, technical planning, and security/architecture validation.
3. **`/speckit.architecture-guard.governed-tasks`** -> Orchestrates task generation with memory, security, and architecture refactor awareness.
4. **`/speckit.architecture-guard.governed-implement`** -> Orchestrates implementation with memory context and post-implementation governance review.

---

## Memory Model

1. **Governance Layer (`.specify/memory/`)**
   Store stable operating rules, project constitution, architecture standards, and governance-level decisions. This is the authoritative "Project Law".
2. **Durable Project Memory (`docs/memory/`)**
   Store technical constraints, architecture boundaries, technical decisions, recurring implementation bug patterns, and a sequential lessons ledger. This is the authoritative "Project History".
3. **Memory Index**
   Store compact routing metadata in `{memory_root}/INDEX.md`; this decides what durable source sections are worth reading.
4. **Active Feature Memory**
   Store feature-local constraints, clarifications, open questions, and short-lived watch items in `{specs_root}/<feature>/memory.md`.
5. **Memory Synthesis**
   A compact, AI-facing summary of selected durable and feature memory for the current task (`{specs_root}/<feature>/memory-synthesis.md`).

---

## Capture vs Synthesis

Memory Hub separates two distinct operations to ensure safety and signal quality:

### Synthesis
Synthesis prepares relevant memory for the current workflow. It is safe to use during governed workflows because it reads the index, retrieves selected source sections, and summarizes compact context. It is triggered automatically by orchestrator commands like `governed-plan`.

### Capture
Capture persists new durable memory and matching index rows. It should be **intentional and human-approved**.

While Architecture Guard orchestration does not automatically mutate project memory without approval, it now includes a **Mandatory Self-Learning Check** as the penultimate step in every implementation and review flow. This ensures the agent evaluates the current execution for architectural lessons and is forced to propose any high-signal findings via `/speckit.memory-md.capture` before finalizing the governance summary.

---

## Command Integration

### Orchestrated Usage (via Architecture Guard)
Architecture Guard orchestrator commands automatically consume memory synthesis:
- **`governed-plan`**: Triggers `plan-with-memory` to provide context for the technical plan.
- **`governed-tasks`**: Ensures tasks respect known constraints and architecture boundaries.
- **`governed-implement`**: Provides the implementation watchpoints from the synthesis.

### Direct Usage
The user can manually run memory commands:
- **`init`**: Initialize the memory structure.
- **`plan-with-memory`**: Manually refresh synthesis.
- **`capture`**: Propose evidenced lessons and index rows for explicit approval.
- **`audit`**: Clean up and de-duplicate memory.

---

## Conflict Detection Rules

### Hard Conflicts
- Spec contradicts constitution or project principles.
- Plan violates an explicit architecture boundary.
- Tasks require crossing a prohibited service or module boundary.
- Implementation diff breaks an active decision without updating that decision.
- New work repeats a known bug pattern without mitigation.

These should block progress until clarified or explicitly superseded.

### Soft Conflicts
- Memory suggests a preferred pattern, but the new feature can justify a different approach.
- A decision looks partially outdated but is not clearly invalid.
- Bug patterns are adjacent rather than directly applicable.

These should warn, not block.

---

## Capture Quality Rules

Every new durable entry must be **evidenced** by:
- Implementation diff
- Completed tasks
- Verification or test results
- Review findings

### Quality Rubric
- **Durable**: Will it matter beyond this feature?
- **Actionable**: Can an AI or maintainer do something differently because of it?
- **Non-obvious**: Is it more than common sense?
- **Evidenced**: Is there concrete support?
- **Concise**: Is it short enough to be used repeatedly?

---

## Migration Guidance

For projects moving to v0.8:
1. **Re-run Init**: Run `/speckit.memory-md.init` to ensure the latest `config.yml` and `INDEX.md` structure are in place. This is safe and will not overwrite your existing memory content.
2. **Review `INDEX.md`**: Ensure your routing table correctly points to active decisions, architecture constraints, and bug patterns.
3. **Build the Optimizer**: If using the local SQLite optimizer, run `cd .specify/extensions/memory-md && npm install && npm run build`. After building, use `npx .specify/extensions/memory-md speckit-memory` for subsequent CLI calls.
4. **Adopt the Orchestrator**: Transition from manual `/plan` to `/speckit.architecture-guard.governed-plan`.
5. **Preserve Selective Capture**: Continue to use the **Durable Lesson Test** before running `/speckit.memory-md.capture`.
