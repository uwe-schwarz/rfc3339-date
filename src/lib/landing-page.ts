import { SCALAR_REGISTRY_URL } from "./page-constants";
import { landingScript } from "./landing-page-script";

type EventExample = {
  id: string;
  title: string;
  detail: string;
  value: string;
  from?: string;
  base?: string;
};

type ApiExample = {
  id: string;
  title: string;
  detail: string;
  kind: "now-zone" | "convert";
  value?: string;
  in?: string;
  out?: string;
};

const EVENT_EXAMPLES: EventExample[] = [
  {
    id: "west-coast",
    title: "Event Time",
    detail: "Turn announcement-style event text into your own timezone or any other target zone.",
    value: "tomorrow 10am PST",
  },
  {
    id: "dst-hint",
    title: "STD Hint",
    detail: "STD needs a winter base date in the source region. Switch back to DST when you move the base into summer.",
    value: "5pm STD",
    from: "Europe/Berlin",
    base: "2026-01-15T12:00:00Z",
  },
];

const API_EXAMPLES: ApiExample[] = [
  {
    id: "now-zone",
    title: "Current Time In Zone",
    detail: "Use /now/{tz} to render the current instant directly in a named timezone.",
    kind: "now-zone",
  },
  {
    id: "convert-unix",
    title: "Format Conversion",
    detail: "Use /convert for exact format changes such as Unix seconds to RFC3339.",
    kind: "convert",
    value: "1700000000",
    in: "unix",
    out: "rfc3339",
  },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInput(
  name: string,
  label: string,
  value = "",
  placeholder = "",
  browserZone = false,
): string {
  const zoneAttr = browserZone ? ' data-browser-zone-field="1"' : "";
  return `<label class="space-y-2 text-xs text-lime-200">
    <span class="block font-medium uppercase tracking-[0.18em] text-lime-500">${label}</span>
    <input data-field="${name}"${zoneAttr} value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="w-full rounded-lg border border-lime-500/25 bg-black/35 px-3 py-2 font-mono text-sm text-lime-100 outline-none transition focus:border-lime-300" />
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

function renderOutputShell(): string {
  return `<section class="mt-4 overflow-hidden rounded-2xl border border-lime-500/20 bg-zinc-950/75">
    <header class="flex items-center justify-between gap-3 border-b border-lime-500/15 px-4 py-3">
      <p class="text-xs uppercase tracking-[0.18em] text-lime-500">Live Output</p>
      <span data-status class="text-xs text-lime-400 tabular-nums">loading</span>
    </header>
    <pre class="min-h-32 overflow-x-auto px-4 py-4"><code data-output class="font-mono text-sm text-lime-100">waiting for response…</code></pre>
  </section>`;
}

function renderEventCard(example: EventExample): string {
  return `<article class="surface-card fx-enter example-card rounded-2xl border border-lime-500/35 p-4 md:p-5" data-card="tz-convert" data-example="${example.id}">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-lime-500">${escapeHtml(example.title)}</p>
        <h3 class="mt-2 text-xl leading-snug text-lime-100">${escapeHtml(example.value)}</h3>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-lime-300">${escapeHtml(example.detail)}</p>
      </div>
      <span class="rounded-full border border-lime-500/25 px-3 py-1 text-xs text-lime-400">Live</span>
    </div>
    <div class="grid gap-3 md:grid-cols-2">
      ${renderInput("value", "value", example.value, "tomorrow 10am PST")}
      ${renderInput("to", "to", "", "my timezone", true)}
      ${renderInput("from", "from", example.from ?? "", "Europe/Berlin")}
      ${renderInput("base", "base", example.base ?? "", "2026-06-01T12:00:00Z")}
    </div>
    ${renderShell(
      "Copyable Curl",
      '<pre class="overflow-x-auto px-4 py-4 text-sm leading-7"><code data-command class="code-shell language-bash"></code></pre>',
    )}
    ${renderOutputShell()}
  </article>`;
}

function renderApiCard(example: ApiExample): string {
  const fields =
    example.kind === "now-zone"
      ? renderInput("tz", "tz", "", "my timezone", true)
      : [
          renderInput("value", "value", example.value ?? "", "1700000000"),
          renderInput("in", "in", example.in ?? "", "unix"),
          renderInput("out", "out", example.out ?? "", "rfc3339"),
        ].join("");
  return `<article class="surface-card fx-enter example-card rounded-2xl border border-lime-500/35 p-4 md:p-5" data-card="${example.kind}" data-example="${example.id}">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-lime-500">${escapeHtml(example.title)}</p>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-lime-300">${escapeHtml(example.detail)}</p>
      </div>
      <span class="rounded-full border border-lime-500/25 px-3 py-1 text-xs text-lime-400">Live</span>
    </div>
    <div class="grid gap-3 md:grid-cols-${example.kind === "now-zone" ? "1" : "3"}">${fields}</div>
    ${renderShell(
      "Copyable Curl",
      '<pre class="overflow-x-auto px-4 py-4 text-sm leading-7"><code data-command class="code-shell language-bash"></code></pre>',
    )}
    ${renderOutputShell()}
  </article>`;
}

export function renderLandingHead(): string {
  return `<style>
    .example-card { position: relative; overflow: hidden; background: linear-gradient(180deg, rgb(9 9 11 / 0.88), rgb(9 9 11 / 0.72)); }
    .example-card::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(135deg, rgb(132 204 22 / 0.08), transparent 45%); }
    .code-shell { color: rgb(244 244 245); }
    .code-cmd { color: rgb(217 249 157); }
    .code-flag { color: rgb(132 204 22); }
    .code-url { color: rgb(165 243 252); }
    .code-arg { color: rgb(253 224 71); }
    .code-output-error { color: rgb(253 186 116); }
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
  <h1 class="fx-flicker text-4xl leading-none tracking-tight text-lime-100">rfc3339.date</h1>
  <p class="mt-3 max-w-4xl text-base leading-relaxed text-lime-300">Strict RFC3339 time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing. The examples below are live requests against the public API.</p>
  <p class="mt-3 max-w-3xl rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">This is a fun project, not a reliable source of correct date or time. It only reports this server's current clock and is not backed by any serious timekeeping hardware or authority.</p>
</header>
<section class="fx-enter fx-delay-1 mb-8 grid gap-3 lg:grid-cols-4">
  <div class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-300">FREE</div>
  <div class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-300">No auth</div>
  <div class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-300">No tracking</div>
  <button id="reset-my-timezone" type="button" class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 px-4 py-3 text-center text-sm text-lime-200">Reset to my timezone: <span id="browser-tz" class="text-lime-400">detecting…</span></button>
</section>
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
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-lime-300">One example renders <code>/now/{tz}</code>. The other shows a plain <code>/convert</code> request.</p>
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
<nav class="fx-enter fx-delay-3 flex flex-wrap gap-3 text-sm">
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="${SCALAR_REGISTRY_URL}">Scalar Registry</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.json">OpenAPI JSON</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.scalar.json">Scalar-compatible JSON</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/imprint">Imprint</a>
</nav>
${landingScript()}`;
}
