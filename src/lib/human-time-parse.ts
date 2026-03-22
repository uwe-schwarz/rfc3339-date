import { daysInMonth } from "./date";
import type {
  ErrorResult,
  ParsedLocalInput,
  RelativeDateKeyword,
  SourceSpec,
  TimeParts,
} from "./human-time.types";

const FIXED_ZONE_ABBREVIATIONS: Record<string, { offsetMinutes: number; dst: boolean }> = {
  UTC: { offsetMinutes: 0, dst: false },
  GMT: { offsetMinutes: 0, dst: false },
  CET: { offsetMinutes: 60, dst: false },
  CEST: { offsetMinutes: 120, dst: true },
  WET: { offsetMinutes: 0, dst: false },
  WEST: { offsetMinutes: 60, dst: true },
  EET: { offsetMinutes: 120, dst: false },
  EEST: { offsetMinutes: 180, dst: true },
  EST: { offsetMinutes: -300, dst: false },
  EDT: { offsetMinutes: -240, dst: true },
  CST: { offsetMinutes: -360, dst: false },
  CDT: { offsetMinutes: -300, dst: true },
  MST: { offsetMinutes: -420, dst: false },
  MDT: { offsetMinutes: -360, dst: true },
  PST: { offsetMinutes: -480, dst: false },
  PDT: { offsetMinutes: -420, dst: true },
};

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function shiftDate(year: number, month: number, day: number, deltaDays: number) {
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function parseTimePart(value: string): TimeParts | ErrorResult {
  const match = value
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2})(?:\.(\d{1,9}))?)?\s*(am|pm)?$/i);
  if (!match) {
    return {
      error: "invalid_time",
      message:
        "Could not parse the time portion. Use forms like `5pm`, `17:35`, or `03:15:20`.",
    };
  }

  const ampm = match[5]?.toLowerCase() ?? null;
  const minute = match[2] ? Number(match[2]) : 0;
  const second = match[3] ? Number(match[3]) : 0;
  const fraction = match[4] ?? "";
  let hour = Number(match[1]);

  if (minute > 59 || second > 59) {
    return {
      error: "invalid_time",
      message: "Minutes and seconds must be between 00 and 59.",
    };
  }

  if (ampm) {
    if (hour < 1 || hour > 12) {
      return {
        error: "invalid_time",
        message: "12-hour clock inputs must use an hour between 1 and 12.",
      };
    }
    hour = hour % 12;
    if (ampm === "pm") hour += 12;
  } else if (hour > 23) {
    return {
      error: "invalid_time",
      message: "24-hour clock inputs must use an hour between 0 and 23.",
    };
  }

  const precision = fraction.length;
  const padded = fraction.padEnd(9, "0");
  return {
    hour,
    minute,
    second,
    millisecond: precision > 0 ? Number(padded.slice(0, 3)) : 0,
    nsRemainder: precision > 3 ? Number(padded.slice(3, 9)) : 0,
    inputPrecision: precision,
  };
}

export function parseDateAndTime(
  value: string,
  baseDate: { year: number; month: number; day: number },
): ParsedLocalInput | ErrorResult {
  const relativeMatch = value.match(/^(today|tomorrow|yesterday)\s+(.+)$/i);
  if (relativeMatch) {
    const keyword = relativeMatch[1].toLowerCase() as RelativeDateKeyword;
    const deltaDays = keyword === "tomorrow" ? 1 : keyword === "yesterday" ? -1 : 0;
    const shifted = shiftDate(baseDate.year, baseDate.month, baseDate.day, deltaDays);
    const time = parseTimePart(relativeMatch[2]);
    if ("error" in time) return time;
    return {
      ...shifted,
      ...time,
      dateSource: "relative",
      relativeKeyword: keyword,
    };
  }

  const explicitMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T]+(.+))$/);
  if (explicitMatch) {
    const year = Number(explicitMatch[1]);
    const month = Number(explicitMatch[2]);
    const day = Number(explicitMatch[3]);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
      return {
        error: "invalid_date",
        message: "The date portion is not a valid calendar date.",
      };
    }
    const time = parseTimePart(explicitMatch[4]);
    if ("error" in time) return time;
    return {
      year,
      month,
      day,
      ...time,
      dateSource: "explicit",
      relativeKeyword: null,
    };
  }

  const time = parseTimePart(value);
  if ("error" in time) return time;
  return {
    year: baseDate.year,
    month: baseDate.month,
    day: baseDate.day,
    ...time,
    dateSource: "base",
    relativeKeyword: null,
  };
}

function parseOffsetToken(value: string): number | null {
  if (value === "Z") return 0;
  const match = value.match(/^([+-])(\d{2})(?::?(\d{2}))$/);
  if (!match) return null;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  if (hour > 23 || minute > 59) return null;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (hour * 60 + minute);
}

function parseZoneToken(value: string) {
  const normalized = value.toUpperCase();
  if (value.includes("/")) return { kind: "iana" as const, zone: value };
  if (normalized === "DST" || normalized === "STD")
    return { kind: "hint" as const, expectedDst: normalized === "DST" };
  const offsetMinutes = parseOffsetToken(normalized);
  if (offsetMinutes !== null) return { kind: "offset" as const, offsetMinutes };
  if (normalized in FIXED_ZONE_ABBREVIATIONS) {
    const abbreviation = FIXED_ZONE_ABBREVIATIONS[normalized];
    return {
      kind: "abbreviation" as const,
      offsetMinutes: abbreviation.offsetMinutes,
      expectedDst: abbreviation.dst,
    };
  }
  return null;
}

export function splitZoneToken(value: string) {
  const normalized = normalizeWhitespace(value);
  const cut = normalized.lastIndexOf(" ");
  if (cut === -1) return { body: normalized, zoneToken: null };
  const candidate = normalized.slice(cut + 1);
  return parseZoneToken(candidate)
    ? { body: normalized.slice(0, cut).trim(), zoneToken: candidate }
    : { body: normalized, zoneToken: null };
}

export function resolveSourceSpec(
  from: string | null,
  zoneToken: string | null,
): { source: SourceSpec } | ErrorResult {
  if (!zoneToken) {
    if (!from) {
      return {
        error: "missing_source_zone",
        message:
          "Include a source time zone in the value or pass `from=<IANA zone>` to interpret the local time.",
      };
    }
    return {
      source: {
        kind: "iana",
        zone: from,
        hint: { raw: null },
      },
    };
  }

  const parsed = parseZoneToken(zoneToken);
  if (!parsed) {
    return {
      error: "invalid_zone",
      message: `Could not understand source zone token '${zoneToken}'.`,
    };
  }

  if (parsed.kind === "iana") {
    if (from && from !== parsed.zone) {
      return {
        error: "conflicting_source_zone",
        message: "The embedded source zone conflicts with the `from` query parameter.",
      };
    }
    return {
      source: {
        kind: "iana",
        zone: parsed.zone,
        hint: { raw: zoneToken },
      },
    };
  }

  if (parsed.kind === "hint") {
    if (!from) {
      return {
        error: "missing_source_zone",
        message: `Zone token '${zoneToken}' needs \`from=<IANA zone>\` so DST/STD can be resolved.`,
      };
    }
    return {
      source: {
        kind: "iana",
        zone: from,
        hint: { raw: zoneToken, expectedDst: parsed.expectedDst },
      },
    };
  }

  if (from) {
    return {
      source: {
        kind: "iana",
        zone: from,
        hint: {
          raw: zoneToken,
          expectedOffsetMinutes: parsed.offsetMinutes,
          expectedDst: "expectedDst" in parsed ? parsed.expectedDst : undefined,
        },
      },
    };
  }

  return {
    source: {
      kind: parsed.kind,
      raw: zoneToken,
      offsetMinutes: parsed.offsetMinutes,
      hint: {
        raw: zoneToken,
        expectedOffsetMinutes: parsed.offsetMinutes,
        expectedDst: "expectedDst" in parsed ? parsed.expectedDst : undefined,
      },
    },
  };
}
