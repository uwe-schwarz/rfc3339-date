# Cloudflare Workers

Consult current official Cloudflare documentation for the APIs, configuration, compatibility, or limits affected by the task. Reuse relevant documentation already checked during the task; unrelated edits do not require a documentation pass.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `bunx wrangler dev` | Local development |
| `bunx wrangler deploy` | Deploy to Cloudflare |
| `bunx wrangler types` | Generate TypeScript types |
| `pnpm run checks` | Run all quality gates (`lint`, `typecheck`, `test`, `build`) |

Run `wrangler types` after changing bindings in wrangler.jsonc.

## Required Checks Workflow

- Run focused checks while iterating, then `pnpm run checks` once against the final code or dependency state before commit or push. Reuse the result for that unchanged state; Git events alone do not require another run.
- Rerun affected checks after relevant edits. Do not commit or push with failing required checks. For documentation-only edits, validate the changed content and formatting.

## Test Requirements

- Cover new runtime behavior with automated tests when existing behavioral tests do not establish the result. Lint and typecheck validate syntax and types; they do not prove runtime behavior.
- Do not rely on manual-only verification for new feature behavior. Avoid tests that merely mirror implementation details.

## Technology Usage

- Prefer the current feature set of the packages, runtimes, standards, and platform APIs this project already uses. Do not add compatibility workarounds for older versions unless a task explicitly asks for that support.
- Use semantic HTML according to the element's meaning. For inline technical text, use `<code>` for code, paths, commands, and config; `<var>` for variables, parameters, placeholders, and runtime values; `<kbd>` for user-entered input; and `<samp>` for sample output or live command/API output.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`
