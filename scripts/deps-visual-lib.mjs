export const DEFAULT_VIEWPORT = { width: 1440, height: 2200 };
export const DEFAULT_SAMPLES = 2;
export const DEFAULT_SETTLE_MS = 250;
export const DEFAULT_SAMPLE_DELAY_MS = 200;
export const DEFAULT_TIMEOUT_MS = 30_000;
export const MIN_ALLOWED_PIXEL_RATIO = 0.00002;
export const MIN_ALLOWED_PIXELS = 100;
export const NOISE_MULTIPLIER = 3;

export const STATIC_TARGETS = [{ id: "home", label: "Home", url: "/" }];

const FIXED_NOW_UTC = "2026-02-26T12:34:56.789Z";
const FIXED_NOW_BERLIN = "2026-02-26T13:34:56.789+01:00";

function wantsJson(url) {
  return url.searchParams.get("json") === "1";
}

function json(body) {
  return JSON.stringify(body, null, 2);
}

function response(body, contentType) {
  return {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": `${contentType}; charset=utf-8`,
    },
    body,
  };
}

function stableTzConvert(url) {
  const value = url.searchParams.get("value") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const from = url.searchParams.get("from");
  const base = url.searchParams.get("base");

  if (value === "tomorrow 10am PST" && to === "Europe/Berlin") {
    const body = {
      value_in: value,
      value_out: "2026-05-22T19:00:00+02:00",
      from: { raw: "PST", kind: "abbreviation", tz: null, offset: "-08:00", abbreviation: "PST" },
      to: {
        raw: to,
        kind: "iana",
        tz: to,
        offset: "+02:00",
        abbreviation: "CEST",
        dst: true,
      },
      source: {
        local: "2026-05-22T10:00:00-08:00",
        date: "2026-05-22",
        time: "10:00:00",
        date_source: "relative",
        base: "2026-05-21T12:00:00Z",
      },
      target: {
        local: "2026-05-22T19:00:00+02:00",
        date: "2026-05-22",
        time: "19:00:00",
      },
      instant: {
        rfc3339z: "2026-05-22T17:00:00Z",
        unix: 1_779_469_200,
        unixms: 1_779_469_200_000,
      },
      notes: ["Resolved 'tomorrow' against a fixed visual-regression base instant."],
    };
    return wantsJson(url)
      ? response(json(body), "application/json")
      : response(body.value_out, "text/plain");
  }

  if (
    value === "5pm STD" &&
    to === "Europe/Berlin" &&
    from === "Europe/Berlin" &&
    base === "2026-01-15T12:00:00Z"
  ) {
    const body = {
      value_in: value,
      value_out: "2026-01-15T17:00:00+01:00",
      from: { raw: from, kind: "iana", tz: from, offset: "+01:00", abbreviation: "CET" },
      to: {
        raw: to,
        kind: "iana",
        tz: to,
        offset: "+01:00",
        abbreviation: "CET",
        dst: false,
      },
      source: {
        local: "2026-01-15T17:00:00+01:00",
        date: "2026-01-15",
        time: "17:00:00",
        date_source: "base",
        base,
      },
      target: {
        local: "2026-01-15T17:00:00+01:00",
        date: "2026-01-15",
        time: "17:00:00",
      },
      instant: {
        rfc3339z: "2026-01-15T16:00:00Z",
        unix: 1_768_493_600,
        unixms: 1_768_493_600_000,
      },
      notes: ["Resolved STD against the provided winter base date."],
    };
    return wantsJson(url)
      ? response(json(body), "application/json")
      : response(body.value_out, "text/plain");
  }

  const fallback = {
    value_in: value,
    value_out: "2026-01-01T00:00:00Z",
    from: { raw: from, kind: from ? "iana" : "unknown", tz: from ?? null, offset: null },
    to: { raw: to, kind: to ? "iana" : "unknown", tz: to || null, offset: "Z" },
    source: { local: "2026-01-01T00:00:00Z", date: "2026-01-01", time: "00:00:00", base },
    target: { local: "2026-01-01T00:00:00Z", date: "2026-01-01", time: "00:00:00" },
    instant: { rfc3339z: "2026-01-01T00:00:00Z", unix: 1_767_225_600, unixms: 1_767_225_600_000 },
    notes: ["Fallback visual-regression response."],
  };
  return wantsJson(url)
    ? response(json(fallback), "application/json")
    : response(fallback.value_out, "text/plain");
}

function stableNow(url) {
  const tz = decodeURIComponent(url.pathname.slice("/now/".length));
  const payload =
    tz === "Europe/Berlin"
      ? {
          now: FIXED_NOW_BERLIN,
          tz,
          offset: "+01:00",
          precision: 3,
          unix: 1_772_111_696,
          unixms: 1_772_111_696_789,
        }
      : {
          now: FIXED_NOW_UTC,
          tz,
          offset: "Z",
          precision: 3,
          unix: 1_772_111_696,
          unixms: 1_772_111_696_789,
        };

  return wantsJson(url)
    ? response(json(payload), "application/json")
    : response(payload.now, "text/plain");
}

function stableConvert(url) {
  const value = url.searchParams.get("value") ?? "";
  const input = url.searchParams.get("in") ?? "auto";
  const output = url.searchParams.get("out") ?? "rfc3339";

  const payload = {
    in: input,
    out: output,
    value_in: value,
    value_out: "2023-11-14T22:13:20Z",
    tz: null,
    precision: 0,
    instant: {
      rfc3339z: "2023-11-14T22:13:20Z",
      unix: 1_700_000_000,
      unixms: 1_700_000_000_000,
    },
    notes: [],
  };

  return wantsJson(url)
    ? response(json(payload), "application/json")
    : response(payload.value_out, "text/plain");
}

export function buildStableMockResponse(rawUrl) {
  const url = rawUrl instanceof URL ? rawUrl : new URL(String(rawUrl));

  if (url.pathname === "/tz/convert") {
    return stableTzConvert(url);
  }

  if (url.pathname.startsWith("/now/")) {
    return stableNow(url);
  }

  if (url.pathname === "/convert") {
    return stableConvert(url);
  }

  return null;
}

export function computeAllowedPixels({ totalPixels, noisePixels }) {
  const minimumPixels = Math.max(
    MIN_ALLOWED_PIXELS,
    Math.ceil(totalPixels * MIN_ALLOWED_PIXEL_RATIO),
  );

  return Math.max(minimumPixels, Math.ceil(noisePixels * NOISE_MULTIPLIER));
}
