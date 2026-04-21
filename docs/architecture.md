# Architecture

## Layers

### 1. Spec Kit execution layer
- constitution
- feature specs
- plans
- tasks
- implementation work

### 2. Durable project memory layer
- project context
- architecture notes
- decisions
- recurring bugs
- worklog

### 3. Editor/runtime behavior layer
- Copilot instructions
- prompt files
- local repo conventions

## V1 boundary

This project is a repository-first memory workflow, not a dynamic memory runtime.

V1 intentionally relies on:
- explicit Markdown files
- shared folder conventions
- command-driven usage

V1 intentionally does not include:
- automatic hierarchical memory loading
- database-backed retrieval
- hidden memory state outside the repository

## Principle

Specifications are for active delivery.
Memory is for durable learning.

Do not overload feature specs with cross-feature memory.
Do not overload memory with routine implementation detail.
