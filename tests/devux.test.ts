import { describe, expect, test } from "vitest";
import {
  durationToMs,
  maxIsoWeekForYear,
  parseDurationIso,
  selectClosestInstant,
  shiftWallClockTime,
} from "../src/lib/devux";

describe("devux helpers", () => {
  test("parses negative ISO durations", () => {
    const parsed = parseDurationIso("-P1DT2H3M4.5S");
    expect(parsed).toEqual({
      years: 0,
      months: 0,
      days: -1,
      hours: -2,
      minutes: -3,
      seconds: -4,
      milliseconds: -500,
    });
  });

  test("rejects calendar units when converting durations to milliseconds", () => {
    expect(() =>
      durationToMs({
        years: 1,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
    ).toThrow(/years\/months/);
  });

  test("computes the max ISO week for a given year", () => {
    expect(maxIsoWeekForYear(2021)).toBe(52);
    expect(maxIsoWeekForYear(2026)).toBe(53);
  });

  test("preserves subsecond state when shifting wall-clock times", () => {
    const shifted = shiftWallClockTime(
      {
        year: 2026,
        month: 3,
        day: 29,
        hour: 0,
        minute: 30,
        second: 59,
      },
      {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 200,
      },
      { unixMs: Date.parse("2026-03-29T00:30:59.900Z"), nsRemainder: 123456 },
    );

    expect(shifted).toEqual({
      year: 2026,
      month: 3,
      day: 29,
      hour: 0,
      minute: 31,
      second: 0,
      nsRemainder: 123456,
    });
  });

  test("selects the ambiguous candidate closest to the input instant", () => {
    const chosen = selectClosestInstant(
      [
        { unixMs: Date.parse("2026-10-25T00:30:00Z"), nsRemainder: 0 },
        { unixMs: Date.parse("2026-10-25T01:30:00Z"), nsRemainder: 0 },
      ],
      { unixMs: Date.parse("2026-10-25T01:30:00Z"), nsRemainder: 0 },
    );

    expect(chosen).toBe(1);
  });
});
