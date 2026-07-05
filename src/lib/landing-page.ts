import { SCALAR_REGISTRY_URL } from "./page-constants";
import {
  DST_ABBR,
  RFC3339_ABBR,
  STD_ABBR,
  escapeHtml,
  renderAgentDiscoverySection,
  renderDateTime,
  renderVar,
} from "./landing-page-elements";
import { landingScript } from "./landing-page-script";
import { LANDING_PAGE_STYLES } from "./landing-page-styles";
type EventExample = { id: string; title: string; detail: string; value: string; from?: string; base?: string };
type ApiExample = { id: string; title: string; kind: "now-zone" | "convert"; value?: string; in?: string; out?: string };

const EVENT_EXAMPLES: EventExample[] = [
  { id: "west-coast", title: "Event Time", detail: "Turn announcement-style event text into your own timezone or any other target zone.", value: "tomorrow 10am PST" },
  { id: "dst-hint", title: "STD Hint", detail: "STD needs a winter base date in the source region. Switch back to DST when you move the base into summer.", value: "5pm STD", from: "Europe/Berlin", base: "2026-01-15T12:00:00Z" },
];

const CONVERSION_FORMATS = ["rfc3339", "iso8601", "unix", "unixms", "ntp", "httpdate", "emaildate", "gps", "tai", "jd", "mjd", "excel1900", "excel1904", "weekdate", "ordinal", "doy"] as const;

const API_EXAMPLES: ApiExample[] = [
  { id: "now-zone", title: "Current Time In Zone", kind: "now-zone" },
  { id: "convert-unix", title: "Format Conversion", kind: "convert", value: "1700000000", in: "unix", out: "rfc3339" },
];

function renderNowZoneEndpoint(): string {
  return `<code>/now/${renderVar("tz")}</code>`;
}

function renderEventTitle(example: EventExample): string {
  if (example.title === "STD Hint") return `${STD_ABBR} Hint`;
  return escapeHtml(example.title);
}

function renderEventDetail(example: EventExample): string {
  const detail = escapeHtml(example.detail)
    .replaceAll("STD", STD_ABBR)
    .replaceAll("DST", DST_ABBR);
  const base = example.base ? ` Base ${renderDateTime(example.base)}.` : "";
  return `${detail}${base}`;
}

function renderApiDetail(example: ApiExample): string {
  if (example.kind === "now-zone") {
    return `Use ${renderNowZoneEndpoint()} to render the current instant directly in a named timezone.`;
  }
  return `Use <code>/convert</code> for exact format changes such as Unix seconds to ${RFC3339_ABBR}.`;
}

function renderInput(
  name: string,
  label: string,
  value = "",
  placeholder = "",
  browserZone = false,
  id = name,
): string {
  const zoneAttr = browserZone ? ' data-browser-zone-field="1"' : "";
  return `<label class="neo-field space-y-2 text-xs">
    <span class="neo-label block">${renderVar(label)}</span>
    <input id="${escapeHtml(id)}" data-field="${name}"${zoneAttr} value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="w-full px-3 py-2 font-mono text-sm outline-none transition" />
  </label>`;
}

function renderSelect(
  name: string,
  label: string,
  value: string,
  options: readonly string[],
  id = name,
): string {
  const optionMarkup = options
    .map((option) => {
      const selected = option === value ? " selected" : "";
      return `<option value="${escapeHtml(option)}"${selected}>${escapeHtml(option)}</option>`;
    })
    .join("");
  return `<label class="neo-field space-y-2 text-xs">
    <span class="neo-label block">${renderVar(label)}</span>
    <select id="${escapeHtml(id)}" data-field="${name}" class="w-full px-3 py-2 font-mono text-sm outline-none transition">${optionMarkup}</select>
  </label>`;
}

function renderShell(title: string, body: string): string {
  return `<section class="neo-code-panel mt-4 overflow-hidden">
    <header class="flex items-center justify-between gap-3 px-4 py-3">
      <p class="neo-label">${title}</p>
      <button type="button" data-copy class="neo-copy-button" aria-label="Copy example command">Copy</button>
    </header>
    ${body}
  </section>`;
}

function renderOutputShell(controlIds: string[]): string {
  return `<section class="neo-output-panel mt-4 overflow-hidden">
    <header class="flex items-center justify-between gap-3 px-4 py-3">
      <p class="neo-label">Live Output</p>
      <samp data-status class="neo-status text-xs tabular-nums">loading</samp>
    </header>
    <pre class="min-h-32 overflow-x-auto px-4 py-4"><output data-output-wrapper for="${controlIds.map(escapeHtml).join(" ")}" aria-live="polite" aria-busy="true"><samp data-output class="font-mono text-sm">waiting for response…</samp></output></pre>
  </section>`;
}

function renderEventCard(example: EventExample): string {
  const fieldIds = ["value", "to", "from", "base"].map((name) => `${example.id}-${name}`);
  return `<article class="neo-panel neo-shadow fx-enter example-card p-4 md:p-5" data-card="tz-convert" data-example="${example.id}">
    <form data-example-form>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <p class="neo-label">${renderEventTitle(example)}</p>
        <h3 class="mt-2 text-xl leading-snug"><kbd>${escapeHtml(example.value)}</kbd></h3>
        <p class="mt-2 max-w-xl text-sm leading-relaxed">${renderEventDetail(example)}</p>
      </div>
      <span class="neo-stamp">Live</span>
    </div>
    <fieldset class="example-fields grid gap-3 border-0 p-0" data-field-count="2">
      <legend class="sr-only">${escapeHtml(example.title)} parameters</legend>
      ${renderInput("value", "value", example.value, "tomorrow 10am PST", false, fieldIds[0])}
      ${renderInput("to", "to", "", "my timezone", true, fieldIds[1])}
      ${renderInput("from", "from", example.from ?? "", "Europe/Berlin", false, fieldIds[2])}
      ${renderInput("base", "base", example.base ?? "", "2026-06-01T12:00:00Z", false, fieldIds[3])}
    </fieldset>
    ${renderShell(
      "Copyable Curl",
      '<pre class="overflow-x-auto px-4 py-4 text-sm leading-7"><code data-command class="code-shell language-bash"></code></pre>',
    )}
    ${renderOutputShell(fieldIds)}
    </form>
  </article>`;
}

function renderApiCard(example: ApiExample): string {
  const names = example.kind === "now-zone" ? ["tz"] : ["value", "in", "out"];
  const fieldIds = names.map((name) => `${example.id}-${name}`);
  const fields =
    example.kind === "now-zone"
      ? renderInput("tz", "tz", "", "my timezone", true, fieldIds[0])
      : [
          renderInput("value", "value", example.value ?? "", "1700000000", false, fieldIds[0]),
          renderSelect("in", "in", example.in ?? "unix", CONVERSION_FORMATS, fieldIds[1]),
          renderSelect("out", "out", example.out ?? "rfc3339", CONVERSION_FORMATS, fieldIds[2]),
        ].join("");
  return `<article class="neo-panel neo-shadow fx-enter example-card p-4 md:p-5" data-card="${example.kind}" data-example="${example.id}">
    <form data-example-form>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <p class="neo-label">${escapeHtml(example.title)}</p>
        <p class="mt-2 max-w-xl text-sm leading-relaxed">${renderApiDetail(example)}</p>
      </div>
      <span class="neo-stamp">Live</span>
    </div>
    <fieldset class="example-fields grid gap-3 border-0 p-0" data-field-count="${example.kind === "now-zone" ? "1" : "3"}">
      <legend class="sr-only">${escapeHtml(example.title)} parameters</legend>
      ${fields}
    </fieldset>
    ${renderShell(
      "Copyable Curl",
      '<pre class="overflow-x-auto px-4 py-4 text-sm leading-7"><code data-command class="code-shell language-bash"></code></pre>',
    )}
    ${renderOutputShell(fieldIds)}
    </form>
  </article>`;
}

export function renderLandingHead(): string {
  return LANDING_PAGE_STYLES;
}

export function renderLandingBody(_nowIso: string): string {
  return `
<div class="neo-page">
<header class="neo-hero fx-enter mb-8 p-4 md:p-6">
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch">
    <div class="flex flex-col justify-between gap-6">
      <div>
        <h1 class="neo-hero-title text-5xl leading-none md:text-7xl">rfc3339.date</h1>
        <p class="mt-4 max-w-4xl text-lg leading-relaxed">Strict ${RFC3339_ABBR} time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing. The examples below are live requests against the public API.</p>
      </div>
      <p class="neo-warning max-w-4xl px-4 py-3 text-sm leading-relaxed">This is a fun project, not a reliable source of correct date or time. It only reports this server's current clock and is not backed by any serious timekeeping hardware or authority.</p>
    </div>
    <aside>
      <div class="neo-hero-controls flex justify-end">
        <label class="neo-theme-toggle relative inline-flex items-center gap-1" aria-label="Toggle color theme">
          <span>Light</span>
          <input id="theme-toggle" data-theme-toggle="1" type="checkbox" />
          <span class="mode-track"><span class="mode-thumb"></span></span>
          <span>Dark</span>
        </label>
      </div>
      <div class="neo-panel neo-logo-panel neo-shadow-small p-3">
        <picture class="neo-logo-mat block p-3">
          <source type="image/avif" srcset="/logo-560.avif 560w, /logo-1115.avif 1115w" sizes="(min-width: 1024px) 22rem, calc(100vw - 4rem)" /><source type="image/webp" srcset="/logo-560.webp 560w, /logo-1115.webp 1115w" sizes="(min-width: 1024px) 22rem, calc(100vw - 4rem)" />
          <img src="/logo-560.png" srcset="/logo-560.png 560w, /logo-1115.png 1115w" sizes="(min-width: 1024px) 22rem, calc(100vw - 4rem)" alt="rfc3339.date logo" width="1115" height="370" fetchpriority="high" decoding="async" class="mx-auto block h-auto w-full" />
        </picture>
      </div>
    </aside>
  </div>
</header>
<ul class="fx-enter fx-delay-1 mb-8 grid gap-3 lg:grid-cols-4">
  <li class="neo-chip fx-hover-lift flex items-center justify-center px-4 py-3 text-center text-sm">FREE</li>
  <li class="neo-chip fx-hover-lift flex items-center justify-center px-4 py-3 text-center text-sm">No auth</li>
  <li class="neo-chip fx-hover-lift flex items-center justify-center px-4 py-3 text-center text-sm">No tracking</li>
  <li class="neo-chip fx-hover-lift"><button id="reset-my-timezone" type="button" class="w-full px-4 py-3 text-center text-sm">Reset to my timezone: <var id="browser-tz">detecting…</var></button></li>
</ul>
<section class="neo-panel neo-shadow fx-enter fx-delay-1 mb-10 p-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="neo-label">Output Mode</p>
      <p class="neo-muted mt-1 text-sm">Examples default to plain text so you see the one-line API result first.</p>
    </div>
    <label class="neo-theme-toggle relative inline-flex items-center gap-1">
      <span>Plain text</span>
      <input id="json-toggle" type="checkbox" />
      <span class="mode-track"><span class="mode-thumb"></span></span>
      <span>JSON output</span>
    </label>
  </div>
</section>
<section class="neo-section fx-enter fx-delay-2">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="neo-label">Event Times</p>
      <h2 class="mt-2 text-2xl">Convert human-style event text into your timezone.</h2>
    </div>
    <p class="neo-muted max-w-xl text-sm leading-relaxed">These two cards focus on the new <code>/tz/convert</code> endpoint and start with your browser timezone as the target.</p>
  </div>
  <div class="grid gap-4 lg:grid-cols-2">${EVENT_EXAMPLES.map(renderEventCard).join("")}</div>
</section>
<section class="neo-section fx-enter fx-delay-3">
  <div class="mb-4">
    <p class="neo-label">Other Endpoints</p>
    <h2 class="mt-2 text-2xl">A couple more live API examples.</h2>
    <p class="neo-muted mt-3 max-w-3xl text-sm leading-relaxed">One example renders ${renderNowZoneEndpoint()}. The other shows a plain <code>/convert</code> request.</p>
  </div>
  <div class="grid gap-4 lg:grid-cols-2">${API_EXAMPLES.map(renderApiCard).join("")}</div>
</section>
<section class="neo-section fx-enter fx-delay-3">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="neo-label">Shell Helper</p>
      <h2 class="mt-2 text-2xl">Copy a local helper for event conversions.</h2>
    </div>
  </div>
  <article class="neo-panel neo-shadow example-card p-4 md:p-5">
    <p class="neo-muted max-w-3xl text-sm leading-relaxed">This bash helper sends free-form event text to <code>/tz/convert</code> and defaults the target zone to your browser timezone.</p>
    ${renderShell(
      "Copyable Bash Function",
      '<pre class="overflow-x-auto px-4 py-4 text-sm leading-7"><code id="helper-code" class="code-shell language-bash"></code></pre>',
    )}
  </article>
</section>
${renderAgentDiscoverySection()}
<nav class="neo-footer-nav fx-enter fx-delay-3 flex flex-wrap gap-3 text-sm">
  <a class="fx-hover-lift" href="${SCALAR_REGISTRY_URL}">Scalar Registry</a>
  <a class="fx-hover-lift" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="fx-hover-lift" href="/openapi.json">OpenAPI JSON</a>
  <a class="fx-hover-lift" href="/openapi.scalar.json">Scalar-compatible JSON</a>
  <a class="fx-hover-lift" href="/.well-known/agent-skills/rfc3339-date/SKILL.md">SKILL.md</a>
  <a class="fx-hover-lift" href="/imprint">Imprint</a>
</nav>
</div>
${landingScript()}`;
}
