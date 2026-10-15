import type { Hono } from "hono";
import { formatRfc3339Utc } from "../lib/date.ts";
import { addCommonHeaders } from "../lib/http.ts";
import {
  buildApiCatalog,
  buildAgentDiscoveryLinkHeader,
  buildRobotsTxt,
  buildSitemapXml,
  estimateMarkdownTokens,
  getApiCatalogContentType,
  shouldReturnMarkdown,
} from "../lib/agent-discovery.ts";
import {
  buildAgentSkillsIndex,
  buildSiteSkillMarkdown,
  getSiteSkillPath,
} from "../lib/agent-skills.ts";
import { renderImprintMarkdown, renderLandingMarkdown } from "../lib/page-markdown.ts";

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

async function respondPage(
  request: Request,
  assets: Fetcher,
  assetPath: string,
  markdown: string,
  cacheControl: string,
): Promise<Response> {
  const wantsMarkdown = shouldReturnMarkdown(request);
  const headers = addCommonHeaders({
    "cache-control": cacheControl,
    "content-type": wantsMarkdown ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
    link: PAGE_LINK_HEADER,
    vary: "Accept",
  });

  if (wantsMarkdown) {
    headers.set("x-markdown-tokens", String(estimateMarkdownTokens(markdown)));
    return new Response(markdown, { headers });
  }

  const url = new URL(request.url);
  url.pathname = assetPath;
  url.search = "";
  // Fetch an unconditional representation: negotiation/cache headers belong to this route.
  const asset = await assets.fetch(new Request(url));
  if (!asset.ok) return asset;
  return new Response(asset.body, { headers });
}

export function registerPageRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/", (c) => {
    const now = formatRfc3339Utc({ unixMs: Date.now(), nsRemainder: 0 }, 3);
    return respondPage(
      c.req.raw,
      c.env.ASSETS,
      "/index.html",
      renderLandingMarkdown(now),
      "public, max-age=60",
    );
  });

  app.get("/imprint", (c) => {
    return respondPage(
      c.req.raw,
      c.env.ASSETS,
      "/imprint.html",
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
}
