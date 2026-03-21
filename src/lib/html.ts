export const SCALAR_REGISTRY_URL =
  "https://registry.scalar.com/@iq42/apis/rfc3339date-time-api@latest";

export function baseLayout(
  content: string,
  title: string,
  options?: { head?: string; mainClassName?: string },
): string {
  const head = options?.head ?? "";
  const mainClassName =
    options?.mainClassName ?? "mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
    ${head}
  </head>
  <body class="page-shell terminal-grid min-h-screen antialiased">
    <main class="${mainClassName}">${content}</main>
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
  <p class="mt-3 max-w-3xl rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">
    This is a fun project, not a reliable source of correct date or time. It only reports this server's current clock and is not backed by any serious timekeeping hardware or authority.
  </p>
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
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/docs">Scalar Docs</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="${SCALAR_REGISTRY_URL}">Scalar Registry</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.yaml">OpenAPI YAML</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.json">OpenAPI JSON</a>
  <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="/openapi.scalar.json">Scalar-compatible JSON</a>
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
  <p>GitHub: <a class="text-lime-300 hover:underline" href="https://github.com/uwe-schwarz">github.com/uwe-schwarz</a></p>
  <p>Scalar Registry: <a class="text-lime-300 hover:underline" href="${SCALAR_REGISTRY_URL}">${SCALAR_REGISTRY_URL}</a></p>
  <p>This service is provided for development and testing use. No user tracking and no authentication.</p>
</div>
<section class="surface-card fx-enter fx-delay-2 mt-6 rounded-xl border border-lime-500/35 bg-zinc-950/40 p-6 text-sm text-lime-200">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="text-lg text-lime-100">GitHub Profile</h2>
      <p class="mt-1 text-lime-300">Public activity snapshot from GitHub for <a class="text-lime-300 hover:underline" href="https://github.com/uwe-schwarz">uwe-schwarz</a>.</p>
    </div>
    <a class="fx-hover-lift rounded-md border border-lime-500/35 px-3 py-2 text-lime-300 hover:border-lime-400 hover:text-lime-200" href="https://github.com/uwe-schwarz">Open GitHub Profile</a>
  </div>
  <div id="github-profile" class="rounded-lg border border-lime-500/25 bg-black/20 p-4">
    <p class="text-lime-400">Loading GitHub contribution stats…</p>
  </div>
</section>
<p class="fx-enter fx-delay-2 mt-6 text-sm"><a class="text-lime-300 hover:underline" href="/">Back to landing page</a></p>`;
  return baseLayout(content, "rfc3339.date imprint", {
    head: `<style>
      .gh-calendar-shell { overflow-x: auto; }
      .gh-calendar-shell table { border-collapse: separate; border-spacing: 4px; width: max-content; }
      .gh-calendar-shell td { min-width: 11px; height: 11px; border-radius: 2px; }
      .gh-calendar-shell td[aria-hidden="true"] { min-width: auto; height: auto; }
      .gh-calendar-shell .ContributionCalendar-label { color: rgb(163 230 53 / 0.8); font-size: 0.7rem; white-space: nowrap; }
      .gh-calendar-shell .ContributionCalendar-day[data-level="0"] { background: rgba(132, 204, 22, 0.12); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="1"] { background: rgba(132, 204, 22, 0.35); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="2"] { background: rgba(132, 204, 22, 0.55); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="3"] { background: rgba(163, 230, 53, 0.75); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="4"] { background: rgba(217, 249, 157, 0.95); }
      .gh-calendar-shell .sr-only { display: none; }
    </style>
    <script>
      addEventListener("DOMContentLoaded", async () => {
        const target = document.getElementById("github-profile");
        if (!target) return;

        try {
          const response = await fetch("/github/uwe-schwarz/contributions");
          const data = await response.json();
          if (!data.countText || !data.calendarHtml) {
            target.innerHTML = '<p class="text-lime-400">GitHub stats are temporarily unavailable. <a class="text-lime-300 hover:underline" href="' + data.profileUrl + '">View the profile directly</a>.</p>';
            return;
          }

          target.innerHTML =
            '<p class="mb-4 text-base text-lime-100">' +
            data.countText +
            '</p>' +
            '<div class="gh-calendar-shell">' +
            data.calendarHtml +
            '</div>';
        } catch {
          target.innerHTML = '<p class="text-lime-400">GitHub stats are temporarily unavailable. <a class="text-lime-300 hover:underline" href="https://github.com/uwe-schwarz">View the profile directly</a>.</p>';
        }
      });
    </script>`,
  });
}
