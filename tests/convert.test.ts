import { describe, expect, test } from "vitest";
import { parseInputToInstant, toOutput } from "../src/lib/convert";

describe("conversions", () => {
  test("unix to rfc3339", () => {
    const parsed = parseInputToInstant("1700000000", "unix", "latest");
    expect("instant" in parsed).toBe(true);
    if ("instant" in parsed) {
      expect(toOutput(parsed.instant, "rfc3339", null, 0)).toBe("2023-11-14T22:13:20Z");
    }
  });

  test("excel1900 serial 60 keeps bug-compatible day", () => {
    const parsed = parseInputToInstant("60", "excel1900", "latest");
    expect("instant" in parsed).toBe(true);
    if ("instant" in parsed) {
      expect(toOutput(parsed.instant, "rfc3339", null, 0)).toBe("1900-02-29T00:00:00Z");
    }
  });

  test("ntp hex converts", () => {
    const parsed = parseInputToInstant("0x83AA7E80:0x00000000", "ntp", "latest");
    expect("instant" in parsed).toBe(true);
  });
});
