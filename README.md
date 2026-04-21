# Spec Kit Memory (Markdown-first)

A **Spec Kit extension** for **repository-native durable memory**.

It helps teams:
- keep important decisions visible
- avoid repeating mistakes
- improve AI-assisted development with better context

---

# 🧠 V1 Scope

This V1 release is intentionally simple:
- **repo-first**
- **file-structured**
- **command-driven**
- **Git-reviewable**

It is **not** trying to be a full Claude-style auto-loading memory runtime yet.

---

# 🧠 What this adds to Spec Kit

Spec Kit already provides:
- structured execution (spec → plan → tasks → implement)
- project guidance via constitution

This extension adds:
- **durable memory across features**
- **structured reflection after implementation**
- **repo-native knowledge storage**

---

# ⚙️ Core idea

- **Specs** → what to build  
- **Memory** → what we’ve learned  

Memory is:
- selective  
- durable  
- reusable  

This extension keeps memory in normal Markdown files inside the repository so the team can review, edit, and version it like code.

---

# 🧭 When to use this extension

Use this extension when you want to:

### ✅ Keep long-term knowledge in your repo
- Store **decisions, architecture insights, and recurring bugs**
- Make knowledge **visible, reviewable, and versioned in Git**

### ✅ Improve future development quality
- Avoid repeating the same mistakes  
- Reuse past decisions and patterns  
- Give AI better context before coding  

### ✅ Work with Spec Kit in a structured way
- Use **specs for execution**  
- Use **memory for constraints and lessons**  
- Keep a clear separation between “what to build” and “what we’ve learned”  

### ✅ Maintain high-signal documentation
- Capture only **durable, reusable knowledge**  
- Keep memory **small, focused, and useful**  
- Avoid bloated or noisy documentation  

### ✅ Use AI tools (Copilot, Cursor, etc.) effectively
- Let AI read consistent, structured context  
- Guide planning and implementation with real project knowledge  
- Improve output quality without increasing prompt complexity  

---

# 🚫 When NOT to use this extension

Do not use this extension if you want:

### ❌ Fully automatic memory capture
- This system is **selective and intentional**  
- It does not automatically record everything  

### ❌ Claude-style hierarchical auto-loading
- V1 does not resolve layered memory automatically
- V1 expects commands and team workflow to drive memory usage

### ❌ A complete historical archive
- It is not meant to store:
  - all commits  
  - all PRs  
  - full implementation history  
- Use Git history for that  

### ❌ Detailed implementation logs
- Do not store:
  - step-by-step coding logs  
  - trivial refactors  
  - temporary notes  
- That belongs in specs or commits, not memory  

### ❌ Zero-maintenance workflows
- This system requires:
  - occasional reflection  
  - conscious decisions about what to store  
- It trades automation for **clarity and quality**  

### ❌ Large, unstructured knowledge bases
- If you need:
  - massive data storage  
  - full-text search across everything  
  - automatic pattern mining  

This approach may feel too minimal  

---

# 🧠 What “memory” means in this project

Memory is:

> **Durable, reusable knowledge that improves future decisions**

### Examples
- architectural tradeoffs  
- important constraints  
- recurring bug patterns  
- non-obvious implementation lessons  

### Not memory
- logs  
- history  
- raw data  
- temporary notes  

---

# ⚖️ Guiding principle

> If this information will help future work make better decisions, store it.  
> If not, leave it out.

---

# 🏗️ Project structure

.github/
  copilot-instructions.md

docs/
  memory/
    PROJECT_CONTEXT.md
    ARCHITECTURE.md
    DECISIONS.md
    BUGS.md
    WORKLOG.md

specs/
  001-feature-name/
    spec.md
    plan.md
    tasks.md

prompts/
  specify.memory.prompt.md

---

# 🚀 Quick Start

1. Install the extension into a Spec Kit project.
2. Run `/speckit.memory-md.bootstrap`.
3. Fill in:
   - `docs/memory/PROJECT_CONTEXT.md`
   - `docs/memory/ARCHITECTURE.md`
4. Use `/speckit.memory-md.plan-with-memory` before implementation.
5. Use `/speckit.memory-md.capture` or `/speckit.memory-md.capture-from-diff` after meaningful work.
6. Run `/speckit.memory-md.audit` occasionally to keep memory high-signal.

---

# 🛠️ How To Use The Commands

## `/speckit.memory-md.bootstrap`

Use this first in a new or existing Spec Kit project.

It should:
- create missing `docs/memory/` files
- create starter spec files when needed
- add or update shared Copilot instructions

Use it when:
- you are adopting this extension in a repo for the first time
- the repo is missing the expected memory structure

## `/speckit.memory-md.plan-with-memory`

Use this before planning or implementing a feature.

It should:
- read the current spec and relevant memory files
- surface prior decisions and recurring bug risks
- carry those constraints into the implementation plan

Use it when:
- starting a new feature
- revisiting a feature that touches known architectural decisions

## `/speckit.memory-md.capture`

Use this after meaningful work is complete.

It should:
- review the spec, plan, tasks, and validation results
- decide whether any durable lessons should be kept
- update only the relevant memory files

Use it when:
- a feature introduced a reusable decision
- a fix revealed a durable lesson
- implementation uncovered a non-obvious constraint

## `/speckit.memory-md.capture-from-diff`

Use this when the diff is the best source of truth.

It should:
- inspect changed files
- extract decisions, bug patterns, and important tradeoffs
- update memory only when the lesson is worth keeping

Use it when:
- you want to review memory directly from code changes
- the implementation is already done and you want a fast memory pass

## `/speckit.memory-md.audit`

Use this when memory starts to feel noisy, repetitive, stale, or hard to trust.

It should:
- find duplicate, stale, vague, contradictory, or misplaced entries
- suggest removals, merges, rewrites, and moves
- keep memory concise and high-signal

Use it when:
- memory files have grown messy
- the team is unsure which entries are still useful
- you want periodic cleanup before memory quality degrades

---

# 🔄 Workflow

## For a new feature

1. Read:
   - spec (or create one)
   - memory files:
     - PROJECT_CONTEXT.md  
     - DECISIONS.md  
     - BUGS.md  

2. Plan and implement using Spec Kit  

3. After implementation:
   - run memory reflection  
   - update memory only if needed  

---

## For a bug fix

1. Read:
   - BUGS.md  
   - DECISIONS.md  

2. Fix the issue  

3. If reusable:
   - add root cause and prevention to BUGS.md  

---

## For cleanup and simplification

1. Run `/speckit.memory-md.audit`.
2. Review suggested removals, merges, rewrites, and file moves.
3. Simplify entries until they are:
   - durable
   - concise
   - reusable
4. Keep only information that improves future work.

Use this flow whenever memory starts feeling messy.

---

# 🧩 Commands (Spec Kit extension)

/speckit.memory-md.bootstrap  
/speckit.memory-md.plan-with-memory  
/speckit.memory-md.capture  
/speckit.memory-md.capture-from-diff  
/speckit.memory-md.audit  

---

# 🚀 Installation

## Local development install

specify extension add --dev /path/to/spec-kit-memory-hub  

## From GitHub (after publishing)

specify extension add memory-md --from https://github.com/DyanGalih/spec-kit-memory-hub/archive/refs/tags/v0.5.0.zip  

---

# ✅ Release Checklist

- Valid `extension.yml` at repo root
- Commands install successfully with current `specify` CLI
- README includes install and usage instructions
- `LICENSE` included
- Extension tested in a fresh Spec Kit project
- Command descriptions and file paths reflect the shipped V1 behavior

---

# 📌 Design philosophy

- Memory should be **curated, not automatic**  
- Knowledge should be **visible in Git**  
- Specs and memory should remain **separate**  
- AI should **use memory, not replace thinking**  

---

# 🏁 Summary

This extension helps you:

- build with structure (Spec Kit)  
- learn from experience (memory)  
- improve over time without increasing complexity  
