import type { Context, Hono } from "hono";
import type { ValidationMode, ValidationProfile } from "../types";
import { parseInputToInstant, toOutput } from "../lib/convert";
import { formatRfc3339Utc } from "../lib/date";
import { errorResponse, getPrecision, textOrJson } from "../lib/http";
import { ensureIanaZone } from "../lib/zone";
import { validateValue } from "../lib/validation";

function resolvedNowMs(c: Context): number {
  const fixed = c.req.query("fixed") ?? c.req.header("x-fixed-time");
  if (!fixed) return Date.now();
  const parsed = parseInputToInstant(fixed, "rfc3339", "latest");
  return "instant" in parsed ? parsed.instant.unixMs : Date.now();
}

export function registerTimeRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/now", (c) => {
    const unixMs = resolvedNowMs(c);
    const precision = getPrecision(c.req.query("precision"), c.req.query("format"));
    const now = formatRfc3339Utc({ unixMs, nsRemainder: 0 }, precision);
    return textOrJson(
      c,
      { now, tz: "UTC", offset: "Z", precision, unix: Math.trunc(unixMs / 1000), unixms: unixMs },
      now,
      200,
      { "cache-control": "no-store" },
    );
  });

  app.get("/now/:tz", (c) => {
    const tz = decodeURIComponent(c.req.param("tz"));
    if (!ensureIanaZone(tz))
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${tz}'.`);
    const unixMs = resolvedNowMs(c);
    const precision = getPrecision(c.req.query("precision"), c.req.query("format"));
    const now = toOutput({ unixMs, nsRemainder: 0 }, "rfc3339", tz, precision);
    const offset = now.endsWith("Z") ? "Z" : now.slice(-6);
    return textOrJson(
      c,
      { now, tz, offset, precision, unix: Math.trunc(unixMs / 1000), unixms: unixMs },
      now,
      200,
      { "cache-control": "no-store" },
    );
  });

  app.get("/validate", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");
    const profile = (c.req.query("profile") ?? "rfc3339") as ValidationProfile;
    const mode = (c.req.query("mode") ?? "strict") as ValidationMode;
    const validProfiles: ValidationProfile[] = [
      "rfc3339",
      "iso8601",
      "iso8601:strict",
      "iso8601:extended",
      "iso8601:basic",
    ];
    const validModes: ValidationMode[] = ["strict", "lenient"];
    if (!validProfiles.includes(profile))
      return errorResponse(c, 400, "invalid_profile", "Invalid profile.");
    if (!validModes.includes(mode)) return errorResponse(c, 400, "invalid_mode", "Invalid mode.");
    const result = validateValue(value, profile, mode);
    const text = result.valid
      ? "VALID"
      : `INVALID: ${result.errors[0]?.message ?? "validation failed"}`;
    return textOrJson(c, result, text, 200, { "cache-control": "no-store" });
  });

  app.post("/validate", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      profile?: ValidationProfile;
      mode?: ValidationMode;
      items?: Array<{ value: string; profile?: ValidationProfile; mode?: ValidationMode }>;
    } | null;
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse(
        c,
        400,
        "invalid_body",
        "Body must be JSON with non-empty `items` array.",
      );
    }
    const results = body.items.map((item) =>
      validateValue(
        item.value,
        item.profile ?? body.profile ?? "rfc3339",
        item.mode ?? body.mode ?? "strict",
      ),
    );
    return c.json({ results }, 200, {
      "cache-control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
  });
}
