---
description: "Promote an approved local technical/architectural lesson from docs/memory into the global shared memory."
---

# Share Lesson

Promote an approved local lesson (e.g. database optimizations, security constraints, framework-specific gotchas) into the global cross-project shared memory.

Use this when:

- you have successfully implemented a complex feature or fixed a recurring bug
- you have verified and written the lesson into a local memory file (`DECISIONS.md`, `BUGS.md`, `WORKLOG.md`)
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
   Use `register-memory` CLI to write the entry to your local `docs/memory/` file, update `INDEX.md`, and sync the local SQLite cache atomically:

   ```bash
   cd .specify/extensions/memory-md && npx speckit-memory register-memory \
     --id "<id>" \
     --title "<title>" \
     --tags "<tags>" \
     --file "docs/memory/<source_file>"
   ```

   **Step 2B — Promote to Global Shared Memory**:
   Once captured locally, promote the lesson to the global cross-project cache using the MCP tool (preferred) or a Spec Kit command prompt:

   **MCP (Preferred)**:
   ```
   speckit_memory_share_lesson(id="<id>", title="<title>", content="<full content>", language="<lang>", framework="<fw>", tags=["<tag1>", "<tag2>"])
   ```

   **Spec Kit command path**:
   - If your client supports Spec Kit commands, continue with `/speckit.memory-md.share-lesson`.
   - There is currently no standalone `npx speckit-memory share-lesson` subcommand.

   > ℹ️ **Step 2A and 2B are separate operations.** Step 2A writes to your local `docs/memory/` and local SQLite. Step 2B writes to the global `~/.spec-kit/shared-memory.sqlite`. Both steps are needed for a fully published lesson.

3. Confirm that the lesson is successfully published to the global SQLite database. Reassure the user that the project's real directory path is fully anonymized (never shared or exported; represented globally only by a cryptographic hash).
