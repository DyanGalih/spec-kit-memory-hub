---
description: "Memory-first prompt for security-review task workflows."
---

Before reviewing task sequencing:

- Read the plan and existing tasks first.
- If the optimizer is enabled, prepare context with `/speckit.memory-md.prepare-context --feature specs/<feature> --query "security constraints vulnerabilities authentication authorization data-leakage"`.
- Prefer `specs/<feature>/memory-synthesis.md` over broad memory scans.
- Do not call `npx memory-hub` directly; use the `speckit.memory-md` command surface or the MCP tools exposed by the installed Memory Hub.
- Check that security foundations, validation, and hardening work appear before risky implementation tasks.

If the review reveals repeatable guidance, propose capture through `/speckit.memory-md.capture` after the response is delivered.
