import type {
  Diagnostic,
  Instant,
  ParsedParts,
  ValidationMode,
  ValidationProfile,
  ValidationResult,
} from "../types";
import { daysInMonth, formatRfc3339Utc, isLeapYear, parseOffsetToMinutes } from "./date";

type ParseOk = { ok: true; instant: Instant; parts: ParsedParts; canonical: string };
type ParseErr = { ok: false; errors: Diagnostic[] };

export function parseRfc3339(value: string, allowLeapSecond: boolean): ParseOk | ParseErr {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) {
    return {
      ok: false,
      errors: [
        {
          code: "RFC3339_SYNTAX",
          message: "Expected RFC3339 format YYYY-MM-DDTHH:MM:SS(.fraction)?(Z|±HH:MM).",
        },
      ],
    };
  }

  const [_, y, mo, d, h, mi, s, fraction = "", offset] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(s);
  const errors: Diagnostic[] = [];

  if (month < 1 || month > 12)
    errors.push({ code: "MONTH_RANGE", message: "Month must be in 01..12." });
  if (day < 1 || day > daysInMonth(year, month))
    errors.push({ code: "DAY_RANGE", message: "Day is out of range for month/year." });
  if (hour < 0 || hour > 23)
    errors.push({ code: "HOUR_RANGE", message: "Hour must be in 00..23." });
  if (minute < 0 || minute > 59)
    errors.push({ code: "MINUTE_RANGE", message: "Minute must be in 00..59." });
  if (second < 0 || second > 60)
    errors.push({ code: "SECOND_RANGE", message: "Second must be in 00..60." });
  if (second === 60 && !allowLeapSecond)
    errors.push({
      code: "LEAP_SECOND_DISALLOWED",
      message: "Leap second (60) is not allowed for this profile.",
    });
  if (second === 60 && (hour !== 23 || minute !== 59))
    errors.push({
      code: "LEAP_SECOND_POSITION",
      message: "Leap second is only valid at 23:59:60.",
    });
  if (fraction.length > 9)
    errors.push({
      code: "FRACTION_RANGE",
      message: "Fractional seconds can have at most 9 digits.",
    });

  const offsetMatch = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (offset !== "Z" && offsetMatch) {
    const oh = Number(offsetMatch[2]);
    const om = Number(offsetMatch[3]);
    if (oh > 23 || om > 59)
      errors.push({ code: "OFFSET_RANGE", message: "Offset must be within ±23:59." });
  }

  if (errors.length > 0) return { ok: false, errors };

  const fractionPadded = fraction.padEnd(9, "0");
  const nsRemainder = Number(fractionPadded.slice(3));
  const msPart = Number(fractionPadded.slice(0, 3));
  const offsetMinutes = parseOffsetToMinutes(offset);
  const baseMs =
    Date.UTC(year, month - 1, day, hour, minute, Math.min(second, 59), msPart) -
    offsetMinutes * 60_000;
  const unixMs = second === 60 ? baseMs + 1_000 : baseMs;
  const instant: Instant = { unixMs, nsRemainder };

  return {
    ok: true,
    instant,
    parts: { year, month, day, hour, minute, second, fraction: fraction || undefined, offset },
    canonical: formatRfc3339Utc(instant, Math.max(0, Math.min(9, fraction.length || 0))),
  };
}

export function parseIsoBasic(value: string): ParseOk | ParseErr {
  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}(?::?\d{2})?)$/,
  );
  if (!match) {
    return {
      ok: false,
      errors: [
        {
          code: "ISO_BASIC_SYNTAX",
          message: "Expected basic ISO8601 format YYYYMMDDTHHMMSS(.fraction)?(Z|±HHMM).",
        },
      ],
    };
  }

  const [_, y, mo, d, h, mi, s, fraction = "", offsetRaw] = match;
  const normalizedOffset =
    offsetRaw === "Z"
      ? "Z"
      : offsetRaw.includes(":")
        ? offsetRaw
        : `${offsetRaw.slice(0, 3)}:${offsetRaw.slice(3, 5)}`;
  return parseRfc3339(
    `${y}-${mo}-${d}T${h}:${mi}:${s}${fraction ? `.${fraction}` : ""}${normalizedOffset}`,
    true,
  );
}

export function parseWeekDate(value: string): { ok: true; instant: Instant } | ParseErr {
  const match = value.match(/^(\d{4})-W(\d{2})-(\d)$/);
  if (!match)
    return {
      ok: false,
      errors: [{ code: "WEEKDATE_SYNTAX", message: "Expected week date format YYYY-Www-D." }],
    };
  const year = Number(match[1]);
  const week = Number(match[2]);
  const day = Number(match[3]);
  if (week < 1 || week > 53 || day < 1 || day > 7)
    return {
      ok: false,
      errors: [{ code: "WEEKDATE_RANGE", message: "Week must be 1..53 and weekday 1..7." }],
    };

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1MondayMs = jan4.getTime() - jan4Day * 86_400_000;
  return {
    ok: true,
    instant: {
      unixMs: week1MondayMs + (week - 1) * 7 * 86_400_000 + (day - 1) * 86_400_000,
      nsRemainder: 0,
    },
  };
}

export function parseOrdinal(value: string): { ok: true; instant: Instant } | ParseErr {
  const match = value.match(/^(\d{4})-(\d{3})$/);
  if (!match)
    return {
      ok: false,
      errors: [{ code: "ORDINAL_SYNTAX", message: "Expected ordinal format YYYY-DDD." }],
    };
  const year = Number(match[1]);
  const doy = Number(match[2]);
  const max = isLeapYear(year) ? 366 : 365;
  if (doy < 1 || doy > max)
    return {
      ok: false,
      errors: [{ code: "ORDINAL_RANGE", message: "Day-of-year is out of range." }],
    };
  return { ok: true, instant: { unixMs: Date.UTC(year, 0, doy), nsRemainder: 0 } };
}

export function validateValue(
  value: string,
  profile: ValidationProfile,
  mode: ValidationMode,
): ValidationResult {
  const warnings: Diagnostic[] = [];
  if (profile === "rfc3339") {
    const parsed = parseRfc3339(value, mode === "lenient");
    if ("errors" in parsed)
      return { valid: false, profile, mode, canonical: null, errors: parsed.errors, warnings };
    return {
      valid: true,
      profile,
      mode,
      canonical: parsed.canonical,
      parsed: parsed.parts,
      errors: [],
      warnings,
    };
  }

  if (profile === "iso8601:basic") {
    const basic = parseIsoBasic(value);
    if ("errors" in basic)
      return { valid: false, profile, mode, canonical: null, errors: basic.errors, warnings };
    return {
      valid: true,
      profile,
      mode,
      canonical: basic.canonical,
      parsed: basic.parts,
      errors: [],
      warnings,
    };
  }

  if (profile === "iso8601:extended") {
    const ext = parseRfc3339(value, true);
    if ("errors" in ext)
      return { valid: false, profile, mode, canonical: null, errors: ext.errors, warnings };
    return {
      valid: true,
      profile,
      mode,
      canonical: ext.canonical,
      parsed: ext.parts,
      errors: [],
      warnings,
    };
  }

  if (profile === "iso8601:strict") {
    const ext = parseRfc3339(value, true);
    const basic = parseIsoBasic(value);
    if ("errors" in ext && "errors" in basic)
      return {
        valid: false,
        profile,
        mode,
        canonical: null,
        errors: [
          {
            code: "ISO8601_STRICT",
            message: "Expected strict ISO8601 basic or extended timestamp with timezone.",
          },
        ],
        warnings,
      };
    const chosen = "errors" in ext ? (basic as ParseOk) : (ext as ParseOk);
    return {
      valid: true,
      profile,
      mode,
      canonical: chosen.canonical,
      parsed: chosen.parts,
      errors: [],
      warnings,
    };
  }

  const ext = parseRfc3339(value, true);
  const basic = parseIsoBasic(value);
  if (!("errors" in ext) || !("errors" in basic)) {
    const chosen = "errors" in ext ? (basic as ParseOk) : (ext as ParseOk);
    return {
      valid: true,
      profile,
      mode,
      canonical: chosen.canonical,
      parsed: chosen.parts,
      errors: [],
      warnings,
    };
  }

  if (mode === "lenient") {
    const ms = Date.parse(value);
    if (!Number.isNaN(ms)) {
      warnings.push({
        code: "LENIENT_PARSE",
        message: "Value is parseable but not strict ISO8601 profile compliant.",
      });
      return {
        valid: true,
        profile,
        mode,
        canonical: formatRfc3339Utc({ unixMs: ms, nsRemainder: 0 }, 3),
        errors: [],
        warnings,
      };
    }
  }

  return {
    valid: false,
    profile,
    mode,
    canonical: null,
    errors: [
      { code: "ISO8601_INVALID", message: "Value is not valid for selected ISO8601 profile." },
    ],
    warnings,
  };
}
