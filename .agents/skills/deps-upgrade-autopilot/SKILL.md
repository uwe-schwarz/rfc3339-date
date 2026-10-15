---
name: deps-upgrade-autopilot
description: Prepare this repository's development tools locally before deployment.
---

# Local deployment maintenance

This repository no longer has recurring cloud dependency maintenance. Read
`AGENTS.md` and `README.md`. Use the assigned local host and existing checkout.

- `pnpm run deploy` updates the three devDependencies within their compatible
  ranges, runs `pnpm run checks`, then deploys. Honor failure; do not bypass it.
- Use `pnpm run deploy -- --dry-run` to validate without publishing.
- Do not restore removed build, visual, lint or test frameworks.
- Hono updates require an applicable fix or API change and contract verification.
- Scalar publication is separate and needed only for changed documentation.
- Never create schedules, commit, push or deploy beyond the user's request.
