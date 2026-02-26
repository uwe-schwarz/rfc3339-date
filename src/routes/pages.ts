import type { Hono } from "hono";
import { OPENAPI_YAML } from "../lib/constants";
import { formatRfc3339Utc } from "../lib/date";
import {
  GEIST_MONO_REGULAR_WOFF2_BASE64,
  GEIST_PIXEL_LINE_WOFF2_BASE64,
  GEIST_PIXEL_SQUARE_WOFF2_BASE64,
} from "../lib/fonts.generated";
import { addCommonHeaders } from "../lib/http";
import { renderDocs, renderImprint, renderLanding } from "../lib/html";
import { TAILWIND_CSS } from "../lib/tailwind.generated";

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

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
