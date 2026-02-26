export function baseLayout(content: string, title: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "media",
        theme: {
          extend: {
            colors: {
              brand: { 500: "#14b8a6", 600: "#0d9488" },
              accent: { 500: "#84cc16", 600: "#65a30d" }
            }
          }
        }
      }
    </script>
    <style>:root { color-scheme: light dark; }</style>
  </head>
  <body class="min-h-screen bg-white text-zinc-900 antialiased dark:bg-[#0b0d12] dark:text-zinc-100">
    <main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">${content}</main>
  </body>
</html>`;
}

export function renderLanding(nowIso: string): string {
  const content = `
<header class="mb-10 border-b border-zinc-200 pb-6 dark:border-zinc-800">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-3xl font-semibold tracking-tight">rfc3339.date</h1>
    <p class="rounded-md border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-600 dark:text-brand-500">Live now: <span id="live-now">${nowIso}</span></p>
  </div>
  <p class="mt-3 text-zinc-600 dark:text-zinc-400">Strict RFC3339 API with validation, conversion, timezone transitions, and leap second dataset endpoints.</p>
</header>
<section class="mb-8 grid gap-3 sm:grid-cols-3">
  <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">FREE</div>
  <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">No auth</div>
  <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">No tracking</div>
</section>
<section class="mb-8">
  <h2 class="mb-3 text-xl font-semibold">Quick examples</h2>
  <div class="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
    <pre class="overflow-x-auto">curl https://rfc3339.date/now</pre>
    <pre class="overflow-x-auto">curl "https://rfc3339.date/convert?value=1700000000&in=unix&out=rfc3339"</pre>
    <pre class="overflow-x-auto">curl "https://rfc3339.date/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z"</pre>
  </div>
</section>
<nav class="flex flex-wrap gap-3 text-sm">
  <a class="rounded-md border border-zinc-300 px-3 py-2 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 dark:hover:border-brand-500" href="/docs">Docs</a>
  <a class="rounded-md border border-zinc-300 px-3 py-2 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 dark:hover:border-brand-500" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="rounded-md border border-zinc-300 px-3 py-2 hover:border-brand-500 hover:text-brand-600 dark:border-zinc-700 dark:hover:border-brand-500" href="/imprint">Imprint</a>
</nav>
<footer class="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
</footer>
<script>
  const target = document.getElementById("live-now");
  setInterval(() => { if (target) target.textContent = new Date().toISOString(); }, 1000);
</script>`;
  return baseLayout(content, "rfc3339.date");
}

export function renderImprint(): string {
  const content = `
<h1 class="mb-4 text-3xl font-semibold">Imprint</h1>
<div class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
  <p>rfc3339.date</p>
  <p>Owner: Uwe Schwarz, Uhlandstr. 20, 67069 Ludwigshafen, Germany</p>
  <p>Email: mail@uweschwarz.eu</p>
  <p>This service is provided for development and testing use. No user tracking and no authentication.</p>
</div>
<p class="mt-6 text-sm"><a class="text-brand-600 hover:underline dark:text-brand-500" href="/">Back to landing page</a></p>`;
  return baseLayout(content, "rfc3339.date imprint");
}

export function renderDocs(nowIso: string): string {
  const content = `
<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
  <h1 class="text-3xl font-semibold tracking-tight">rfc3339.date Docs</h1>
  <div class="flex items-center gap-2">
    <button id="toggle-freeze" class="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:border-brand-500 dark:border-zinc-700">Stop time</button>
    <span class="rounded-md border border-accent-500/40 bg-accent-500/10 px-3 py-2 text-sm text-accent-600 dark:text-accent-500">Live now: <span id="live-now">${nowIso}</span></span>
  </div>
</header>
<section class="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
  <h2 class="mb-2 text-lg font-semibold">Live examples</h2>
  <div class="space-y-2 text-sm">
    <pre id="ex-now" class="overflow-x-auto"></pre>
    <pre id="ex-validate" class="overflow-x-auto"></pre>
    <pre id="ex-convert" class="overflow-x-auto"></pre>
  </div>
</section>
<section class="rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
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
