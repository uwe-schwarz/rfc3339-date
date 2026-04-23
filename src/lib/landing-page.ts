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
  return `<label class="space-y-2 text-xs text-lime-200">
    <span class="block font-medium uppercase tracking-[0.18em] text-lime-500">${renderVar(label)}</span>
    <input id="${escapeHtml(id)}" data-field="${name}"${zoneAttr} value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="w-full rounded-lg border border-lime-500/25 bg-black/35 px-3 py-2 font-mono text-sm text-lime-100 outline-none transition focus:border-lime-300" />
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
  return `<label class="space-y-2 text-xs text-lime-200">
    <span class="block font-medium uppercase tracking-[0.18em] text-lime-500">${renderVar(label)}</span>
    <select id="${escapeHtml(id)}" data-field="${name}" class="w-full rounded-lg border border-lime-500/25 bg-black/35 px-3 py-2 font-mono text-sm text-lime-100 outline-none transition focus:border-lime-300">${optionMarkup}</select>
  </label>`;
}

function renderShell(title: string, body: string): string {
  return `<section class="mt-4 overflow-hidden rounded-2xl border border-lime-500/20 bg-black/40">
    <header class="flex items-center justify-between gap-3 border-b border-lime-500/15 px-4 py-3">
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">${title}</p>
      <button type="button" data-copy class="rounded-md border border-lime-500/30 px-3 py-1.5 text-xs text-lime-200 transition hover:border-lime-300 hover:text-lime-100" aria-label="Copy example command">Copy</button>
    </header>
    ${body}
  </section>`;
}

function renderOutputShell(controlIds: string[]): string {
  return `<section class="mt-4 overflow-hidden rounded-2xl border border-lime-500/20 bg-zinc-950/75">
    <header class="flex items-center justify-between gap-3 border-b border-lime-500/15 px-4 py-3">
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Live Output</p>
      <samp data-status class="text-xs text-lime-400 tabular-nums">loading</samp>
    </header>
    <pre class="min-h-32 overflow-x-auto px-4 py-4"><output data-output-wrapper for="${controlIds.map(escapeHtml).join(" ")}" aria-live="polite" aria-busy="true"><samp data-output class="font-mono text-sm text-lime-100">waiting for response…</samp></output></pre>
  </section>`;
}

function renderEventCard(example: EventExample): string {
  const fieldIds = ["value", "to", "from", "base"].map((name) => `${example.id}-${name}`);
  return `<article class="surface-card fx-enter example-card rounded-2xl border border-lime-500/35 p-4 md:p-5" data-card="tz-convert" data-example="${example.id}">
    <form data-example-form>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-lime-500">${renderEventTitle(example)}</p>
        <h3 class="mt-2 text-xl leading-snug text-lime-100"><kbd>${escapeHtml(example.value)}</kbd></h3>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-lime-300">${renderEventDetail(example)}</p>
      </div>
      <span class="rounded-full border border-lime-500/25 px-3 py-1 text-xs text-lime-400">Live</span>
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
  return `<article class="surface-card fx-enter example-card rounded-2xl border border-lime-500/35 p-4 md:p-5" data-card="${example.kind}" data-example="${example.id}">
    <form data-example-form>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-lime-500">${escapeHtml(example.title)}</p>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-lime-300">${renderApiDetail(example)}</p>
      </div>
      <span class="rounded-full border border-lime-500/25 px-3 py-1 text-xs text-lime-400">Live</span>
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
  return `<style>
    .example-card { position: relative; overflow: hidden; container-name: example-card; container-type: inline-size; background: linear-gradient(180deg, rgb(9 9 11 / 0.88), rgb(9 9 11 / 0.72)); }
    .example-card::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(135deg, rgb(132 204 22 / 0.08), transparent 45%); }
    .example-fields { grid-template-columns: minmax(0, 1fr); }
    @container example-card (min-width: 42rem) {
      .example-fields[data-field-count="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .example-fields[data-field-count="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    .code-shell { color: rgb(244 244 245); }
    .code-cmd { color: rgb(217 249 157); }
    .code-flag { color: rgb(132 204 22); }
    .code-url { color: rgb(165 243 252); }
    .code-arg { color: rgb(253 224 71); }
    .code-output-error { color: rgb(253 186 116); }
    kbd, samp, var { font: inherit; }
    var { font-style: normal; }
    .mode-switch { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
    .mode-switch input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .mode-track {
      position: relative; display: inline-flex; align-items: center; width: 52px; height: 30px;
      border-radius: 9999px; background: rgb(24 24 27); border: 1px solid rgb(63 63 70); transition: background 160ms ease, border-color 160ms ease;
    }
    .mode-thumb {
      width: 24px; height: 24px; margin-left: 3px; border-radius: 9999px; background: rgb(244 244 245);
      box-shadow: 0 0 0 1px rgb(39 39 42); transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
    }
    .mode-switch input:checked + .mode-track { background: rgb(244 244 245); border-color: rgb(228 228 231); }
    .mode-switch input:checked + .mode-track .mode-thumb { transform: translateX(22px); background: rgb(9 9 11); box-shadow: 0 0 0 1px rgb(63 63 70); }
    .mode-switch input:focus-visible + .mode-track { outline: 2px solid rgb(132 204 22 / 0.7); outline-offset: 2px; }
  </style>`;
}

export function renderLandingBody(_nowIso: string): string {
  return `
<header class="fx-enter mb-10 border-b border-lime-500/25 pb-6">
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
    <div>
      <h1 class="fx-flicker text-4xl leading-none tracking-tight text-lime-100">rfc3339.date</h1>
      <p class="mt-3 max-w-4xl text-base leading-relaxed text-lime-300">Strict ${RFC3339_ABBR} time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing. The examples below are live requests against the public API.</p>
      <p class="mt-3 max-w-3xl rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">This is a fun project, not a reliable source of correct date or time. It only reports this server's current clock and is not backed by any serious timekeeping hardware or authority.</p>
    </div>
    <div class="mx-auto w-full max-w-64 lg:max-w-none">
      <div class="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgb(34_211_238_/_0.16),_transparent_55%),linear-gradient(180deg,_rgb(9_9_11_/_0.92),_rgb(9_9_11_/_0.75))] p-4 shadow-[0_0_60px_rgb(34_211_238_/_0.12)]">
        <picture>
          <source type="image/avif" srcset="/fav-380.avif 1x, /fav-760.avif 2x" /><source type="image/webp" srcset="/fav-380.webp 1x, /fav-760.webp 2x" />
          <img src="/fav-380.png" srcset="/fav-380.png 1x, /fav-760.png 2x" alt="rfc3339.date clock emblem" width="760" height="760" fetchpriority="high" decoding="async" class="relative mx-auto block h-auto w-full drop-shadow-[0_0_36px_rgb(34_211_238_/_0.24)]" />
        </picture>
      </div>
    </div>
  </div>
</header>
<ul class="fx-enter fx-delay-1 mb-8 grid gap-3 lg:grid-cols-4">
  <li class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-300">FREE</li>
  <li class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-300">No auth</li>
  <li class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-300">No tracking</li>
  <li><button id="reset-my-timezone" type="button" class="surface-card fx-hover-lift w-full rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-200">Reset to my timezone: <var id="browser-tz" class="text-lime-400">detecting…</var></button></li>
</ul>
<section class="fx-enter fx-delay-1 mb-10 rounded-2xl border border-lime-500/25 bg-zinc-950/35 p-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Output Mode</p>
      <p class="mt-1 text-sm text-lime-300">Examples default to plain text so you see the one-line API result first.</p>
    </div>
    <label class="flex items-center gap-3 rounded-full border border-lime-500/25 px-4 py-2 text-sm text-lime-200">
      <span>Plain text</span>
      <span class="mode-switch">
        <input id="json-toggle" type="checkbox" />
        <span class="mode-track"><span class="mode-thumb"></span></span>
      </span>
      <span>JSON output</span>
    </label>
  </div>
</section>
<section class="fx-enter fx-delay-2 mb-10">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Event Times</p>
      <h2 class="mt-2 text-2xl text-lime-100">Convert human-style event text into your timezone.</h2>
    </div>
    <p class="max-w-xl text-sm leading-relaxed text-lime-300">These two cards focus on the new <code>/tz/convert</code> endpoint and start with your browser timezone as the target.</p>
  </div>
  <div class="grid gap-4 lg:grid-cols-2">${EVENT_EXAMPLES.map(renderEventCard).join("")}</div>
</section>
<section class="fx-enter fx-delay-3 mb-10">
  <div class="mb-4">
    <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Other Endpoints</p>
    <h2 class="mt-2 text-2xl text-lime-100">A couple more live API examples.</h2>
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-lime-300">One example renders ${renderNowZoneEndpoint()}. The other shows a plain <code>/convert</code> request.</p>
  </div>
  <div class="grid gap-4 lg:grid-cols-2">${API_EXAMPLES.map(renderApiCard).join("")}</div>
</section>
<section class="fx-enter fx-delay-3 mb-10">
  <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Shell Helper</p>
      <h2 class="mt-2 text-2xl text-lime-100">Copy a local helper for event conversions.</h2>
    </div>
  </div>
  <article class="surface-card example-card rounded-2xl border border-lime-500/35 p-4 md:p-5">
    <p class="max-w-3xl text-sm leading-relaxed text-lime-300">This bash helper sends free-form event text to <code>/tz/convert</code> and defaults the target zone to your browser timezone.</p>
    ${renderShell(
      "Copyable Bash Function",
      '<pre class="overflow-x-auto px-4 py-4 text-sm leading-7"><code id="helper-code" class="code-shell language-bash"></code></pre>',
    )}
  </article>
</section>
${renderAgentDiscoverySection()}
<nav class="fx-enter fx-delay-3 flex flex-wrap gap-3 text-sm">
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="${SCALAR_REGISTRY_URL}">Scalar Registry</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.json">OpenAPI JSON</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.scalar.json">Scalar-compatible JSON</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/.well-known/agent-skills/rfc3339-date/SKILL.md">SKILL.md</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/imprint">Imprint</a>
</nav>
${landingScript()}`;
}
