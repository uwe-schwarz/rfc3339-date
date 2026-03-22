import { describe, expect, test } from "vitest";
import { parseHumanTime, resolveZoneSpec } from "../src/lib/human-time";

describe("human time parsing", () => {
  test("parses explicit local time with abbreviation as fixed offset", () => {
    const parsed = parseHumanTime("2026-05-22 17:35 CEST", {
      from: null,
      baseInstant: { unixMs: Date.parse("2026-01-01T00:00:00Z"), nsRemainder: 0 },
    });

    expect("instant" in parsed).toBe(true);
    if ("instant" in parsed) {
      expect(parsed.instant.unixMs).toBe(Date.parse("2026-05-22T15:35:00Z"));
      expect(parsed.source.local).toBe("2026-05-22T17:35:00+02:00");
      expect(parsed.source.zone.kind).toBe("abbreviation");
    }
  });

  test("resolves relative input against a fixed-offset abbreviation", () => {
    const parsed = parseHumanTime("tomorrow 3am CET", {
      from: null,
      baseInstant: { unixMs: Date.parse("2026-05-21T22:30:00Z"), nsRemainder: 0 },
    });

    expect("instant" in parsed).toBe(true);
    if ("instant" in parsed) {
      expect(parsed.instant.unixMs).toBe(Date.parse("2026-05-22T02:00:00Z"));
      expect(parsed.notes[0]).toContain("Resolved 'tomorrow'");
    }
  });

  test("uses from= zone to interpret DST hints", () => {
    const parsed = parseHumanTime("5pm DST", {
      from: "Europe/Berlin",
      baseInstant: { unixMs: Date.parse("2026-06-01T12:00:00Z"), nsRemainder: 0 },
    });

    expect("instant" in parsed).toBe(true);
    if ("instant" in parsed) {
      expect(parsed.instant.unixMs).toBe(Date.parse("2026-06-01T15:00:00Z"));
      expect(parsed.source.zone.tz).toBe("Europe/Berlin");
      expect(parsed.source.zone.dst).toBe(true);
    }
  });

  test("rejects DST hints when the base date is not in daylight time", () => {
    const parsed = parseHumanTime("5pm DST", {
      from: "Europe/Berlin",
      baseInstant: { unixMs: Date.parse("2026-01-10T12:00:00Z"), nsRemainder: 0 },
    });

    expect("error" in parsed).toBe(true);
    if ("error" in parsed) {
      expect(parsed.error).toBe("invalid_zone_hint");
    }
  });

  test("accepts hours-only numeric offset tokens", () => {
    const resolved = resolveZoneSpec("+05");
    expect("spec" in resolved).toBe(true);
    if ("spec" in resolved) {
      expect(resolved.spec.kind).toBe("offset");
      if (resolved.spec.kind === "offset") expect(resolved.spec.offsetMinutes).toBe(300);
    }
  });

  test("rejects invalid slash-style zones", () => {
    const resolved = resolveZoneSpec("Bad/Zone");
    expect("error" in resolved).toBe(true);
  });
});
