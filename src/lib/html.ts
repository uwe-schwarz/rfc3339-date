export function baseLayout(content: string, title: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="page-shell terminal-grid min-h-screen antialiased">
    <main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">${content}</main>
  </body>
</html>`;
}

export function renderLanding(nowIso: string): string {
  const content = `
<header class="fx-enter mb-10 border-b border-lime-500/25 pb-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <h1 class="fx-flicker text-4xl leading-none tracking-tight">rfc3339.date</h1>
    <p class="rounded-md border border-lime-500/40 bg-lime-500/10 px-3 py-1 text-sm font-medium text-lime-400">Live now: <span id="live-now" class="code-result">${nowIso}</span></p>
  </div>
  <p class="mt-3 max-w-3xl text-lime-300">Strict RFC3339 API with validation, conversion, timezone transitions, and leap second dataset endpoints.</p>
</header>
<section class="fx-enter fx-delay-1 mb-8 grid gap-3 sm:grid-cols-3">
  <div class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 bg-zinc-950/40 px-4 py-3 text-center text-sm text-lime-300">FREE</div>
  <div class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 bg-zinc-950/40 px-4 py-3 text-center text-sm text-lime-300">No auth</div>
  <div class="surface-card fx-hover-lift rounded-lg border border-lime-500/35 bg-zinc-950/40 px-4 py-3 text-center text-sm text-lime-300">No tracking</div>
</section>
<section class="fx-enter fx-delay-2 mb-8">
  <h2 class="mb-3 text-xl">Quick examples</h2>
  <div class="surface-card space-y-2 rounded-xl border border-lime-500/35 bg-zinc-950/40 p-4 text-sm text-lime-200">
    <pre class="overflow-x-auto">curl https://rfc3339.date/now</pre>
    <pre class="overflow-x-auto">curl "https://rfc3339.date/convert?value=1700000000&in=unix&out=rfc3339"</pre>
    <pre class="overflow-x-auto">curl "https://rfc3339.date/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z"</pre>
  </div>
</section>
<nav class="fx-enter fx-delay-3 flex flex-wrap gap-3 text-sm">
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/docs">Docs</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/imprint">Imprint</a>
</nav>
<footer class="mt-12 border-t border-lime-500/25 pt-6 text-sm text-lime-400">
</footer>
<script>
  const target = document.getElementById("live-now");
  setInterval(() => { if (target) target.textContent = new Date().toISOString(); }, 1000);
</script>`;
  return baseLayout(content, "rfc3339.date");
}

export function renderImprint(): string {
  const content = `
<h1 class="fx-enter fx-flicker mb-4 text-3xl">Imprint</h1>
<div class="surface-card fx-enter fx-delay-1 space-y-3 rounded-xl border border-lime-500/35 bg-zinc-950/40 p-6 text-sm text-lime-200">
  <p>rfc3339.date</p>
  <p>Owner: Uwe Schwarz, Uhlandstr. 20, 67069 Ludwigshafen, Germany</p>
  <p>Email: mail@uweschwarz.eu</p>
  <p>This service is provided for development and testing use. No user tracking and no authentication.</p>
</div>
<p class="fx-enter fx-delay-2 mt-6 text-sm"><a class="text-lime-300 hover:underline" href="/">Back to landing page</a></p>`;
  return baseLayout(content, "rfc3339.date imprint");
}

export function renderDocs(nowIso: string): string {
  const content = `
<header class="fx-enter mb-6 flex flex-wrap items-center justify-between gap-3">
  <h1 class="fx-flicker text-3xl tracking-tight">rfc3339.date Docs</h1>
  <div class="flex items-center gap-2">
    <button id="toggle-freeze" class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-sm text-lime-300 hover:border-lime-400">Stop time</button>
    <span class="rounded-md border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-sm text-lime-300">Live now: <span id="live-now" class="code-result">${nowIso}</span></span>
  </div>
</header>
<section class="surface-card fx-enter fx-delay-1 mb-6 rounded-xl border border-lime-500/35 bg-zinc-950/40 p-4 text-lime-200">
  <h2 class="mb-2 text-lg">Live examples</h2>
  <div class="space-y-2 text-sm">
    <pre id="ex-now" class="overflow-x-auto"></pre>
    <pre id="ex-validate" class="overflow-x-auto"></pre>
    <pre id="ex-convert" class="overflow-x-auto"></pre>
  </div>
</section>
<section class="surface-card fx-enter fx-delay-2 rounded-xl border border-lime-500/35 bg-zinc-950/45 p-1">
  <redoc spec-url="/openapi.yaml"></redoc>
</section>
<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
<script>
  let frozen = false; let frozenNow = null;
  const nowEl = document.getElementById("live-now");
  const exNow = document.getElementById("ex-now");
  const exValidate = document.getElementById("ex-validate");
  const exConvert = document.getElementById("ex-convert");
  const button = document.getElementById("toggle-freeze");
  const currentIso = () => (frozen ? frozenNow : new Date())?.toISOString();
  const update = () => {
    const iso = currentIso();
    if (nowEl) nowEl.textContent = iso;
    if (exNow) exNow.textContent = 'curl "' + location.origin + '/now?fixed=' + encodeURIComponent(iso) + '"';
    if (exValidate) exValidate.textContent = 'curl "' + location.origin + '/validate?value=' + encodeURIComponent(iso) + '&profile=rfc3339&mode=strict&json=1"';
    if (exConvert) exConvert.textContent = 'curl "' + location.origin + '/convert?value=' + encodeURIComponent(iso) + '&in=rfc3339&out=unixms"';
  };
  button?.addEventListener("click", () => { frozen = !frozen; frozenNow = frozen ? new Date() : null; button.textContent = frozen ? "Resume time" : "Stop time"; update(); });
  update(); setInterval(() => { if (!frozen) update(); }, 1000);
</script>`;
  return baseLayout(content, "rfc3339.date docs");
}
