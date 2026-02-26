import type { Hono } from "hono";
import { formatOffset, formatRfc3339Utc } from "../lib/date";
import { errorResponse, textOrJson } from "../lib/http";
import { ensureIanaZone, getZoneParts } from "../lib/zone";
import { parseInputToInstant } from "../lib/convert";

function findTransitionBoundary(
  zone: string,
  startMs: number,
  endMs: number,
  refine: "s" | "ms",
): number {
  const resolution = refine === "ms" ? 1 : 1_000;
  let lo = startMs;
  let hi = endMs;
  const before = getZoneParts({ unixMs: lo, nsRemainder: 0 }, zone).offsetMinutes;
  while (hi - lo > resolution) {
    const mid = Math.floor((lo + hi) / 2);
    if (getZoneParts({ unixMs: mid, nsRemainder: 0 }, zone).offsetMinutes === before) lo = mid;
    else hi = mid;
  }
  return hi;
}

export function registerTimezoneRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/tz", (c) => {
    const q = (c.req.query("q") ?? "").toLowerCase();
    const limit = Math.min(500, Math.max(1, Number(c.req.query("limit") ?? "50")));
    const all = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf?.("timeZone") ?? ["UTC", "Europe/Berlin", "America/New_York"];
    const zones = all
      .filter((z) => z.toLowerCase().includes(q))
      .slice(0, limit)
      .map((id) => ({
        id,
        exampleCity: id.includes("/") ? (id.split("/").at(-1)?.replaceAll("_", " ") ?? null) : null,
      }));
    return c.json({ zones }, 200, {
      "cache-control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
  });

  app.get("/tz/:zone/offset", (c) => {
    const zone = decodeURIComponent(c.req.param("zone"));
    if (!ensureIanaZone(zone))
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${zone}'.`);
    const at = c.req.query("at");
    const parsed = at ? parseInputToInstant(at, "rfc3339", "latest") : null;
    if (at && !(parsed && "instant" in parsed))
      return errorResponse(c, 400, "invalid_at", "Query parameter `at` must be RFC3339.");

    const instant =
      parsed && "instant" in parsed ? parsed.instant : { unixMs: Date.now(), nsRemainder: 0 };
    const current = getZoneParts(instant, zone);
    const year = new Date(instant.unixMs).getUTCFullYear();
    const jan = getZoneParts({ unixMs: Date.UTC(year, 0, 1), nsRemainder: 0 }, zone).offsetMinutes;
    const jul = getZoneParts({ unixMs: Date.UTC(year, 6, 1), nsRemainder: 0 }, zone).offsetMinutes;
    const dst = current.offsetMinutes !== Math.min(jan, jul);

    const payload = {
      zone,
      at: formatRfc3339Utc(instant, 3),
      offset: formatOffset(current.offsetMinutes),
      dst,
      abbreviation: current.abbreviation,
    };
    return textOrJson(c, payload, `${payload.offset} ${payload.dst ? "DST" : "STD"}`, 200, {
      "cache-control": "no-store",
    });
  });

  app.get("/tz/:zone/transitions", (c) => {
    const zone = decodeURIComponent(c.req.param("zone"));
    if (!ensureIanaZone(zone))
      return errorResponse(c, 404, "zone_not_found", `Unknown IANA time zone '${zone}'.`);

    const start = c.req.query("start");
    const end = c.req.query("end");
    if (!start || !end)
      return errorResponse(
        c,
        400,
        "missing_range",
        "`start` and `end` query parameters are required.",
      );

    const startParsed = parseInputToInstant(start, "rfc3339", "latest");
    const endParsed = parseInputToInstant(end, "rfc3339", "latest");
    if (!("instant" in startParsed) || !("instant" in endParsed))
      return errorResponse(c, 400, "invalid_range", "`start` and `end` must be RFC3339.");

    const startMs = startParsed.instant.unixMs;
    const endMs = endParsed.instant.unixMs;
    if (endMs <= startMs)
      return errorResponse(c, 400, "invalid_range", "`end` must be greater than `start`.");

    const granularity = (c.req.query("granularity") ?? "hour") as "day" | "hour" | "minute";
    const refine = (c.req.query("refine") ?? "s") as "s" | "ms";
    const step = ({ day: 86_400_000, hour: 3_600_000, minute: 60_000 } as Record<string, number>)[
      granularity
    ];
    if (!step)
      return errorResponse(
        c,
        400,
        "invalid_granularity",
        "granularity must be day, hour, or minute.",
      );
    if (!["s", "ms"].includes(refine))
      return errorResponse(c, 400, "invalid_refine", "refine must be s or ms.");

    const transitions: Array<{ at: string; offsetBefore: string; offsetAfter: string }> = [];
    let cursor = startMs;
    let before = getZoneParts({ unixMs: cursor, nsRemainder: 0 }, zone).offsetMinutes;

    while (cursor < endMs) {
      const next = Math.min(endMs, cursor + step);
      const after = getZoneParts({ unixMs: next, nsRemainder: 0 }, zone).offsetMinutes;
      if (after !== before) {
        const boundary = findTransitionBoundary(zone, cursor, next, refine);
        transitions.push({
          at: formatRfc3339Utc({ unixMs: boundary, nsRemainder: 0 }, refine === "ms" ? 3 : 0),
          offsetBefore: formatOffset(
            getZoneParts({ unixMs: Math.max(startMs, boundary - 1000), nsRemainder: 0 }, zone)
              .offsetMinutes,
          ),
          offsetAfter: formatOffset(
            getZoneParts({ unixMs: boundary, nsRemainder: 0 }, zone).offsetMinutes,
          ),
        });
        before = after;
      }
      cursor = next;
    }

    return c.json({ zone, start, end, transitions }, 200, {
      "cache-control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
  });
}
