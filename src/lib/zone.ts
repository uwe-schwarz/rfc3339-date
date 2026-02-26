import type { Instant } from "../types";
import { formatOffset, pad2, pad3 } from "./date";

const zoneFormatterCache = new Map<string, Intl.DateTimeFormat>();
const zoneNameFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(zone: string): Intl.DateTimeFormat {
  const cached = zoneFormatterCache.get(zone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  zoneFormatterCache.set(zone, formatter);
  return formatter;
}

function getNameFormatter(zone: string): Intl.DateTimeFormat {
  const cached = zoneNameFormatterCache.get(zone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  zoneNameFormatterCache.set(zone, formatter);
  return formatter;
}

export function ensureIanaZone(zone: string): boolean {
  if (zone.length < 3 || !zone.includes("/")) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getZoneParts(instant: Instant, zone: string) {
  const formatter = getFormatter(zone);
  const nameFormatter = getNameFormatter(zone);

  const parts = formatter.formatToParts(new Date(instant.unixMs));
  const map = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );

  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  const second = Number(map.second);

  const asUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const baseMs = Math.floor(instant.unixMs / 1000) * 1000;
  const offsetMinutes = Math.round((asUtcMs - baseMs) / 60_000);

  const abbreviation =
    nameFormatter.formatToParts(new Date(instant.unixMs)).find((p) => p.type === "timeZoneName")
      ?.value ?? null;

  return { year, month, day, hour, minute, second, offsetMinutes, abbreviation };
}

export function formatRfc3339InZone(instant: Instant, zone: string, precision: number): string {
  const z = getZoneParts(instant, zone);
  const offset = formatOffset(z.offsetMinutes);
  const base = `${z.year}-${pad2(z.month)}-${pad2(z.day)}T${pad2(z.hour)}:${pad2(z.minute)}:${pad2(z.second)}`;
  if (precision <= 0) return `${base}${offset}`;
  const full = `${pad3(new Date(instant.unixMs).getUTCMilliseconds())}${String(instant.nsRemainder).padStart(6, "0")}`;
  return `${base}.${full.slice(0, Math.min(9, precision))}${offset}`;
}
