import { describe, expect, it } from "vitest";

import { buildStableMockResponse, computeAllowedPixels } from "../scripts/deps-visual-lib.mjs";

describe("buildStableMockResponse", () => {
  it("stubs the home-page timezone conversion example in plain text", () => {
    const response = buildStableMockResponse(
      "http://127.0.0.1:4321/tz/convert?value=tomorrow%2010am%20PST&to=Europe%2FBerlin",
    );

    expect(response).not.toBeNull();
    expect(response?.headers["content-type"]).toContain("text/plain");
    expect(response?.body).toBe("2026-05-22T19:00:00+02:00");
  });

  it("stubs json output for the current-time example", () => {
    const response = buildStableMockResponse(
      "http://127.0.0.1:4321/now/Europe%2FBerlin?json=1",
    );

    expect(response).not.toBeNull();
    expect(response?.headers["content-type"]).toContain("application/json");
    expect(typeof response?.body).toBe("string");
    expect(String(response?.body)).toContain('"tz": "Europe/Berlin"');
    expect(String(response?.body)).toContain('"now": "2026-02-26T13:34:56.789+01:00"');
  });

  it("ignores unrelated requests", () => {
    expect(buildStableMockResponse("http://127.0.0.1:4321/styles.css")).toBeNull();
  });
});

describe("computeAllowedPixels", () => {
  it("enforces a floor even when repeated samples are identical", () => {
    expect(computeAllowedPixels({ totalPixels: 1_000, noisePixels: 0 })).toBe(100);
  });

  it("scales with observed screenshot noise", () => {
    expect(computeAllowedPixels({ totalPixels: 10_000_000, noisePixels: 250 })).toBe(750);
  });
});
