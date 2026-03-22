import type { Instant } from "../types";
import { formatOffset, formatRfc3339Utc } from "./date";
import { parseDateAndTime, resolveSourceSpec, splitZoneToken } from "./human-time-parse";
import {
  type ErrorResult,
  formatDateParts,
  formatTimeParts,
  getFixedOffsetDateParts,
  getZoneSnapshot,
  type FixedOffsetSourceSpec,
  type HumanTimeParseResult,
  type IanaSourceSpec,
  type LocalDateTimeParts,
  type SourceSpec,
} from "./human-time.types";
import { formatRfc3339InZone, getZoneParts } from "./zone";

function localMatches(parts: LocalDateTimeParts, instant: Instant, zone: string): boolean {
  const zoned = getZoneParts(instant, zone);
  return (
    zoned.year === parts.year &&
    zoned.month === parts.month &&
    zoned.day === parts.day &&
    zoned.hour === parts.hour &&
    zoned.minute === parts.minute &&
    zoned.second === parts.second
  );
}

function hintMatches(hint: IanaSourceSpec["hint"], instant: Instant, zone: string): boolean {
  const snapshot = getZoneSnapshot(instant, zone);
  if (
    typeof hint.expectedOffsetMinutes === "number" &&
    snapshot.offsetMinutes !== hint.expectedOffsetMinutes
  ) {
    return false;
  }
  if (typeof hint.expectedDst === "boolean" && snapshot.dst !== hint.expectedDst) return false;
  return true;
}

function resolveLocalInZone(parts: LocalDateTimeParts, source: IanaSourceSpec) {
  const localMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  const offsets = new Set<number>();
  for (const deltaHours of [-36, -24, -12, 0, 12, 24, 36]) {
    const sampled = {
      unixMs: localMs + deltaHours * 3_600_000,
      nsRemainder: parts.nsRemainder,
    };
    offsets.add(getZoneParts(sampled, source.zone).offsetMinutes);
  }

  const candidates = [...offsets]
    .map((offsetMinutes) => ({
      unixMs: localMs - offsetMinutes * 60_000,
      nsRemainder: parts.nsRemainder,
    }))
    .filter((instant) => localMatches(parts, instant, source.zone))
    .filter((instant) => hintMatches(source.hint, instant, source.zone))
    .sort((a, b) => a.unixMs - b.unixMs);

  if (candidates.length === 1) return { instant: candidates[0] };
  if (candidates.length > 1) {
    return {
      error: "ambiguous_local_time",
      message:
        "The local time maps to multiple instants in the source zone. Provide an explicit offset or abbreviation to disambiguate.",
    };
  }

  if (source.hint.raw) {
    return {
      error: "invalid_zone_hint",
      message: `The source zone hint '${source.hint.raw}' does not match that local time in ${source.zone}.`,
    };
  }

  return {
    error: "invalid_local_time",
    message:
      "That local time does not exist in the source zone, usually because of a DST transition gap.",
  };
}

function resolveLocalWithFixedOffset(parts: LocalDateTimeParts, source: FixedOffsetSourceSpec) {
  const unixMs =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ) -
    source.offsetMinutes * 60_000;
  return { instant: { unixMs, nsRemainder: parts.nsRemainder } satisfies Instant };
}

export function convertInstantToZoneDetails(instant: Instant, zone: string, precision: number) {
  const zoned = getZoneParts(instant, zone);
  const snapshot = getZoneSnapshot(instant, zone);
  return {
    local: formatRfc3339InZone(instant, zone, precision),
    date: formatDateParts(zoned.year, zoned.month, zoned.day),
    time: formatTimeParts(
      zoned.hour,
      zoned.minute,
      zoned.second,
      new Date(instant.unixMs).getUTCMilliseconds(),
      instant.nsRemainder,
      precision,
    ),
    offset: snapshot.offset,
    abbreviation: snapshot.abbreviation,
    dst: snapshot.dst,
  };
}

export function resolveZoneSpec(value: string): { spec: SourceSpec } | ErrorResult {
  const resolved = resolveSourceSpec(null, value);
  if ("error" in resolved) {
    if (value.includes("/")) {
      return {
        error: "zone_not_found",
        message: `Unknown IANA time zone '${value}'.`,
      };
    }
    if (value.toUpperCase() === "DST" || value.toUpperCase() === "STD") {
      return {
        error: "invalid_zone",
        message:
          "Target zone token must be an IANA zone, UTC, numeric offset, or supported abbreviation.",
      };
    }
    return resolved;
  }
  return { spec: resolved.source };
}

export function convertInstantToTargetDetails(
  instant: Instant,
  target: SourceSpec,
  precision: number,
) {
  if (target.kind === "iana") {
    const details = convertInstantToZoneDetails(instant, target.zone, precision);
    return {
      raw: target.hint.raw ?? target.zone,
      kind: target.kind,
      tz: target.zone,
      ...details,
    };
  }

  const shifted = new Date(instant.unixMs + target.offsetMinutes * 60_000);
  const date = formatDateParts(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
  const time = formatTimeParts(
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
    shifted.getUTCSeconds(),
    shifted.getUTCMilliseconds(),
    instant.nsRemainder,
    precision,
  );
  const offset = formatOffset(target.offsetMinutes);

  return {
    raw: target.raw,
    kind: target.kind,
    tz: null,
    local: `${date}T${time}${offset}`,
    date,
    time,
    offset,
    abbreviation: target.raw,
    dst: target.hint.expectedDst ?? null,
  };
}

export function parseHumanTime(
  value: string,
  options: { from: string | null; baseInstant: Instant },
): HumanTimeParseResult | { error: string; message: string } {
  const { body, zoneToken } = splitZoneToken(value);
  const sourceResolved = resolveSourceSpec(options.from, zoneToken);
  if ("error" in sourceResolved) return sourceResolved;
  const source = sourceResolved.source;

  const baseDate =
    source.kind === "iana"
      ? getZoneParts(options.baseInstant, source.zone)
      : getFixedOffsetDateParts(options.baseInstant, source.offsetMinutes);

  const parsed = parseDateAndTime(body, baseDate);
  if ("error" in parsed) return parsed;

  const resolved =
    source.kind === "iana"
      ? resolveLocalInZone(parsed, source)
      : resolveLocalWithFixedOffset(parsed, source);
  if ("error" in resolved) return resolved;

  const notes: string[] = [];
  if (parsed.dateSource !== "explicit") {
    notes.push(
      parsed.dateSource === "relative"
        ? `Resolved '${parsed.relativeKeyword}' relative to base instant ${formatRfc3339Utc(options.baseInstant, 3)}.`
        : `No date supplied; used base date ${formatDateParts(baseDate.year, baseDate.month, baseDate.day)} in the source context.`,
    );
  }

  if (source.kind === "abbreviation") {
    notes.push(
      `Abbreviation '${source.raw}' was treated as fixed offset ${formatOffset(source.offsetMinutes)}. Pass \`from=<IANA zone>\` to validate it against a specific region.`,
    );
  }

  const precision = parsed.inputPrecision;
  const sourceLocal =
    source.kind === "iana"
      ? convertInstantToZoneDetails(resolved.instant, source.zone, precision)
      : {
          local: `${formatDateParts(parsed.year, parsed.month, parsed.day)}T${formatTimeParts(parsed.hour, parsed.minute, parsed.second, parsed.millisecond, parsed.nsRemainder, precision)}${formatOffset(source.offsetMinutes)}`,
          date: formatDateParts(parsed.year, parsed.month, parsed.day),
          time: formatTimeParts(
            parsed.hour,
            parsed.minute,
            parsed.second,
            parsed.millisecond,
            parsed.nsRemainder,
            precision,
          ),
          offset: formatOffset(source.offsetMinutes),
          abbreviation: source.raw,
          dst: source.hint.expectedDst ?? null,
        };

  return {
    instant: resolved.instant,
    source: {
      local: sourceLocal.local,
      localDate: sourceLocal.date,
      localTime: sourceLocal.time,
      dateSource: parsed.dateSource,
      base: formatRfc3339Utc(options.baseInstant, 3),
      zone: {
        raw: zoneToken ?? options.from,
        kind: source.kind,
        tz: source.kind === "iana" ? source.zone : null,
        offset: sourceLocal.offset,
        abbreviation: sourceLocal.abbreviation,
        dst: sourceLocal.dst,
      },
    },
    notes,
  };
}

export type { HumanTimeParseResult } from "./human-time.types";
