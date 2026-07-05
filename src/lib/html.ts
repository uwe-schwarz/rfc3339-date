import { renderLandingBody, renderLandingHead } from "./landing-page";
import { themeScript } from "./landing-page-script";
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
    <meta property="og:image:width" content="660" />
    <meta property="og:image:height" content="660" />
    <meta property="og:image:alt" content="rfc3339.date icon" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta name="twitter:image:alt" content="rfc3339.date icon" />`;
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
  <body class="page-shell terminal-grid min-h-dvh antialiased">
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
<div class="neo-page">
  <header class="neo-hero fx-enter mb-8 p-4 md:p-6">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <a class="neo-label" href="/">← Back to main</a>
      <label class="neo-theme-toggle relative inline-flex items-center gap-1" aria-label="Toggle color theme">
        <span>Light</span>
        <input id="theme-toggle" data-theme-toggle="1" type="checkbox" />
        <span class="mode-track"><span class="mode-thumb"></span></span>
        <span>Dark</span>
      </label>
    </div>
    <div>
      <p class="neo-stamp mb-4">Legal + profile</p>
      <h1 class="neo-hero-title text-5xl font-black leading-none md:text-7xl">Imprint</h1>
      <p class="neo-muted mt-5 max-w-3xl text-base md:text-lg">
        Project contact details for <strong>rfc3339.date</strong>, the public GitHub profile, and the API registry entry.
      </p>
    </div>
  </header>
  <section class="neo-panel neo-shadow fx-enter fx-delay-1 p-4 md:p-6">
    <p class="neo-label mb-4">Contact</p>
    <address class="space-y-3 text-sm not-italic md:text-base">
      <p><strong>rfc3339.date</strong></p>
      <p>Owner: Uwe Schwarz, Uhlandstr. 20, 67069 Ludwigshafen, Germany</p>
      <p>Email: <a class="font-bold underline" href="mailto:mail@uweschwarz.eu">mail@uweschwarz.eu</a></p>
      <p>GitHub: <a class="font-bold underline" href="https://github.com/uwe-schwarz">github.com/uwe-schwarz</a></p>
      <p>Scalar Registry: <a class="break-all font-bold underline" href="${SCALAR_REGISTRY_URL}">${SCALAR_REGISTRY_URL}</a></p>
    </address>
    <p class="neo-warning mt-5 p-3 text-sm">This service is provided for development and testing use. No user tracking and no authentication.</p>
  </section>
  <section class="neo-panel neo-shadow fx-enter fx-delay-2 mt-8 p-4 md:p-6">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="neo-label">GitHub Profile</p>
        <h2 class="mt-2 text-2xl font-black md:text-3xl">uwe-schwarz</h2>
        <p class="neo-muted mt-2 max-w-2xl text-sm md:text-base">
          Public activity snapshot from GitHub for <a class="font-bold underline" href="https://github.com/uwe-schwarz">uwe-schwarz</a>.
        </p>
      </div>
      <a class="neo-copy-button inline-flex items-center" href="https://github.com/uwe-schwarz">Open GitHub Profile</a>
    </div>
    <div id="github-profile" class="neo-output-panel overflow-hidden p-4">
      <p class="neo-muted">Loading GitHub contribution stats...</p>
    </div>
  </section>
  <nav class="neo-footer-nav fx-enter fx-delay-3 mt-8 flex flex-wrap gap-3 text-sm">
    <a href="/">Back to landing page</a>
  </nav>
</div>`;
  return baseLayout(content, "rfc3339.date imprint", {
    metadata: {
      description:
        "Imprint and project contact details for rfc3339.date, including the GitHub profile and Scalar registry link.",
      path: "/imprint",
    },
    head: `${renderLandingHead()}
    <style>
      .gh-calendar-shell { overflow-x: auto; }
      .gh-calendar-shell table { border-collapse: separate; border-spacing: 4px; width: max-content; }
      .gh-calendar-shell td { min-width: 11px; height: 11px; border: 1px solid var(--neo-ink); border-radius: 0; }
      .gh-calendar-shell td[aria-hidden="true"] { min-width: auto; height: auto; }
      .gh-calendar-shell .ContributionCalendar-label { color: var(--neo-code); font-size: 0.7rem; white-space: nowrap; }
      .gh-calendar-shell .ContributionCalendar-day[data-level="0"] { background: #272735; }
      .gh-calendar-shell .ContributionCalendar-day[data-level="1"] { background: var(--neo-cyan); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="2"] { background: var(--neo-lime); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="3"] { background: var(--neo-coral); }
      .gh-calendar-shell .ContributionCalendar-day[data-level="4"] { background: var(--neo-violet); }
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
            target.innerHTML = '<p>GitHub stats are temporarily unavailable. <a class="font-bold underline" href="' + data.profileUrl + '">View the profile directly</a>.</p>';
            return;
          }
          target.innerHTML = '<p class="mb-4 text-base font-bold">' + data.countText + '</p><div class="gh-calendar-shell">' + data.calendarHtml + "</div>";
        } catch {
          target.innerHTML = '<p>GitHub stats are temporarily unavailable. <a class="font-bold underline" href="https://github.com/uwe-schwarz">View the profile directly</a>.</p>';
        }
      });
    </script>
    ${themeScript()}`,
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
