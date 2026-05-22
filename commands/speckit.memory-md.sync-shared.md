---
description: "Sync matching framework/language specific lessons from global shared memory into a local review buffer."
---

# Sync Shared Lessons

Query the global cross-project shared memory database for external lessons that match this project's technical profile, and synchronize them into a local review buffer.

This action is automatic based on your confidence score. Evaluate the necessity of syncing shared lessons based on the current context. If your confidence is > 50% that syncing is needed, automatically perform the sync. If your confidence is <= 50%, ignore it. However, you must always allow the user to trigger this manually if they explicitly request it.

Use this when:

- starting a new project and you want to pull in lessons from other projects using the same stack
- beginning a new sprint or major feature to leverage cross-project learnings
- you want to see what decisions or bug patterns other projects in your organization have documented

Tasks:

1. Confirm that the project is profiled (`speckit.memory-md.init-project` has been run and `project_profile` is configured in `config.yml`).
2. Call `speckit_memory_sync_shared` to pull matching external memories from the global shared SQLite store (`~/.spec-kit/shared-memory.sqlite`).

3. The sync operation will:
   - Calculate the SHA-256 hash of the project's root path
   - Search the global database for active lessons matching the language and framework
   - Exclude any lessons that originated from this project itself to prevent redundancy
   - Write all new external lessons into a reviewable markdown file at `docs/memory/SHARED_LESSONS.md` pre-populated with interactive banners

4. Guide the user to open and review `docs/memory/SHARED_LESSONS.md`. Instruct them to merge any relevant findings into their permanent `decisions/` or `bugs/` folders and delete the temporary review file.
