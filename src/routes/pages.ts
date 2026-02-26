import type { Hono } from "hono";
import { OPENAPI_YAML } from "../lib/constants";
import { formatRfc3339Utc } from "../lib/date";
import { addCommonHeaders } from "../lib/http";
import { renderDocs, renderImprint, renderLanding } from "../lib/html";
import { TAILWIND_CSS } from "../lib/tailwind.generated";

export function registerPageRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/", () => {
    const now = formatRfc3339Utc({ unixMs: Date.now(), nsRemainder: 0 }, 3);
    return new Response(renderLanding(now), {
      headers: addCommonHeaders({
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      }),
    });
  });

  app.get("/docs", () => {
    const now = formatRfc3339Utc({ unixMs: Date.now(), nsRemainder: 0 }, 3);
    return new Response(renderDocs(now), {
      headers: addCommonHeaders({
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      }),
    });
  });

  app.get("/imprint", () => {
    return new Response(renderImprint(), {
      headers: addCommonHeaders({
        "content-type": "text/html; charset=utf-8",
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

  app.get("/styles.css", () => {
    return new Response(TAILWIND_CSS, {
      headers: addCommonHeaders({
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=86400",
      }),
    });
  });
}
