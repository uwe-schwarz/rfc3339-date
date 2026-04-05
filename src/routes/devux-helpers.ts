import type { Hono } from "hono";
import { parseInputToInstant, toOutput } from "../lib/convert";
import { formatRfc3339Utc, isoWeek, pad2 } from "../lib/date";
import { errorResponse, textOrJson } from "../lib/http";
import { validateValue } from "../lib/validation";
import { ensureIanaZone } from "../lib/zone";
import {
  mondayOfIsoWeek,
  parseLocalClock,
  resolveLocalCandidates,
  WINDOWS_TZ_MAP,
} from "../lib/devux";

function parseTimestamp(value: string) {
  const auto = parseInputToInstant(value, "auto", "latest");
  if ("instant" in auto) return auto;
  if (auto.error === "ambiguous_input") return parseInputToInstant(value, "rfc3339", "latest");
  return auto;
}

export function registerDevUxHelperRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/excel/serial-to-iso", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");
    const system = c.req.query("system") === "1904" ? "excel1904" : "excel1900";
    const parsed = parseInputToInstant(value, system, "latest");
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);
    const payload = { value, system, iso: formatRfc3339Utc(parsed.instant, 3) };
    return textOrJson(c, payload, payload.iso, 200, { "cache-control": "no-store" });
  });

  app.get("/excel/iso-to-serial", (c) => {
    const ts = c.req.query("ts");
    if (!ts) return errorResponse(c, 400, "missing_ts", "Query parameter `ts` is required.");
    const system = c.req.query("system") === "1904" ? "excel1904" : "excel1900";
    const parsed = parseInputToInstant(ts, "rfc3339", "latest");
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);
    const payload = { ts, system, serial: toOutput(parsed.instant, system, null, 0) };
    return textOrJson(c, payload, payload.serial, 200, { "cache-control": "no-store" });
  });

  app.get("/iso-week", (c) => {
    const ts = c.req.query("ts");
    if (!ts) return errorResponse(c, 400, "missing_ts", "Query parameter `ts` is required.");
    const parsed = parseTimestamp(ts);
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);
    const info = isoWeek(new Date(parsed.instant.unixMs));
    const payload = {
      yearWeek: `${info.year}-W${pad2(info.week)}`,
      year: info.year,
      week: info.week,
      weekday: info.day,
    };
    return textOrJson(c, payload, payload.yearWeek, 200, { "cache-control": "no-store" });
  });

  app.get("/iso-week/start-end", (c) => {
    const year = Number(c.req.query("year"));
    const week = Number(c.req.query("week"));
    if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) {
      return errorResponse(c, 400, "invalid_week", "`year` and `week` must be valid integers.");
    }
    const monday = mondayOfIsoWeek(year, week);
    const sunday = new Date(monday.getTime() + 6 * 86_400_000);
    return c.json({
      yearWeek: `${year}-W${pad2(week)}`,
      start: `${monday.toISOString().slice(0, 10)}T00:00:00Z`,
      end: `${sunday.toISOString().slice(0, 10)}T23:59:59Z`,
    });
  });

  app.get("/http-date", (c) => {
    const ts = c.req.query("ts");
    if (!ts) return errorResponse(c, 400, "missing_ts", "Query parameter `ts` is required.");
    const parsed = parseTimestamp(ts);
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);
    return textOrJson(
      c,
      { ts, httpDate: toOutput(parsed.instant, "httpdate", null, 0) },
      toOutput(parsed.instant, "httpdate", null, 0),
    );
  });

  app.get("/lint/iso", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");

    const parsed = parseTimestamp(value);
    if (!("instant" in parsed)) {
      const result = validateValue(value, "iso8601", "lenient");
      const payload = {
        valid: false,
        normalized: null,
        reasons: result.errors.map((error) => error.message),
      };
      return textOrJson(
        c,
        payload,
        `INVALID: ${payload.reasons[0] ?? "validation failed"}`,
        200,
        { "cache-control": "no-store" },
      );
    }

    const payload = {
      valid: true,
      normalized: formatRfc3339Utc(parsed.instant, 0),
      reasons: [],
    };
    return textOrJson(c, payload, payload.normalized, 200, { "cache-control": "no-store" });
  });

  app.get("/validate-local", (c) => {
    const local = c.req.query("local");
    const tz = c.req.query("tz");
    if (!local || !tz)
      return errorResponse(c, 400, "missing_args", "`local` and `tz` are required.");
    if (!ensureIanaZone(tz))
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${tz}'.`);
    const parsed = parseLocalClock(local);
    if (!parsed) {
      return errorResponse(c, 400, "invalid_local", "`local` must be YYYY-MM-DDTHH:mm[:ss].");
    }
    const candidates = resolveLocalCandidates(parsed, tz);
    const status = candidates.length === 0 ? "invalid" : candidates.length > 1 ? "ambiguous" : "ok";
    return c.json({
      local,
      tz,
      status,
      candidates: candidates.map((instant) => ({
        instant: formatRfc3339Utc(instant, 0),
        local: toOutput(instant, "rfc3339", tz, 0),
      })),
    });
  });

  app.get("/tz/resolve", (c) => {
    const name = c.req.query("name");
    if (!name) return errorResponse(c, 400, "missing_name", "Query parameter `name` is required.");
    const key = name.trim().toLowerCase();
    const resolved = WINDOWS_TZ_MAP[key] ?? (ensureIanaZone(name) ? name : null);
    if (!resolved) {
      return errorResponse(c, 404, "zone_not_found", `Could not resolve timezone alias '${name}'.`);
    }
    const payload = {
      input: name,
      resolved,
      source: WINDOWS_TZ_MAP[key] ? "windows-alias" : "iana",
    };
    return textOrJson(c, payload, payload.resolved, 200, { "cache-control": "no-store" });
  });
}
