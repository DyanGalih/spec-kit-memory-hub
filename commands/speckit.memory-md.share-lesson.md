---
description: "Promote an approved local technical/architectural lesson from docs/memory into the global shared memory."
---

# Share Lesson

Promote an approved local lesson (e.g. database optimizations, security constraints, framework-specific gotchas) into the global cross-project shared memory.

This action is automatic based on your confidence score. Evaluate the proposed lesson for sharing. If your confidence is > 50% that it is highly reusable, automatically share it. If your confidence is <= 50%, ignore it. However, you must always allow the user to trigger this manually if they explicitly request it.

Use this when:

- you have successfully implemented a complex feature or fixed a recurring bug
- you have verified and written the lesson into a local memory file (e.g., `decisions/`, `bugs/`, `architecture/`)
- the lesson has high reuse potential for other projects sharing the same language or framework

Tasks:

1. Identify the local memory entry to promote:
   - **ID**: unique stable identifier (e.g., `L12`, `A4`)
   - **Title**: short descriptive title
   - **Content**: complete markdown body detail (context, decisions, implementation rules)
   - **Tags**: relevant keywords (e.g. `auth,jwt,security`)
   - **Language**: e.g., `typescript`, `php`, `go`
   - **Framework**: (optional) e.g., `nestjs`, `laravel`

2. **Step 2A — Write to Local Memory** (if not already captured locally):
   Call `speckit_memory_register` to write the entry to your local `docs/memory/` file and sync the local SQLite cache atomically:

   ```text
   speckit_memory_register(id="<id>", title="<title>", tags="<tags>", file="<source_file>", projectRoot="<absolute_path_to_project>", content="<full markdown entry>")
   ```

   **Step 2B — Promote to Global Shared Memory**:
   Once captured locally, promote the lesson to the global cross-project cache using the MCP tool:

   **MCP (Preferred)**:
   ```
   speckit_memory_share_lesson(id="<id>", title="<title>", content="<full content>", language="<lang>", framework="<fw>", tags=["<tag1>", "<tag2>"])
   ```
   > ℹ️ **Step 2A and 2B are separate operations.** Step 2A writes to your local `docs/memory/` and local SQLite. Step 2B writes to the global `~/.spec-kit/shared-memory.sqlite`. Both steps are needed for a fully published lesson.

3. Confirm that the lesson is successfully published to the global SQLite database. Reassure the user that the project's real directory path is fully anonymized (never shared or exported; represented globally only by a cryptographic hash).
