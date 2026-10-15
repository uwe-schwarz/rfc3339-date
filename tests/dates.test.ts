import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRfc3339, parseIsoBasic } from "../src/lib/validation.ts";
import { parseInputToInstant, toOutput } from "../src/lib/convert.ts";
import { parseHumanTime } from "../src/lib/human-time.ts";
import {
  durationToMs,
  parseDurationIso,
  maxIsoWeekForYear,
  formatIsoDurationFromMs,
} from "../src/lib/devux.ts";

test("calendar validation, leap seconds and nanoseconds", () => {
  for (const [value, valid] of [
    ["2024-02-29T12:00:00Z", true],
    ["2026-02-29T12:00:00Z", false],
    ["2026-02-25 19:17:03Z", false],
    ["2016-12-31T23:59:60Z", false],
    ["2026-02-25T19:17:03.123456789Z", true],
  ] as const)
    assert.equal(parseRfc3339(value, false).ok, valid, value);
  assert.equal(parseRfc3339("2016-12-31T23:59:60Z", true).ok, true);
  assert.equal(parseIsoBasic("20260225T201703+0100").ok, true);
  for (const [value, input, expected] of [
    ["1700000000", "unix", "2023-11-14T22:13:20Z"],
    ["-1", "unix", "1969-12-31T23:59:59Z"],
    ["60", "excel1900", "1900-02-29T00:00:00Z"],
    ["2026-02-25T19:17:03.123456789Z", "rfc3339", "2026-02-25T19:17:03.123456789Z"],
  ] as const) {
    const parsed = parseInputToInstant(value, input, "latest");
    assert.ok("instant" in parsed, value);
    assert.equal(
      toOutput(parsed.instant, "rfc3339", null, value.includes("123456789") ? 9 : 0),
      expected,
    );
  }
});

test("human expressions keep fixed offsets, relative dates and DST rules", () => {
  for (const [value, from, base, expected] of [
    ["2026-05-22 17:35 CEST", null, "2026-01-01T00:00:00Z", "2026-05-22T15:35:00Z"],
    ["tomorrow 3am CET", null, "2026-05-21T22:30:00Z", "2026-05-22T02:00:00Z"],
    ["5pm DST", "Europe/Berlin", "2026-06-01T12:00:00Z", "2026-06-01T15:00:00Z"],
  ] as const) {
    const parsed = parseHumanTime(value, {
      from,
      baseInstant: { unixMs: Date.parse(base), nsRemainder: 0 },
    });
    assert.ok("instant" in parsed, value);
    assert.equal(parsed.instant.unixMs, Date.parse(expected));
  }
  const invalid = parseHumanTime("5pm DST", {
    from: "Europe/Berlin",
    baseInstant: { unixMs: Date.parse("2026-01-10T12:00:00Z"), nsRemainder: 0 },
  });
  assert.ok("error" in invalid);
  assert.equal(invalid.error, "invalid_zone_hint");
});

test("duration and calendar arithmetic keep their special cases", () => {
  assert.deepEqual(parseDurationIso("-P1DT2H3M4.5S"), {
    years: 0,
    months: 0,
    days: -1,
    hours: -2,
    minutes: -3,
    seconds: -4,
    milliseconds: -500,
  });
  assert.throws(
    () =>
      durationToMs({
        years: 1,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
    /years\/months/,
  );
  assert.equal(maxIsoWeekForYear(2021), 52);
  assert.equal(maxIsoWeekForYear(2026), 53);
  assert.equal(formatIsoDurationFromMs(0.0008), "P0DT0H0M0.0000008S");
});
