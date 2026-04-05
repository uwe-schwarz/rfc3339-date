import type { Instant } from "../types";
import { getZoneParts } from "./zone";

export type DurationParts = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export function parseDurationIso(value: string): DurationParts | null {
  const match = value.match(
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
  );
  if (!match) return null;
  return {
    years: Number(match[1] ?? 0),
    months: Number(match[2] ?? 0),
    days: Number(match[3] ?? 0),
    hours: Number(match[4] ?? 0),
    minutes: Number(match[5] ?? 0),
    seconds: Math.trunc(Number(match[6] ?? 0)),
    milliseconds: Math.round((Number(match[6] ?? 0) % 1) * 1000),
  };
}

export function durationToMs(parts: DurationParts): number {
  return (
    (((parts.days * 24 + parts.hours) * 60 + parts.minutes) * 60 + parts.seconds) * 1000 +
    parts.milliseconds
  );
}

export function formatIsoDurationFromMs(deltaMs: number): string {
  const sign = deltaMs < 0 ? "-" : "";
  let remaining = Math.abs(deltaMs);
  const days = Math.floor(remaining / 86_400_000);
  remaining %= 86_400_000;
  const hours = Math.floor(remaining / 3_600_000);
  remaining %= 3_600_000;
  const minutes = Math.floor(remaining / 60_000);
  remaining %= 60_000;
  const seconds = Math.floor(remaining / 1000);
  const ms = remaining % 1000;
  const secondPart = ms > 0 ? `${seconds}.${String(ms).padStart(3, "0")}` : String(seconds);
  return `${sign}P${days}DT${hours}H${minutes}M${secondPart}S`;
}

function localMatches(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  instant: Instant,
  zone: string,
): boolean {
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

export function resolveLocalCandidates(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    nsRemainder?: number;
  },
  zone: string,
): Instant[] {
  const localMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const offsets = new Set<number>();
  for (const deltaHours of [-36, -24, -12, 0, 12, 24, 36]) {
    offsets.add(
      getZoneParts({ unixMs: localMs + deltaHours * 3_600_000, nsRemainder: 0 }, zone)
        .offsetMinutes,
    );
  }
  return [...offsets]
    .map((offsetMinutes) => ({
      unixMs: localMs - offsetMinutes * 60_000,
      nsRemainder: parts.nsRemainder ?? 0,
    }))
    .filter((instant) => localMatches(parts, instant, zone))
    .sort((a, b) => a.unixMs - b.unixMs);
}

export function parseLocalClock(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
  };
}

export function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day));
  return new Date(week1Monday.getTime() + (week - 1) * 7 * 86_400_000);
}

export const WINDOWS_TZ_MAP: Record<string, string> = {
  "w. europe standard time": "Europe/Berlin",
  utc: "UTC",
};
