---
description: "Memory-first prompt for security-review branch workflows."
---

Before reviewing a branch or PR diff:

- Determine the diff scope first, then inspect only changed files.
- If the optimizer is enabled, call `/speckit.memory-md.prepare-context --feature specs/<feature> --query "security constraints vulnerabilities authentication authorization data-leakage"` before scanning the diff.
- Read `specs/<feature>/memory-synthesis.md` first so historical lessons shape the review.
- Do not call `npx memory-hub` directly; use the `speckit.memory-md` command surface or the MCP tools exposed by the installed Memory Hub.
- Focus findings on the introduced changes, especially access control, validation, secrets, and dependency risk.

If the branch exposes a reusable security pattern or recurring failure mode, trigger `/speckit.memory-md.capture` after the report.
