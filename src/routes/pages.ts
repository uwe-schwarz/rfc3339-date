import type { Hono } from "hono";
import { formatRfc3339Utc } from "../lib/date";
import {
  GEIST_MONO_REGULAR_WOFF2_BASE64,
  GEIST_PIXEL_LINE_WOFF2_BASE64,
  GEIST_PIXEL_SQUARE_WOFF2_BASE64,
} from "../lib/fonts.generated";
import { addCommonHeaders } from "../lib/http";
import {
  buildApiCatalog,
  buildAgentDiscoveryLinkHeader,
  buildRobotsTxt,
  buildSitemapXml,
  estimateMarkdownTokens,
  getApiCatalogContentType,
  shouldReturnMarkdown,
} from "../lib/agent-discovery";
import {
  buildAgentSkillsIndex,
  buildSiteSkillMarkdown,
  getSiteSkillPath,
} from "../lib/agent-skills";
import {
  renderImprint,
  renderImprintMarkdown,
  renderLanding,
  renderLandingMarkdown,
} from "../lib/html";
import { OPENAPI_JSON, OPENAPI_SCALAR_COMPAT_JSON, OPENAPI_YAML } from "../lib/openapi.generated";
import { TAILWIND_CSS } from "../lib/tailwind.generated";

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSafeContributionCalendar(tableHtml: string): string | null {
  const rows = [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(([, rowHtml]) => {
      const cells = [...rowHtml.matchAll(/<td\b([^>]*)>/g)]
        .map(([, attrs]) => {
          const level = attrs.match(/\bdata-level="([0-4])"/)?.[1];
          if (level) {
            return `<td class="ContributionCalendar-day" data-level="${level}"></td>`;
          }
          return "";
        })
        .filter(Boolean)
        .join("");

      return cells ? `<tr>${cells}</tr>` : "";
    })
    .filter(Boolean);

  return rows.length > 0 ? `<table><tbody>${rows.join("")}</tbody></table>` : null;
}

function extractGitHubContributionData(html: string) {
  const headingMatch = html.match(
    /<h2[^>]*id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/,
  );
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/);
  const countText = headingMatch ? stripTags(headingMatch[1]) : null;
  if (!countText || !tableMatch) {
    return null;
  }

  const calendarHtml = buildSafeContributionCalendar(tableMatch[0]);
  if (!calendarHtml) {
    return null;
  }

  return { countText, calendarHtml };
}

const PAGE_LINK_HEADER = buildAgentDiscoveryLinkHeader();
const API_CATALOG_BODY = JSON.stringify(buildApiCatalog());
const AGENT_SKILLS_INDEX_BODY = JSON.stringify(buildAgentSkillsIndex());
const SITE_SKILL_PATH = getSiteSkillPath();
const SITE_SKILL_BODY = buildSiteSkillMarkdown();

function respondPage(
  request: Request,
  html: string,
  markdown: string,
  cacheControl: string,
): Response {
  const wantsMarkdown = shouldReturnMarkdown(request);
  const body = wantsMarkdown ? markdown : html;
  const headers = addCommonHeaders({
    "cache-control": cacheControl,
    "content-type": wantsMarkdown ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
    link: PAGE_LINK_HEADER,
    vary: "Accept",
  });

  if (wantsMarkdown) {
    headers.set("x-markdown-tokens", String(estimateMarkdownTokens(markdown)));
  }

  return new Response(body, { headers });
}

export function registerPageRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/", (c) => {
    const now = formatRfc3339Utc({ unixMs: Date.now(), nsRemainder: 0 }, 3);
    return respondPage(c.req.raw, renderLanding(now), renderLandingMarkdown(now), "public, max-age=60");
  });

  app.get("/imprint", (c) => {
    return respondPage(
      c.req.raw,
      renderImprint(),
      renderImprintMarkdown(),
      "public, max-age=3600",
    );
  });

  app.get("/robots.txt", () => {
    return new Response(buildRobotsTxt(), {
      headers: addCommonHeaders({
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/sitemap.xml", () => {
    return new Response(buildSitemapXml(), {
      headers: addCommonHeaders({
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/github/uwe-schwarz/contributions", async () => {
    try {
      const response = await fetch("https://github.com/users/uwe-schwarz/contributions", {
        headers: {
          "user-agent": "rfc3339.date",
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub returned ${response.status}`);
      }

      const html = await response.text();
      const data = extractGitHubContributionData(html);
      if (!data) {
        throw new Error("Could not parse GitHub contributions markup");
      }

      return new Response(
        JSON.stringify({
          profileUrl: "https://github.com/uwe-schwarz",
          countText: data.countText,
          calendarHtml: data.calendarHtml,
        }),
        {
          headers: addCommonHeaders({
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=21600",
          }),
        },
      );
    } catch {
      return new Response(
        JSON.stringify({
          profileUrl: "https://github.com/uwe-schwarz",
          countText: null,
          calendarHtml: null,
        }),
        {
          headers: addCommonHeaders({
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
          }),
        },
      );
    }
  });

  app.get("/health", () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: addCommonHeaders({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      }),
    });
  });

  app.get("/.well-known/api-catalog", () => {
    return new Response(API_CATALOG_BODY, {
      headers: addCommonHeaders({
        "content-type": getApiCatalogContentType(),
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/.well-known/agent-skills/index.json", () => {
    return new Response(AGENT_SKILLS_INDEX_BODY, {
      headers: addCommonHeaders({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get(SITE_SKILL_PATH, () => {
    return new Response(SITE_SKILL_BODY, {
      headers: addCommonHeaders({
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/openapi.yaml", () => {
    return new Response(OPENAPI_YAML, {
      headers: addCommonHeaders({
        "content-type": "application/yaml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/openapi.json", () => {
    return new Response(OPENAPI_JSON, {
      headers: addCommonHeaders({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/openapi.scalar.json", () => {
    return new Response(OPENAPI_SCALAR_COMPAT_JSON, {
      headers: addCommonHeaders({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
      }),
    });
  });

  app.get("/styles.css", () => {
    return new Response(TAILWIND_CSS, {
      headers: addCommonHeaders({
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=86400",
      }),
    });
  });

  app.get("/fonts/geist-pixel-line.woff2", () => {
    return new Response(decodeBase64(GEIST_PIXEL_LINE_WOFF2_BASE64), {
      headers: addCommonHeaders({
        "content-type": "font/woff2",
        "cache-control": "public, max-age=31536000, immutable",
      }),
    });
  });

  app.get("/fonts/geist-pixel-square.woff2", () => {
    return new Response(decodeBase64(GEIST_PIXEL_SQUARE_WOFF2_BASE64), {
      headers: addCommonHeaders({
        "content-type": "font/woff2",
        "cache-control": "public, max-age=31536000, immutable",
      }),
    });
  });

  app.get("/fonts/geist-mono-regular.woff2", () => {
    return new Response(decodeBase64(GEIST_MONO_REGULAR_WOFF2_BASE64), {
      headers: addCommonHeaders({
        "content-type": "font/woff2",
        "cache-control": "public, max-age=31536000, immutable",
      }),
    });
  });
}
