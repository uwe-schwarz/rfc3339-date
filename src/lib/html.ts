import { renderLandingBody, renderLandingHead } from "./landing-page";
import { SCALAR_REGISTRY_URL, SITE_URL } from "./page-constants";

export { SCALAR_REGISTRY_URL };

type MetadataOptions = {
  description: string;
  path: string;
  type?: "website" | "article";
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderMetadataHead(title: string, options: MetadataOptions): string {
  const canonicalUrl = `${SITE_URL}${options.path}`;
  const imageUrl = `${SITE_URL}/fav.png`;
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(options.description);
  const escapedCanonicalUrl = escapeHtml(canonicalUrl);
  const escapedImageUrl = escapeHtml(imageUrl);

  return `
    <meta name="description" content="${escapedDescription}" />
    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <meta name="theme-color" content="#000000" />
    <meta property="og:site_name" content="rfc3339.date" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="${options.type ?? "website"}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="760" />
    <meta property="og:image:height" content="760" />
    <meta property="og:image:alt" content="rfc3339.date clock emblem" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta name="twitter:image:alt" content="rfc3339.date clock emblem" />`;
}

function baseLayout(
  content: string,
  title: string,
  options: { metadata: MetadataOptions; head?: string; mainClassName?: string },
): string {
  const head = options?.head ?? "";
  const mainClassName =
    options?.mainClassName ?? "mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    ${renderMetadataHead(title, options.metadata)}
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="stylesheet" href="/styles.css" />
    ${head}
  </head>
  <body class="page-shell terminal-grid min-h-screen antialiased">
    <main class="${mainClassName}">${content}</main>
  </body>
</html>`;
}

export function renderLanding(nowIso: string): string {
  return baseLayout(renderLandingBody(nowIso), "rfc3339.date", {
    metadata: {
      description:
        "Strict RFC3339 time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing.",
      path: "/",
    },
    head: renderLandingHead(),
  });
}

export function renderLandingMarkdown(nowIso: string): string {
  return `# rfc3339.date

Strict RFC3339 time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing.

Current example time: \`${nowIso}\`

## API discovery

- Base URL: ${SITE_URL}
- OpenAPI YAML: ${SITE_URL}/openapi.yaml
- OpenAPI JSON: ${SITE_URL}/openapi.json
- Scalar Registry: ${SCALAR_REGISTRY_URL}

## Example endpoints

- \`GET /now\` returns the current instant as RFC3339 UTC.
- \`GET /now/{tz}\` renders the current instant in an IANA timezone.
- \`GET /validate\` checks timestamps against RFC3339 and related profiles.
- \`GET /convert\` converts between RFC3339, Unix, HTTP-date, emaildate, GPS, TAI, Excel, and more.
- \`GET /tz/convert\` turns human event-time text into a concrete timezone-aware instant.

## Notes

- This is a fun project, not a reliable source of correct date or time.
- No authentication, no tracking, and plain text responses are first-class.`;
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
    metadata: {
      description:
        "Imprint and project contact details for rfc3339.date, including the GitHub profile and Scalar registry link.",
      path: "/imprint",
    },
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
          target.innerHTML = '<p class="mb-4 text-base text-lime-100">' + data.countText + '</p><div class="gh-calendar-shell">' + data.calendarHtml + "</div>";
        } catch {
          target.innerHTML = '<p class="text-lime-400">GitHub stats are temporarily unavailable. <a class="text-lime-300 hover:underline" href="https://github.com/uwe-schwarz">View the profile directly</a>.</p>';
        }
      });
    </script>`,
  });
}

export function renderImprintMarkdown(): string {
  return `# rfc3339.date imprint

- Owner: Uwe Schwarz, Uhlandstr. 20, 67069 Ludwigshafen, Germany
- Email: mail@uweschwarz.eu
- GitHub: https://github.com/uwe-schwarz
- Scalar Registry: ${SCALAR_REGISTRY_URL}

This service is provided for development and testing use. No user tracking and no authentication.`;
}
