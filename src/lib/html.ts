type LayoutInput = {
  canonicalPath: string;
  content: string;
  description: string;
  title: string;
};

function baseLayout({ canonicalPath, content, description, title }: LayoutInput): string {
  const site = "https://rfc3339.date";
  const canonicalUrl = `${site}${canonicalPath}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="theme-color" content="#0f766e" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="min-h-dvh text-zinc-900 antialiased dark:text-zinc-100">
    <a class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-white" href="#content">Skip to content</a>
    <main id="content" class="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">${content}</main>
  </body>
</html>`;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950";

export function renderLanding(nowIso: string): string {
  const content = `
<header class="surface panel-in rounded-2xl p-6 md:p-8">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-balance text-4xl font-semibold">rfc3339.date</h1>
    <p class="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-500" aria-live="polite" aria-atomic="true">Live now: <span id="live-now" class="tabular-nums">${nowIso}</span></p>
  </div>
  <p class="text-pretty mt-3 max-w-3xl text-zinc-700 dark:text-zinc-300">Strict RFC3339 API with validation, conversions, timezone transitions, and leap second datasets. Plain text by default, JSON when requested.</p>
</header>
<section class="mt-6 grid gap-3 sm:grid-cols-3">
  <div class="surface panel-in rounded-xl px-4 py-3 text-sm font-medium" style="animation-delay: 40ms">FREE</div>
  <div class="surface panel-in rounded-xl px-4 py-3 text-sm font-medium" style="animation-delay: 70ms">No auth</div>
  <div class="surface panel-in rounded-xl px-4 py-3 text-sm font-medium" style="animation-delay: 100ms">No tracking</div>
</section>
<section class="surface panel-in mt-6 rounded-2xl p-6" style="animation-delay: 110ms">
  <h2 class="text-balance text-xl font-semibold">Quick examples</h2>
  <div class="mt-3 space-y-2 text-sm">
    <pre class="overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-zinc-100">curl https://rfc3339.date/now</pre>
    <pre class="overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-zinc-100">curl "https://rfc3339.date/convert?value=1700000000&in=unix&out=rfc3339"</pre>
    <pre class="overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-zinc-100">curl "https://rfc3339.date/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z"</pre>
  </div>
</section>
<nav class="mt-6 flex flex-wrap gap-3 text-sm" aria-label="Primary">
  <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/docs">Live API docs</a>
  <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/imprint">Imprint</a>
</nav>
<footer class="mt-8 text-sm text-zinc-700 dark:text-zinc-300">
</footer>
<script>
  const target = document.getElementById("live-now");
  const tick = () => {
    if (target) {
      target.textContent = new Date().toISOString();
    }
  };
  tick();
  setInterval(tick, 1000);
</script>`;

  return baseLayout({
    canonicalPath: "/",
    content,
    description: "Strict RFC3339 API with live examples and timezone-aware conversions.",
    title: "rfc3339.date | Strict Time API",
  });
}

export function renderImprint(): string {
  const content = `
<section class="surface panel-in rounded-2xl p-6 md:p-8">
  <h1 class="text-balance text-3xl font-semibold">Imprint</h1>
  <div class="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
    <p>rfc3339.date</p>
    <p>Uwe Schwarz</p>
    <p>Uhlandstr. 20</p>
    <p>67069 Ludwigshafen</p>
    <p>Germany</p>
    <p>Email: contact@rfc3339.date</p>
  </div>
  <p class="mt-4 text-sm text-zinc-700 dark:text-zinc-300">This service is provided for development and testing use. No user tracking and no authentication.</p>
</section>
<nav class="mt-6 flex flex-wrap gap-3 text-sm" aria-label="Secondary">
  <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/">Back to landing page</a>
  <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/docs">Live API docs</a>
</nav>`;

  return baseLayout({
    canonicalPath: "/imprint",
    content,
    description: "Imprint and contact details for rfc3339.date.",
    title: "rfc3339.date | Imprint",
  });
}

export function renderDocs(nowIso: string): string {
  const content = `
<header class="surface panel-in rounded-2xl p-6 md:p-8">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="text-balance text-3xl font-semibold">Live API Calls</h1>
      <p class="text-pretty mt-2 max-w-3xl text-zinc-700 dark:text-zinc-300">Each request and response updates every second using the same ticking timestamp as Live now.</p>
    </div>
    <div class="flex items-center gap-2">
      <button id="toggle-freeze" class="surface rounded-md px-3 py-2 text-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}">Stop time</button>
      <span class="rounded-lg border border-accent-500/40 bg-accent-500/15 px-3 py-2 text-sm font-medium text-accent-700 dark:text-accent-500" aria-live="polite" aria-atomic="true">Live now: <span id="live-now" class="tabular-nums">${nowIso}</span></span>
    </div>
  </div>
  <nav class="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Docs links">
    <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/">Main page</a>
    <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/openapi.yaml">OpenAPI YAML</a>
    <a class="surface rounded-md px-3 py-2 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 ${focusRing}" href="/imprint">Imprint</a>
  </nav>
</header>
<section class="mt-6 grid gap-4">
  <article class="surface panel-in rounded-2xl p-5" data-card="now" style="animation-delay: 35ms">
    <h2 class="text-lg font-semibold">GET /now?fixed=…</h2>
    <pre id="req-now" class="mt-3 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-100 md:text-sm"></pre>
    <pre id="res-now" class="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 md:text-sm"></pre>
  </article>
  <article class="surface panel-in rounded-2xl p-5" data-card="validate" style="animation-delay: 65ms">
    <h2 class="text-lg font-semibold">GET /validate</h2>
    <pre id="req-validate" class="mt-3 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-100 md:text-sm"></pre>
    <pre id="res-validate" class="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 md:text-sm"></pre>
  </article>
  <article class="surface panel-in rounded-2xl p-5" data-card="convert" style="animation-delay: 95ms">
    <h2 class="text-lg font-semibold">GET /convert</h2>
    <pre id="req-convert" class="mt-3 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-100 md:text-sm"></pre>
    <pre id="res-convert" class="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 md:text-sm"></pre>
  </article>
  <article class="surface panel-in rounded-2xl p-5" data-card="zone" style="animation-delay: 125ms">
    <h2 class="text-lg font-semibold">GET /now/Europe%2FBerlin?fixed=…</h2>
    <pre id="req-zone" class="mt-3 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-100 md:text-sm"></pre>
    <pre id="res-zone" class="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 md:text-sm"></pre>
  </article>
</section>
<script>
  const nowEl = document.getElementById("live-now");
  const button = document.getElementById("toggle-freeze");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const requestEls = {
    now: document.getElementById("req-now"),
    validate: document.getElementById("req-validate"),
    convert: document.getElementById("req-convert"),
    zone: document.getElementById("req-zone"),
  };
  const responseEls = {
    now: document.getElementById("res-now"),
    validate: document.getElementById("res-validate"),
    convert: document.getElementById("res-convert"),
    zone: document.getElementById("res-zone"),
  };

  let frozen = false;
  let frozenNow = null;

  const apiCalls = (iso) => {
    const encoded = encodeURIComponent(iso);
    return {
      now: '/now?fixed=' + encoded + '&json=1',
      validate: '/validate?value=' + encoded + '&profile=rfc3339&mode=strict&json=1',
      convert: '/convert?value=' + encoded + '&in=rfc3339&out=unixms&json=1',
      zone: '/now/Europe%2FBerlin?fixed=' + encoded + '&json=1',
    };
  };

  const bump = (el) => {
    if (!el || reducedMotion) return;
    el.classList.remove("pulse-hit");
    void el.offsetWidth;
    el.classList.add("pulse-hit");
  };

  const renderResponse = (el, status, payload) => {
    if (!el) return;
    const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    el.textContent = 'HTTP ' + status + '\\n' + text;
    bump(el);
  };

  const currentIso = () => (frozen ? frozenNow : new Date()).toISOString();

  const update = async () => {
    const iso = currentIso();
    if (nowEl) {
      nowEl.textContent = iso;
    }

    const calls = apiCalls(iso);
    for (const key of Object.keys(calls)) {
      const endpoint = calls[key];
      if (requestEls[key]) {
        requestEls[key].textContent = 'curl "' + location.origin + endpoint + '"';
      }

      if (document.hidden) {
        continue;
      }

      try {
        const response = await fetch(endpoint, { headers: { accept: "application/json" } });
        const body = await response.json();
        renderResponse(responseEls[key], response.status, body);
      } catch (error) {
        renderResponse(responseEls[key], 500, { error: "fetch_failed", detail: String(error) });
      }
    }
  };

  button?.addEventListener("click", () => {
    frozen = !frozen;
    frozenNow = frozen ? new Date() : null;
    button.textContent = frozen ? "Resume time" : "Stop time";
    update();
  });

  update();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      update();
    }
  });
  setInterval(() => {
    if (!frozen) {
      update();
    }
  }, 1000);
</script>`;

  return baseLayout({
    canonicalPath: "/docs",
    content,
    description: "Live RFC3339 API examples with ticking requests and real responses.",
    title: "rfc3339.date | Live API Docs",
  });
}
