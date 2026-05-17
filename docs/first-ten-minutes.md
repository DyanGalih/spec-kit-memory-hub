# First 10 Minutes: A Concrete Example

This guide provides a rapid step-by-step example of setting up and using Spec Kit Memory Hub in a new project.

---

## Step-by-Step Walkthrough

### 1. Bootstrap
Initialize Memory Hub inside your new repository using your client or CLI:
```text
/speckit.memory-md.init
```
This creates the core structure:
* `docs/memory/` containing starter files (`INDEX.md`, `PROJECT_CONTEXT.md`, etc.)
* `.github/copilot-instructions.md` containing agent context settings
* `.specify/extensions/memory-md/config.yml` containing the extension configurations

---

### 2. Fill in Project Context
Open **`docs/memory/PROJECT_CONTEXT.md`** and fill in your basic system context:
```markdown
# Project Context
Last reviewed: 2026-05-17

## Product / Service
Internal support dashboard for triaging customer issues.

## Key Constraints
- Customer notes must stay inside the internal admin system.
- AI agents should not introduce flows that bypass role-based access.
```

---

### 3. Start a Feature
Create a new feature branch and directory (e.g. `specs/042-note-search/`). Scaffolds the feature-local notes inside **`specs/042-note-search/memory.md`**:
```markdown
# Feature Memory — 042-note-search

## Relevant Durable Memory
- Customer note writes must stay in the API service.

## Open Questions
- Should search include archived notes?
```

---

### 4. Synthesize Memory Context
Run the memory-planning synthesis command:
```text
/speckit.memory-md.plan-with-memory
```
This automatically inspects the durable index, pulls matching items, analyzes active feature memory, and writes a compact summary to **`specs/042-note-search/memory-synthesis.md`**:
```markdown
# Memory Synthesis
feature: 042-note-search
hard_conflicts: 0 | soft_conflicts: 1

## Current Constraints
- [C1] Search must respect role-based access.

## Reused Decisions
- [D1] Customer note writes stay in the API service.

## Implementation Watchpoints
- [W1] Apply permission filtering before returning search results.
```

---

### 5. Plan and Implement
Generate your technical design with `/plan` and code details with `/implement`. The AI agent reads **`memory-synthesis.md`** as a low-token package of active project laws and watchpoints.

---

### 6. Capture Durable Lessons
Once tests pass and the feature is completed, capture lessons learned so future features benefit:
```text
/speckit.memory-md.capture
```
The AI analyzes the journey and suggests adding high-value learnings to `BUGS.md` or `DECISIONS.md`. If this feature was simple and didn't yield reusable lessons, approve nothing and leave permanent memory pristine!
