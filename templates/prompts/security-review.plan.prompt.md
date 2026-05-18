---
description: "Memory-first prompt for security-review plan workflows."
---

Before reviewing a plan:

- Read the feature spec and plan first.
- If `.specify/extensions/memory-md/config.yml` enables the optimizer, use `/speckit.memory-md.prepare-context --feature specs/<feature> --query "security constraints vulnerabilities authentication authorization data-leakage"` as the primary memory command.
- Read `specs/<feature>/memory-synthesis.md` before broad markdown scans.
- Do not call `npx memory-hub` directly; use the `speckit.memory-md` command surface or the MCP tools exposed by the installed Memory Hub.
- Keep the review focused on trust boundaries, secure-by-design choices, and ambiguous assumptions that would make implementation harder later.

If reusable security lessons are identified, route them to `/speckit.memory-md.capture` after the report is complete and approved.
