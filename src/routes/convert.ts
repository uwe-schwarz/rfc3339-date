import type { Hono } from "hono";
import type { ConversionResult, Encoding, ValidationProfile } from "../types";
import { parseInputToInstant, toOutput } from "../lib/convert";
import { formatRfc3339Utc } from "../lib/date";
import { errorResponse, getPrecision, textOrJson } from "../lib/http";
import { ensureIanaZone } from "../lib/zone";
import { validateValue } from "../lib/validation";

export function registerConvertRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/canonical", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");

    const profile = (c.req.query("profile") ?? "rfc3339") as ValidationProfile;
    const out = (c.req.query("out") ?? "rfc3339") as Exclude<Encoding, "auto">;
    const precision = getPrecision(c.req.query("precision"), c.req.query("format"));
    const tz = c.req.query("tz") ?? null;
    if (tz && !ensureIanaZone(tz))
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${tz}'.`);

    const checked = validateValue(value, profile, "strict");
    if (!checked.valid || !checked.canonical)
      return errorResponse(
        c,
        400,
        "invalid_value",
        "Could not canonicalize input.",
        checked.errors,
      );

    const parsed = parseInputToInstant(checked.canonical, "rfc3339", "latest");
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);

    const valueOut = toOutput(parsed.instant, out, tz, precision);
    const payload: ConversionResult = {
      in: "rfc3339",
      out,
      value_in: value,
      value_out: valueOut,
      tz,
      precision,
      instant: {
        rfc3339z: formatRfc3339Utc(parsed.instant, precision),
        unix: Math.trunc(parsed.instant.unixMs / 1000),
        unixms: parsed.instant.unixMs,
      },
      notes: [],
    };
    return textOrJson(c, payload, valueOut, 200, { "cache-control": "no-store" });
  });

  app.get("/convert", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");

    const input = (c.req.query("in") ?? "auto") as Encoding;
    const out = (c.req.query("out") ?? "rfc3339") as Exclude<Encoding, "auto">;
    const precision = getPrecision(c.req.query("precision"), c.req.query("format"));
    const tz = c.req.query("tz") ?? null;
    if (tz && !ensureIanaZone(tz))
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${tz}'.`);

    const parsed = parseInputToInstant(value, input, c.req.query("leapdata") ?? "latest");
    if (!("instant" in parsed)) {
      return c.json(
        {
          error: parsed.error,
          message: parsed.message,
          candidates: "candidates" in parsed ? (parsed.candidates ?? []) : [],
        },
        400,
        {
          "cache-control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      );
    }

    const valueOut = toOutput(parsed.instant, out, tz, precision);
    const payload: ConversionResult = {
      in: parsed.resolvedIn,
      out,
      value_in: value,
      value_out: valueOut,
      tz,
      precision,
      instant: {
        rfc3339z: formatRfc3339Utc(parsed.instant, precision),
        unix: Math.trunc(parsed.instant.unixMs / 1000),
        unixms: parsed.instant.unixMs,
      },
      notes: parsed.notes,
      candidates: "candidates" in parsed ? parsed.candidates : undefined,
    };

    return textOrJson(c, payload, valueOut, 200, { "cache-control": "no-store" });
  });

  app.get("/round", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");
    const input = (c.req.query("in") ?? "auto") as Encoding;
    const out = (c.req.query("out") ?? "rfc3339") as Exclude<Encoding, "auto">;
    const mode = c.req.query("mode") ?? "nearest";
    const unit = c.req.query("unit") ?? "ms";
    const precision = getPrecision(c.req.query("precision"), c.req.query("format"));
    const tz = c.req.query("tz") ?? null;

    const parsed = parseInputToInstant(value, input, "latest");
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);

    const step = (
      { ns: 1, us: 1, ms: 1, s: 1_000, min: 60_000, hour: 3_600_000, day: 86_400_000 } as Record<
        string,
        number
      >
    )[unit];
    if (!step) return errorResponse(c, 400, "invalid_unit", "Invalid unit.");

    const ratio = parsed.instant.unixMs / step;
    const rounded =
      mode === "floor" ? Math.floor(ratio) : mode === "ceil" ? Math.ceil(ratio) : Math.round(ratio);
    const instant = { unixMs: rounded * step, nsRemainder: 0 };
    const valueOut = toOutput(instant, out, tz, precision);

    const payload: ConversionResult = {
      in: parsed.resolvedIn,
      out,
      value_in: value,
      value_out: valueOut,
      tz,
      precision,
      instant: {
        rfc3339z: formatRfc3339Utc(instant, precision),
        unix: Math.trunc(instant.unixMs / 1000),
        unixms: instant.unixMs,
      },
      notes: [`Rounded using mode=${mode} and unit=${unit}.`],
    };
    return textOrJson(c, payload, valueOut, 200, { "cache-control": "no-store" });
  });
}
