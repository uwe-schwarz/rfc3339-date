# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `npx wrangler dev` | Local development |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Generate TypeScript types |
| `pnpm run checks` | Run all quality gates (`lint`, `typecheck`, `test`, `build`) |

Run `wrangler types` after changing bindings in wrangler.jsonc.

## Required Checks Workflow

- Run `pnpm run checks` after every change.
- Run `pnpm run checks` again immediately before every commit.
- Run `pnpm run checks` again immediately before every push.
- Do not commit or push if `pnpm run checks` fails.

## Test Requirements

- Every new feature must include automated test coverage when behavior is not fully validated by existing automated checks.
- If a feature is not automatically covered by lint/typecheck or another existing script, add or extend tests (for example `vitest`) in the same change.
- Do not rely on manual-only verification for new feature behavior.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`
