import type { Hono } from "hono";
import { LEAP_SECONDS, LEAP_SECONDS_SOURCE, LEAP_SECONDS_VERSION } from "../lib/constants";
import { errorResponse } from "../lib/http";

export function registerDatasetRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/leapseconds", (c) => {
    const version = c.req.query("version") ?? "latest";
    if (version !== "latest")
      return errorResponse(
        c,
        404,
        "version_not_found",
        `Leap second dataset version '${version}' is not available.`,
      );

    return c.json(
      {
        version: LEAP_SECONDS_VERSION,
        taiMinusUtc: LEAP_SECONDS[LEAP_SECONDS.length - 1]?.taiMinusUtc ?? 37,
        source: LEAP_SECONDS_SOURCE,
        entries: LEAP_SECONDS,
      },
      200,
      { "cache-control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" },
    );
  });
}
