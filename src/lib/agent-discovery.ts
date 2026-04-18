import { PUBLIC_PAGE_PATHS, SCALAR_REGISTRY_URL, SITE_URL } from "./page-constants";

const AI_CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=no";
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

export function shouldReturnMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/markdown");
}

export function estimateMarkdownTokens(markdown: string): number {
  const words = markdown.match(/\S+/g);
  return words?.length ?? 0;
}
