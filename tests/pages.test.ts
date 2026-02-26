import { describe, expect, it } from "vitest";
import { renderDocs } from "../src/lib/html";

describe("renderDocs", () => {
  it("loads scalar assets from same origin", () => {
    const html = renderDocs("2026-01-01T00:00:00.000Z");

    expect(html).toContain('<script type="module" src="/rapidoc/rapidoc-min.js"></script>');
    expect(html).toContain("<rapi-doc");
    expect(html).toContain('spec-url="/openapi.yaml"');
    expect(html).toContain('render-style="view"');
    expect(html).toContain('allow-try="true"');
    expect(html).toContain('allow-authentication="true"');
    expect(html).toContain('allow-server-selection="true"');
    expect(html).not.toContain("cdn.");
  });

  it("uses local fonts and auto dark mode behavior", () => {
    const html = renderDocs("2026-01-01T00:00:00.000Z");

    expect(html).toContain('load-fonts="false"');
    expect(html).toContain('window.matchMedia("(prefers-color-scheme: dark)")');
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain("Geist Pixel Square");
    expect(html).not.toContain("proxy.scalar.com");
    expect(html).not.toContain("fonts.scalar.com");
  });
});
