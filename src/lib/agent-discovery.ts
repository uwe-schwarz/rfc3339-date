import { PUBLIC_PAGE_PATHS, SCALAR_REGISTRY_URL, SITE_URL } from "./page-constants";

const AI_CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=no";
const API_CATALOG_PROFILE_URL = "https://www.rfc-editor.org/info/rfc9727";
const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "Claude-Web",
  "Google-Extended",
  "Amazonbot",
  "anthropic-ai",
  "Bytespider",
  "CCBot",
  "Applebot-Extended",
] as const;

type LinkDescriptor = {
  href: string;
  rel: string;
  type: string;
};

const DISCOVERY_LINKS: readonly LinkDescriptor[] = [
  {
    href: "/openapi.json",
    rel: "service-desc",
    type: "application/json",
  },
  {
    href: "/openapi.yaml",
    rel: "describedby",
    type: "application/yaml",
  },
  {
    href: SCALAR_REGISTRY_URL,
    rel: "service-doc",
    type: "text/html",
  },
];

function renderRobotsBlock(userAgent: string): string {
  return [
    `User-agent: ${userAgent}`,
    "Allow: /",
    "Disallow: /github/",
    `Content-Signal: ${AI_CONTENT_SIGNAL}`,
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildAgentDiscoveryLinkHeader(): string {
  return DISCOVERY_LINKS.map(
    ({ href, rel, type }) => `<${href}>; rel="${rel}"; type="${type}"`,
  ).join(", ");
}

export function getApiCatalogContentType(): string {
  return `application/linkset+json; profile="${API_CATALOG_PROFILE_URL}"`;
}

export function buildApiCatalog() {
  return {
    linkset: [
      {
        anchor: SITE_URL,
        "service-desc": [{ href: `${SITE_URL}/openapi.json`, type: "application/json" }],
        "service-doc": [{ href: `${SITE_URL}/`, type: "text/html" }],
        status: [{ href: `${SITE_URL}/health`, type: "application/json" }],
      },
    ],
  };
}

export function buildRobotsTxt(): string {
  return [
    "# rfc3339.date crawl policy",
    renderRobotsBlock("*"),
    ...AI_USER_AGENTS.map((userAgent) => `\n${renderRobotsBlock(userAgent)}`),
    `\nSitemap: ${SITE_URL}/sitemap.xml`,
  ].join("\n");
}

export function buildSitemapXml(): string {
  const urls = PUBLIC_PAGE_PATHS.map((path) => {
    const location = escapeXml(`${SITE_URL}${path}`);
    return `  <url><loc>${location}</loc></url>`;
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");
}

type MediaTypePreference = {
  q: number;
  specificity: number;
};

function parseQValue(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.min(parsed, 1);
}

function getMediaTypePreference(accept: string, target: string): MediaTypePreference | null {
  const [targetType, targetSubtype] = target.split("/", 2);
  let best: MediaTypePreference | null = null;

  for (const rawEntry of accept.split(",")) {
    const entry = rawEntry.trim();
    if (!entry) continue;

    const [mediaRange, ...rawParams] = entry.split(";");
    const [type = "", subtype = ""] = mediaRange.trim().toLowerCase().split("/", 2);
    if (!type || !subtype) continue;

    let specificity = -1;
    if (type === targetType && subtype === targetSubtype) {
      specificity = 2;
    } else if (type === targetType && subtype === "*") {
      specificity = 1;
    } else if (type === "*" && subtype === "*") {
      specificity = 0;
    }

    if (specificity < 0) continue;

    const qParam = rawParams.find((param) => param.trim().toLowerCase().startsWith("q="));
    const q = qParam ? parseQValue(qParam.split("=", 2)[1] ?? "") : 1;
    const candidate = { q, specificity };

    if (
      !best ||
      candidate.specificity > best.specificity ||
      (candidate.specificity === best.specificity && candidate.q > best.q)
    ) {
      best = candidate;
    }
  }

  return best;
}

export function shouldReturnMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  if (!accept) {
    return false;
  }

  const markdownPreference = getMediaTypePreference(accept.toLowerCase(), "text/markdown");
  if (!markdownPreference || markdownPreference.q <= 0) {
    return false;
  }

  const htmlPreference = getMediaTypePreference(accept.toLowerCase(), "text/html");
  if (!htmlPreference || htmlPreference.q <= 0) {
    return true;
  }

  if (markdownPreference.q !== htmlPreference.q) {
    return markdownPreference.q > htmlPreference.q;
  }

  if (markdownPreference.specificity !== htmlPreference.specificity) {
    return markdownPreference.specificity > htmlPreference.specificity;
  }

  return false;
}

export function estimateMarkdownTokens(markdown: string): number {
  const words = markdown.match(/\S+/g);
  return words?.length ?? 0;
}
