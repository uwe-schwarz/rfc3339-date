import type { Instant } from "../types";
import { parseInputToInstant } from "./convert";
import { isoWeek } from "./date";
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
    /^(-)?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
  );
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const signedInt = (raw: string | undefined) => (raw ? sign * Number(raw) : 0);
  const secondsRaw = Number(match[7] ?? 0);
  return {
    years: signedInt(match[2]),
    months: signedInt(match[3]),
    days: signedInt(match[4]),
    hours: signedInt(match[5]),
    minutes: signedInt(match[6]),
    seconds: secondsRaw ? sign * Math.trunc(secondsRaw) : 0,
    milliseconds: secondsRaw ? sign * Math.round((secondsRaw % 1) * 1000) : 0,
  };
}

export function durationToMs(parts: DurationParts): number {
  if (parts.years !== 0 || parts.months !== 0) {
    throw new RangeError(
      "Cannot convert duration with years/months to milliseconds; handle calendar units explicitly.",
    );
  }
  return (
    (((parts.days * 24 + parts.hours) * 60 + parts.minutes) * 60 + parts.seconds) * 1000 +
    parts.milliseconds
  );
}

export function formatIsoDurationFromMs(deltaMs: number): string {
  const totalNanoseconds = BigInt(Math.round(deltaMs * 1_000_000));
  const sign = totalNanoseconds < 0n ? "-" : "";
  let remaining = totalNanoseconds < 0n ? -totalNanoseconds : totalNanoseconds;
  const dayNs = 86_400_000_000_000n;
  const hourNs = 3_600_000_000_000n;
  const minuteNs = 60_000_000_000n;
  const secondNs = 1_000_000_000n;

  const days = remaining / dayNs;
  remaining %= dayNs;
  const hours = remaining / hourNs;
  remaining %= hourNs;
  const minutes = remaining / minuteNs;
  remaining %= minuteNs;
  const seconds = remaining / secondNs;
  const fractionalNs = remaining % secondNs;
  const secondPart =
    fractionalNs > 0n
      ? `${seconds}.${fractionalNs.toString().padStart(9, "0").replace(/0+$/, "")}`
      : seconds.toString();
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

export function shiftWallClockTime(
  local: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  duration: DurationParts,
  baseInstant: Instant,
) {
  const shifted = new Date(
    Date.UTC(
      local.year + duration.years,
      local.month - 1 + duration.months,
      local.day + duration.days,
      local.hour + duration.hours,
      local.minute + duration.minutes,
      local.second + duration.seconds,
      new Date(baseInstant.unixMs).getUTCMilliseconds() + duration.milliseconds,
    ),
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    nsRemainder: baseInstant.nsRemainder,
  };
}

export function selectClosestInstant(candidates: Instant[], anchor: Instant): number {
  let chosenIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  const anchorNs = BigInt(anchor.unixMs) * 1_000_000n + BigInt(anchor.nsRemainder);

  for (const [index, candidate] of candidates.entries()) {
    const candidateNs = BigInt(candidate.unixMs) * 1_000_000n + BigInt(candidate.nsRemainder);
    const rawDistance = candidateNs - anchorNs;
    const distance = Number(rawDistance < 0n ? -rawDistance : rawDistance);
    if (distance < bestDistance) {
      chosenIndex = index;
      bestDistance = distance;
      continue;
    }
    if (
      distance === bestDistance &&
      (candidate.unixMs < candidates[chosenIndex]!.unixMs ||
        (candidate.unixMs === candidates[chosenIndex]!.unixMs &&
          candidate.nsRemainder < candidates[chosenIndex]!.nsRemainder))
    ) {
      chosenIndex = index;
    }
  }

  return chosenIndex;
}

export function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day));
  return new Date(week1Monday.getTime() + (week - 1) * 7 * 86_400_000);
}

export function maxIsoWeekForYear(year: number): number {
  return isoWeek(new Date(Date.UTC(year, 11, 28))).week;
}

export function parseTimestamp(value: string) {
  const auto = parseInputToInstant(value, "auto", "latest");
  if ("instant" in auto) return auto;
  if (auto.error === "ambiguous_input") return parseInputToInstant(value, "rfc3339", "latest");
  return auto;
}

// WINDOWS_TZ_MAP is intentionally curated rather than exhaustive. Extend it here when
// /tz/resolve needs additional Windows aliases beyond the common interop cases below.
export const WINDOWS_TZ_MAP: Record<string, string> = {
  "aus eastern standard time": "Australia/Sydney",
  "central europe standard time": "Europe/Budapest",
  "central european standard time": "Europe/Warsaw",
  "central standard time": "America/Chicago",
  "eastern standard time": "America/New_York",
  "gmt standard time": "Europe/London",
  "greenwich standard time": "Europe/London",
  "india standard time": "Asia/Kolkata",
  "mountain standard time": "America/Denver",
  "pacific standard time": "America/Los_Angeles",
  "romance standard time": "Europe/Paris",
  "tokyo standard time": "Asia/Tokyo",
  "w. europe standard time": "Europe/Berlin",
  utc: "UTC",
};
