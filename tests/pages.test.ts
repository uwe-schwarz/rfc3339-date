import { describe, expect, it } from "vitest";
import {
  renderImprint,
  renderLanding,
  SCALAR_REGISTRY_URL,
} from "../src/lib/html";

describe("renderLanding", () => {
  it("mentions the project disclaimer and openapi download links", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain("This is a fun project");
    expect(html).toContain("not a reliable source of correct date or time");
    expect(html).toContain(SCALAR_REGISTRY_URL);
    expect(html).toContain('href="/openapi.yaml"');
    expect(html).toContain('href="/openapi.json"');
    expect(html).toContain('href="/openapi.scalar.json"');
  });
});

describe("renderImprint", () => {
  it("links to github and loads the contributions view from same origin", () => {
    const html = renderImprint();

    expect(html).toContain("https://github.com/uwe-schwarz");
    expect(html).toContain('/github/uwe-schwarz/contributions');
    expect(html).toContain("Loading GitHub contribution stats");
    expect(html).not.toContain("proxy.scalar.com");
  });

  it("keeps the scalar registry target in one place", () => {
    expect(SCALAR_REGISTRY_URL).toBe("https://registry.scalar.com/@iq42/apis/rfc3339date-time-api@latest");
  });

  it("uses local styles and no rapidoc assets", () => {
    const html = renderImprint();

    expect(html).toContain('href="/styles.css"');
    expect(html).not.toContain("rapidoc-min.js");
  });
});
