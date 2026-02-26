import type { Encoding, Instant } from "../types";
import {
  DAY_MS,
  EXCEL_1900_BASE_MS,
  EXCEL_1904_BASE_MS,
  GPS_EPOCH_MS,
  LEAP_SECONDS_PARSED,
  NTP_UNIX_OFFSET_SECONDS,
} from "./constants";
import { dayOfYear, formatRfc3339Utc, isoWeek, pad2 } from "./date";
import { formatRfc3339InZone } from "./zone";
import { parseIsoBasic, parseOrdinal, parseRfc3339, parseWeekDate } from "./validation";

export function taiMinusUtcAt(unixMs: number): number {
  let current = 10;
  for (const entry of LEAP_SECONDS_PARSED) {
    if (unixMs >= entry.effectiveMs) current = entry.taiMinusUtc;
    else break;
  }
  return current;
}

function parseAs(
  value: string,
  enc: Exclude<Encoding, "auto">,
): { ok: true; instant: Instant } | { ok: false } {
  switch (enc) {
    case "rfc3339": {
      const p = parseRfc3339(value, true);
      return p.ok ? { ok: true, instant: p.instant } : { ok: false };
    }
    case "iso8601": {
      const ext = parseRfc3339(value, true);
      if (ext.ok) return { ok: true, instant: ext.instant };
      const basic = parseIsoBasic(value);
      return basic.ok ? { ok: true, instant: basic.instant } : { ok: false };
    }
    case "unix": {
      const n = Number(value);
      return Number.isFinite(n)
        ? { ok: true, instant: { unixMs: Math.trunc(n * 1000), nsRemainder: 0 } }
        : { ok: false };
    }
    case "unixms": {
      const n = Number(value);
      return Number.isFinite(n)
        ? { ok: true, instant: { unixMs: Math.trunc(n), nsRemainder: 0 } }
        : { ok: false };
    }
    case "ntp": {
      const hex = value.match(/^0x([a-fA-F0-9]{1,8}):0x([a-fA-F0-9]{1,8})$/);
      if (hex) {
        const sec = Number.parseInt(hex[1], 16);
        const frac = Number.parseInt(hex[2], 16);
        const unixSec = sec - NTP_UNIX_OFFSET_SECONDS;
        return {
          ok: true,
          instant: { unixMs: unixSec * 1000 + Math.floor((frac / 2 ** 32) * 1000), nsRemainder: 0 },
        };
      }
      const dec = value.match(/^(\d+)\.(\d+)$/);
      if (!dec) return { ok: false };
      const sec = Number(dec[1]);
      const frac = Number(`0.${dec[2]}`);
      return Number.isFinite(sec) && Number.isFinite(frac)
        ? {
            ok: true,
            instant: {
              unixMs: Math.trunc((sec - NTP_UNIX_OFFSET_SECONDS + frac) * 1000),
              nsRemainder: 0,
            },
          }
        : { ok: false };
    }
    case "httpdate":
    case "emaildate": {
      const ms = Date.parse(value);
      return Number.isNaN(ms)
        ? { ok: false }
        : { ok: true, instant: { unixMs: ms, nsRemainder: 0 } };
    }
    case "gps": {
      const gps = Number(value);
      if (!Number.isFinite(gps)) return { ok: false };
      let utcMs = GPS_EPOCH_MS + gps * 1000;
      for (let i = 0; i < 4; i++) utcMs = GPS_EPOCH_MS + (gps - (taiMinusUtcAt(utcMs) - 19)) * 1000;
      return { ok: true, instant: { unixMs: Math.trunc(utcMs), nsRemainder: 0 } };
    }
    case "tai": {
      const tai = Number(value);
      if (!Number.isFinite(tai)) return { ok: false };
      let utcMs = tai * 1000;
      for (let i = 0; i < 4; i++) utcMs = tai * 1000 - taiMinusUtcAt(utcMs) * 1000;
      return { ok: true, instant: { unixMs: Math.trunc(utcMs), nsRemainder: 0 } };
    }
    case "jd": {
      const jd = Number(value);
      return Number.isFinite(jd)
        ? { ok: true, instant: { unixMs: Math.trunc((jd - 2_440_587.5) * DAY_MS), nsRemainder: 0 } }
        : { ok: false };
    }
    case "mjd": {
      const mjd = Number(value);
      return Number.isFinite(mjd)
        ? { ok: true, instant: { unixMs: Math.trunc((mjd - 40_587) * DAY_MS), nsRemainder: 0 } }
        : { ok: false };
    }
    case "excel1900": {
      const serial = Number(value);
      if (!Number.isFinite(serial)) return { ok: false };
      const whole = Math.trunc(serial);
      const frac = serial - whole;
      if (whole === 60)
        return {
          ok: true,
          instant: {
            unixMs: Math.trunc(Date.UTC(1900, 1, 28) + frac * DAY_MS),
            nsRemainder: 0,
            excel1900LeapBug: true,
          },
        };
      const adjusted = whole > 60 ? whole - 1 : whole;
      return {
        ok: true,
        instant: {
          unixMs: Math.trunc(EXCEL_1900_BASE_MS + adjusted * DAY_MS + frac * DAY_MS),
          nsRemainder: 0,
        },
      };
    }
    case "excel1904": {
      const serial = Number(value);
      return Number.isFinite(serial)
        ? {
            ok: true,
            instant: { unixMs: Math.trunc(EXCEL_1904_BASE_MS + serial * DAY_MS), nsRemainder: 0 },
          }
        : { ok: false };
    }
    case "weekdate": {
      const parsed = parseWeekDate(value);
      return parsed.ok ? { ok: true, instant: parsed.instant } : { ok: false };
    }
    case "ordinal":
    case "doy": {
      const parsed = parseOrdinal(value);
      return parsed.ok ? { ok: true, instant: parsed.instant } : { ok: false };
    }
  }
}

export function parseInputToInstant(value: string, encoding: Encoding, leapdata = "latest") {
  if (leapdata !== "latest")
    return {
      error: "unsupported_leapdata",
      message: `Unsupported leapdata version '${leapdata}'. Use 'latest'.`,
    };
  if (encoding !== "auto") {
    const parsed = parseAs(value, encoding);
    if (!parsed.ok)
      return { error: "invalid_input", message: `Failed to parse value as '${encoding}'.` };
    return {
      instant: parsed.instant,
      resolvedIn: encoding as Exclude<Encoding, "auto">,
      notes: [] as string[],
    };
  }

  const all: Exclude<Encoding, "auto">[] = [
    "rfc3339",
    "iso8601",
    "unix",
    "unixms",
    "ntp",
    "httpdate",
    "emaildate",
    "gps",
    "tai",
    "jd",
    "mjd",
    "excel1900",
    "excel1904",
    "weekdate",
    "ordinal",
    "doy",
  ];
  const candidates = all.filter((enc) => parseAs(value, enc).ok);
  if (candidates.length === 0)
    return { error: "invalid_input", message: "Could not infer input encoding from value." };
  if (candidates.length > 1)
    return {
      error: "ambiguous_input",
      message: "Input encoding is ambiguous. Provide explicit `in`.",
      candidates,
    };
  return {
    instant: parseAs(value, candidates[0]).ok
      ? (parseAs(value, candidates[0]) as { ok: true; instant: Instant }).instant
      : { unixMs: 0, nsRemainder: 0 },
    resolvedIn: candidates[0],
    notes: [] as string[],
    candidates,
  };
}

export function toOutput(
  instant: Instant,
  output: Exclude<Encoding, "auto">,
  tz: string | null,
  precision: number,
): string {
  switch (output) {
    case "rfc3339":
      if (tz && tz !== "UTC") return formatRfc3339InZone(instant, tz, precision);
      if (instant.excel1900LeapBug) return "1900-02-29T00:00:00Z";
      return formatRfc3339Utc(instant, precision);
    case "iso8601":
      return formatRfc3339Utc(instant, precision);
    case "unix":
      return String(Math.trunc(instant.unixMs / 1000));
    case "unixms":
      return String(Math.trunc(instant.unixMs));
    case "ntp": {
      const unixSec = instant.unixMs / 1000;
      const ntpSec = Math.floor(unixSec + NTP_UNIX_OFFSET_SECONDS);
      const frac = Math.floor(((unixSec + NTP_UNIX_OFFSET_SECONDS) % 1) * 2 ** 32);
      return `0x${ntpSec.toString(16).toUpperCase().padStart(8, "0")}:0x${frac.toString(16).toUpperCase().padStart(8, "0")}`;
    }
    case "httpdate":
      return new Date(instant.unixMs).toUTCString();
    case "emaildate":
      return new Date(instant.unixMs).toUTCString().replace("GMT", "+0000");
    case "gps":
      return String(
        Math.trunc((instant.unixMs - GPS_EPOCH_MS) / 1000 + (taiMinusUtcAt(instant.unixMs) - 19)),
      );
    case "tai":
      return String(Math.trunc(instant.unixMs / 1000 + taiMinusUtcAt(instant.unixMs)));
    case "jd":
      return String(instant.unixMs / DAY_MS + 2_440_587.5);
    case "mjd":
      return String(instant.unixMs / DAY_MS + 40_587);
    case "excel1900": {
      if (instant.excel1900LeapBug) return "60";
      const serial = (instant.unixMs - EXCEL_1900_BASE_MS) / DAY_MS;
      const day = Math.floor(serial);
      return String((day >= 60 ? day + 1 : day) + (serial - day));
    }
    case "excel1904":
      return String((instant.unixMs - EXCEL_1904_BASE_MS) / DAY_MS);
    case "weekdate": {
      const w = isoWeek(new Date(instant.unixMs));
      return `${w.year}-W${pad2(w.week)}-${w.day}`;
    }
    case "ordinal":
    case "doy": {
      const d = new Date(instant.unixMs);
      return `${d.getUTCFullYear()}-${String(dayOfYear(d)).padStart(3, "0")}`;
    }
  }
}
