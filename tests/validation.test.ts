import { describe, expect, test } from "vitest";
import { parseIsoBasic, parseRfc3339, validateValue } from "../src/lib/validation";

describe("rfc3339 validation", () => {
  test("accepts valid RFC3339", () => {
    const parsed = parseRfc3339("2026-02-25T19:17:03.482Z", false);
    expect(parsed.ok).toBe(true);
  });

  test("rejects missing T", () => {
    const parsed = parseRfc3339("2026-02-25 19:17:03Z", false);
    expect(parsed.ok).toBe(false);
  });

  test("rejects invalid date", () => {
    const parsed = parseRfc3339("2026-02-30T19:17:03Z", false);
    expect(parsed.ok).toBe(false);
  });

  test("iso basic accepted", () => {
    const parsed = parseIsoBasic("20260225T201703+0100");
    expect(parsed.ok).toBe(true);
  });

  test("strict profile invalid sample", () => {
    const result = validateValue("2026-02-25 19:17:03Z", "rfc3339", "strict");
    expect(result.valid).toBe(false);
  });
});
