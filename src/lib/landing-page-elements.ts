import { SITE_URL } from "./page-constants";

export const RFC3339_ABBR = '<abbr title="Request for Comments 3339">RFC3339</abbr>';
export const DST_ABBR = '<abbr title="Daylight Saving Time">DST</abbr>';
export const STD_ABBR = '<abbr title="Standard Time">STD</abbr>';

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderVar(name: string): string {
  return `<var>${escapeHtml(name)}</var>`;
}

export function renderDateTime(value: string): string {
  return `<time datetime="${escapeHtml(value)}">${escapeHtml(value)}</time>`;
}

const CODEX_MCP_INSTALL = `codex mcp add rfc3339 --url ${SITE_URL}/mcp`;
const OPENCODE_MCP_CONFIG = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "rfc3339": {
      "type": "remote",
      "url": "${SITE_URL}/mcp"
    }
  }
}`;

function renderCodePanel(id: string, label: string, title: string, body: string): string {
  return `<section class="mt-4 overflow-hidden rounded-2xl border border-lime-500/20 bg-black/40">
    <header class="flex items-center justify-between gap-3 border-b border-lime-500/15 px-4 py-3">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-lime-500">${label}</p>
        <p class="mt-1 text-sm text-lime-200">${title}</p>
      </div>
      <button type="button" data-copy-target="${id}" class="rounded-md border border-lime-500/30 px-3 py-1.5 text-xs text-lime-200 transition hover:border-lime-300 hover:text-lime-100">Copy</button>
    </header>
    <pre class="overflow-x-auto px-4 py-4 text-sm leading-7 text-lime-100"><code id="${id}">${escapeHtml(body)}</code></pre>
  </section>`;
}

export function renderAgentDiscoverySection(): string {
  return `<section class="fx-enter fx-delay-3 mb-10">
  <div class="mb-4">
    <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Agent Discovery</p>
    <h2 class="mt-2 text-2xl text-lime-100">Machine-readable entry points for agents.</h2>
  </div>
  <div class="grid gap-4 lg:grid-cols-1">
    <article class="surface-card fx-hover-lift rounded-2xl border border-lime-500/35 p-4 md:p-5">
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Remote MCP</p>
      <h3 class="mt-2 text-lg text-lime-100">Install MCP</h3>
      <p class="mt-3 text-sm leading-relaxed text-lime-300">Use <code>${SITE_URL}/mcp</code> in clients that support remote HTTP MCP servers.</p>
      ${renderCodePanel("codex-mcp-install", "Codex", "Add it with the Codex CLI", CODEX_MCP_INSTALL)}
      ${renderCodePanel("opencode-mcp-install", "Opencode", "Add it to your Opencode config", OPENCODE_MCP_CONFIG)}
    </article>
  </div>
</section>`;
}
