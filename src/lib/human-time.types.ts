import type { Instant } from "../types";
import { formatOffset, pad2, pad3 } from "./date";
import { getZoneParts } from "./zone";

export type RelativeDateKeyword = "today" | "tomorrow" | "yesterday";
export type DateSourceKind = "explicit" | "relative" | "base";
export type ResolvedSourceKind = "iana" | "offset" | "abbreviation";

export type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  nsRemainder: number;
  inputPrecision: number;
};

export type ZoneHint = {
  raw: string | null;
  expectedOffsetMinutes?: number;
  expectedDst?: boolean;
};

export type ErrorResult = {
  error: string;
  message: string;
};

export type TimeParts = {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  nsRemainder: number;
  inputPrecision: number;
};

export type ParsedLocalInput = LocalDateTimeParts & {
  dateSource: DateSourceKind;
  relativeKeyword: RelativeDateKeyword | null;
};

export type IanaSourceSpec = {
  kind: "iana";
  zone: string;
  hint: ZoneHint;
};

export type FixedOffsetSourceSpec = {
  kind: "offset" | "abbreviation";
  raw: string;
  offsetMinutes: number;
  hint: ZoneHint;
};

export type SourceSpec = IanaSourceSpec | FixedOffsetSourceSpec;

export type ZoneSnapshot = {
  offsetMinutes: number;
  offset: string;
  abbreviation: string | null;
  dst: boolean;
};

export type HumanTimeParseResult = {
  instant: Instant;
  source: {
    local: string;
    localDate: string;
    localTime: string;
    dateSource: DateSourceKind;
    base: string;
    zone: {
      raw: string | null;
      kind: ResolvedSourceKind;
      tz: string | null;
      offset: string;
      abbreviation: string | null;
      dst: boolean | null;
    };
  };
  notes: string[];
};

export function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatTimeParts(
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  nsRemainder: number,
  precision: number,
): string {
  const base = `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  if (precision <= 0) return base;
  const fraction = `${pad3(millisecond)}${String(nsRemainder).padStart(6, "0")}`;
  return `${base}.${fraction.slice(0, Math.min(9, precision))}`;
}

function isDstForZone(instant: Instant, zone: string): boolean {
  const current = getZoneParts(instant, zone).offsetMinutes;
  const year = new Date(instant.unixMs).getUTCFullYear();
  const jan = getZoneParts({ unixMs: Date.UTC(year, 0, 1), nsRemainder: 0 }, zone).offsetMinutes;
  const jul = getZoneParts({ unixMs: Date.UTC(year, 6, 1), nsRemainder: 0 }, zone).offsetMinutes;
  return current !== Math.min(jan, jul);
}

export function getZoneSnapshot(instant: Instant, zone: string): ZoneSnapshot {
  const parts = getZoneParts(instant, zone);
  return {
    offsetMinutes: parts.offsetMinutes,
    offset: formatOffset(parts.offsetMinutes),
    abbreviation: parts.abbreviation,
    dst: isDstForZone(instant, zone),
  };
}

export function getFixedOffsetDateParts(instant: Instant, offsetMinutes: number) {
  const shifted = new Date(instant.unixMs + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}
