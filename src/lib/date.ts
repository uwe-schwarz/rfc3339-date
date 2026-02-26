import type { Instant } from "../types";
import { DAY_MS } from "./constants";

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

export function formatOffset(minutes: number): string {
  if (minutes === 0) return "Z";
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${pad2(h)}:${pad2(m)}`;
}

export function parseOffsetToMinutes(offset: string): number {
  if (offset === "Z") return 0;
  const sign = offset.startsWith("-") ? -1 : 1;
  const [h, m] = offset.slice(1).split(":").map(Number);
  return sign * (h * 60 + m);
}

export function formatRfc3339Utc(instant: Instant, precision: number): string {
  const d = new Date(instant.unixMs);
  const base = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
  if (precision <= 0) return `${base}Z`;
  const full = `${pad3(d.getUTCMilliseconds())}${String(instant.nsRemainder).padStart(6, "0")}`;
  return `${base}.${full.slice(0, Math.min(9, precision))}Z`;
}

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / DAY_MS) + 1;
}

export function isoWeek(date: Date): { year: number; week: number; day: number } {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() + 3 - day);
  const weekYear = utc.getUTCFullYear();
  const week1 = new Date(Date.UTC(weekYear, 0, 4));
  const week1Day = (week1.getUTCDay() + 6) % 7;
  week1.setUTCDate(week1.getUTCDate() - week1Day);
  const week = 1 + Math.round((utc.getTime() - week1.getTime()) / (7 * DAY_MS));
  return { year: weekYear, week, day: day + 1 };
}
