import { describe, expect, it } from "vitest";
import { renderDocs, renderLanding } from "../src/lib/html";

describe("renderLanding", () => {
  it("mentions the project disclaimer and scalar registry link", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain("This is a fun project");
    expect(html).toContain("not a reliable source of correct date or time");
    expect(html).toContain("https://registry.scalar.com/@iq42/apis/rfc3339date-time-api@latest");
  });
});

describe("renderDocs", () => {
  it("renders a first-party docs page without embedded api ui assets", () => {
    const html = renderDocs("2026-01-01T00:00:00.000Z");

    expect(html).toContain('href="/openapi.yaml"');
    expect(html).toContain('href="/openapi.json"');
    expect(html).toContain('href="/openapi.scalar.json"');
    expect(html).toContain("https://registry.scalar.com/@iq42/apis/rfc3339date-time-api@latest");
    expect(html).toContain("migrating to Scalar");
    expect(html).not.toContain("<rapi-doc");
    expect(html).not.toContain("/rapidoc/");
    expect(html).not.toContain("cdn.");
  });

  it("uses local fonts without third-party docs assets", () => {
    const html = renderDocs("2026-01-01T00:00:00.000Z");

    expect(html).toContain('href="/styles.css"');
    expect(html).not.toContain("proxy.scalar.com");
    expect(html).not.toContain("fonts.scalar.com");
    expect(html).not.toContain("rapidoc-min.js");
  });
});
