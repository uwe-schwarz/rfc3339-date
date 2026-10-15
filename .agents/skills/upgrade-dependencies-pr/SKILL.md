---
name: upgrade-dependencies-pr
description: Create a requested maintenance PR for this minimal Worker repository.
---

# Dependency maintenance PR

Read `AGENTS.md` and `README.md`. Work locally on the assigned host in the existing
checkout. Do not create worktrees unless requested.

1. Inspect the working tree and preserve unrelated edits.
2. Update development tools using `pnpm update --dev`; retain compatible majors
   and the release-age policy. Update Hono only for a justified fix or API change.
3. Run `pnpm run checks` once on the final state. For runtime changes use the
   focused native contracts; inspect UI changes in a browser.
4. Create a `codex/` branch, commit, push and create the requested PR. Attach it
   to the chat. Include the actual validation result and relevant issue number.
5. Follow checks and reviews when requested. Do not merge or deploy without
   authorization. Local deployments use `pnpm run deploy`.

Scalar's pinned on-demand CLI is reviewed only with documentation changes.
Do not restore the retired visual harness, cloud autopilot, generators, lint
frameworks or test frameworks.
