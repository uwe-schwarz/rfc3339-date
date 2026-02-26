import type { LeapSecondEntry } from "../types";

export const LEAP_SECONDS_VERSION = "IERS-UTC-2026.01";
export const LEAP_SECONDS_SOURCE =
  "Static table derived from IERS Bulletin C announcements through 2017-01-01.";

export const LEAP_SECONDS: LeapSecondEntry[] = [
  { effective: "1972-01-01T00:00:00Z", taiMinusUtc: 10 },
  { effective: "1972-07-01T00:00:00Z", taiMinusUtc: 11 },
  { effective: "1973-01-01T00:00:00Z", taiMinusUtc: 12 },
  { effective: "1974-01-01T00:00:00Z", taiMinusUtc: 13 },
  { effective: "1975-01-01T00:00:00Z", taiMinusUtc: 14 },
  { effective: "1976-01-01T00:00:00Z", taiMinusUtc: 15 },
  { effective: "1977-01-01T00:00:00Z", taiMinusUtc: 16 },
  { effective: "1978-01-01T00:00:00Z", taiMinusUtc: 17 },
  { effective: "1979-01-01T00:00:00Z", taiMinusUtc: 18 },
  { effective: "1980-01-01T00:00:00Z", taiMinusUtc: 19 },
  { effective: "1981-07-01T00:00:00Z", taiMinusUtc: 20 },
  { effective: "1982-07-01T00:00:00Z", taiMinusUtc: 21 },
  { effective: "1983-07-01T00:00:00Z", taiMinusUtc: 22 },
  { effective: "1985-07-01T00:00:00Z", taiMinusUtc: 23 },
  { effective: "1988-01-01T00:00:00Z", taiMinusUtc: 24 },
  { effective: "1990-01-01T00:00:00Z", taiMinusUtc: 25 },
  { effective: "1991-01-01T00:00:00Z", taiMinusUtc: 26 },
  { effective: "1992-07-01T00:00:00Z", taiMinusUtc: 27 },
  { effective: "1993-07-01T00:00:00Z", taiMinusUtc: 28 },
  { effective: "1994-07-01T00:00:00Z", taiMinusUtc: 29 },
  { effective: "1996-01-01T00:00:00Z", taiMinusUtc: 30 },
  { effective: "1997-07-01T00:00:00Z", taiMinusUtc: 31 },
  { effective: "1999-01-01T00:00:00Z", taiMinusUtc: 32 },
  { effective: "2006-01-01T00:00:00Z", taiMinusUtc: 33 },
  { effective: "2009-01-01T00:00:00Z", taiMinusUtc: 34 },
  { effective: "2012-07-01T00:00:00Z", taiMinusUtc: 35 },
  { effective: "2015-07-01T00:00:00Z", taiMinusUtc: 36 },
  { effective: "2017-01-01T00:00:00Z", taiMinusUtc: 37 },
];

export const LEAP_SECONDS_PARSED = LEAP_SECONDS.map((entry) => ({
  effectiveMs: Date.parse(entry.effective),
  taiMinusUtc: entry.taiMinusUtc,
}));

export const NTP_UNIX_OFFSET_SECONDS = 2_208_988_800;
export const GPS_EPOCH_MS = Date.parse("1980-01-06T00:00:00Z");
export const EXCEL_1900_BASE_MS = Date.UTC(1899, 11, 31, 0, 0, 0, 0);
export const EXCEL_1904_BASE_MS = Date.UTC(1904, 0, 1, 0, 0, 0, 0);
export const DAY_MS = 86_400_000;
