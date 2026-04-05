import type { Hono } from "hono";
import { parseInputToInstant, toOutput } from "../lib/convert";
import { formatRfc3339Utc, pad2 } from "../lib/date";
import { errorResponse, textOrJson } from "../lib/http";
import { parseHumanTime } from "../lib/human-time";
import { ensureIanaZone, getZoneParts } from "../lib/zone";
import {
  parseDurationIso,
  durationToMs,
  formatIsoDurationFromMs,
  resolveLocalCandidates,
} from "../lib/devux";

function parseTimestamp(value: string) {
  const auto = parseInputToInstant(value, "auto", "latest");
  if ("instant" in auto) return auto;
  if (auto.error === "ambiguous_input") return parseInputToInstant(value, "rfc3339", "latest");
  return auto;
}

export function registerDevUxRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/parse", (c) => {
    const q = c.req.query("q");
    if (!q) return errorResponse(c, 400, "missing_q", "Query parameter `q` is required.");

    const tz = c.req.query("tz") ?? "UTC";
    if (tz !== "UTC" && !ensureIanaZone(tz)) {
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${tz}'.`);
    }

    const direct = parseTimestamp(q);
    if ("instant" in direct) {
      const local =
        tz === "UTC"
          ? formatRfc3339Utc(direct.instant, 0)
          : toOutput(direct.instant, "rfc3339", tz, 0);
      const payload = {
        input: q,
        timezone: tz,
        instant: formatRfc3339Utc(direct.instant, 0),
        local,
        confidence: 1,
        notes: [],
      };
      return textOrJson(c, payload, payload.local, 200, { "cache-control": "no-store" });
    }

    const parsed = parseHumanTime(q, {
      from: tz,
      baseInstant: { unixMs: Date.now(), nsRemainder: 0 },
    });
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);

    const payload = {
      input: q,
      timezone: tz,
      instant: formatRfc3339Utc(parsed.instant, 0),
      local:
        tz === "UTC"
          ? formatRfc3339Utc(parsed.instant, 0)
          : toOutput(parsed.instant, "rfc3339", tz, 0),
      confidence: parsed.source.dateSource === "explicit" ? 0.96 : 0.9,
      notes: parsed.notes,
    };
    return textOrJson(c, payload, payload.local, 200, { "cache-control": "no-store" });
  });

  app.get("/format", (c) => {
    const value = c.req.query("value");
    if (!value)
      return errorResponse(c, 400, "missing_value", "Query parameter `value` is required.");
    const style = c.req.query("style") ?? "iso";
    const parsed = parseTimestamp(value);
    if (!("instant" in parsed)) return errorResponse(c, 400, parsed.error, parsed.message);

    const d = new Date(parsed.instant.unixMs);
    const cron = `${d.getUTCMinutes()} ${d.getUTCHours()} ${d.getUTCDate()} ${d.getUTCMonth() + 1} *`;
    const outputs = {
      iso: formatRfc3339Utc(parsed.instant, 3),
      http: toOutput(parsed.instant, "httpdate", null, 0),
      cron,
      fileSafe: `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}_${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`,
    };

    if (!(style in outputs))
      return errorResponse(c, 400, "invalid_style", "style must be iso, http, cron, or fileSafe.");
    const out = outputs[style as keyof typeof outputs];
    return textOrJson(c, { input: value, style, output: out, outputs }, out, 200, {
      "cache-control": "no-store",
    });
  });

  app.get("/diff", (c) => {
    const from = c.req.query("from");
    const to = c.req.query("to");
    if (!from || !to)
      return errorResponse(c, 400, "missing_range", "`from` and `to` are required.");
    const unit = c.req.query("unit") ?? "ms";
    const fromParsed = parseTimestamp(from);
    const toParsed = parseTimestamp(to);
    if (!("instant" in fromParsed) || !("instant" in toParsed)) {
      return errorResponse(
        c,
        400,
        "invalid_input",
        "`from` and `to` must be parseable timestamps.",
      );
    }
    const deltaMs = toParsed.instant.unixMs - fromParsed.instant.unixMs;
    const scalar = {
      ms: deltaMs,
      s: deltaMs / 1000,
      min: deltaMs / 60_000,
      h: deltaMs / 3_600_000,
      d: deltaMs / 86_400_000,
      iso: formatIsoDurationFromMs(deltaMs),
    }[unit];
    if (scalar === undefined)
      return errorResponse(c, 400, "invalid_unit", "unit must be ms, s, min, h, d, or iso.");
    const payload = { from, to, unit, value: scalar, isoDuration: formatIsoDurationFromMs(deltaMs) };
    return textOrJson(c, payload, String(payload.value), 200, { "cache-control": "no-store" });
  });

  app.get("/add", (c) => {
    const ts = c.req.query("ts");
    const durationRaw = c.req.query("duration");
    if (!ts || !durationRaw)
      return errorResponse(c, 400, "missing_args", "`ts` and `duration` are required.");
    const mode = c.req.query("mode") ?? "absolute";
    const tz = c.req.query("tz") ?? "UTC";
    const duration = parseDurationIso(durationRaw);
    if (!duration)
      return errorResponse(
        c,
        400,
        "invalid_duration",
        "duration must be ISO-8601, for example P3D or PT1H.",
      );

    const base = parseTimestamp(ts);
    if (!("instant" in base)) return errorResponse(c, 400, "invalid_ts", "Could not parse `ts`.");

    if (mode !== "absolute" && mode !== "wall") {
      return errorResponse(c, 400, "invalid_mode", "mode must be `absolute` or `wall`.");
    }

    if (mode === "absolute") {
      const instant = { unixMs: base.instant.unixMs + durationToMs(duration), nsRemainder: 0 };
      const payload = {
        mode,
        input: ts,
        duration: durationRaw,
        result: formatRfc3339Utc(instant, 0),
        local: tz === "UTC" ? formatRfc3339Utc(instant, 0) : toOutput(instant, "rfc3339", tz, 0),
      };
      return textOrJson(c, payload, payload.local, 200, { "cache-control": "no-store" });
    }

    if (!ensureIanaZone(tz)) {
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${tz}'.`);
    }

    const local = getZoneParts(base.instant, tz);
    const localShifted = new Date(
      Date.UTC(
        local.year + duration.years,
        local.month - 1 + duration.months,
        local.day + duration.days,
        local.hour + duration.hours,
        local.minute + duration.minutes,
        local.second + duration.seconds,
        duration.milliseconds,
      ),
    );

    const candidates = resolveLocalCandidates(
      {
        year: localShifted.getUTCFullYear(),
        month: localShifted.getUTCMonth() + 1,
        day: localShifted.getUTCDate(),
        hour: localShifted.getUTCHours(),
        minute: localShifted.getUTCMinutes(),
        second: localShifted.getUTCSeconds(),
      },
      tz,
    );

    if (candidates.length === 0) {
      return errorResponse(
        c,
        400,
        "invalid_local_time",
        "Wall-clock result is a nonexistent local time (DST gap).",
      );
    }

    const chosen = candidates[0];
    const payload = {
      mode,
      input: ts,
      duration: durationRaw,
      tz,
      result: formatRfc3339Utc(chosen, 0),
      local: toOutput(chosen, "rfc3339", tz, 0),
      ambiguity: candidates.length > 1 ? "ambiguous_local_time" : null,
      candidates: candidates.map((instant) => formatRfc3339Utc(instant, 0)),
    };
    return textOrJson(c, payload, payload.local, 200, { "cache-control": "no-store" });
  });
}
