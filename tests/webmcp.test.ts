import { describe, expect, it } from "vitest";
import { landingScript } from "../src/lib/landing-page-script";
import { WEB_MCP_TOOLS, buildWebMcpRegistrationScript } from "../src/lib/webmcp";

describe("WEB_MCP_TOOLS", () => {
  it("defines the site's broader read-only tool surface", () => {
    expect(WEB_MCP_TOOLS.map((tool) => tool.name)).toEqual([
      "get-current-time",
      "convert-timestamp",
      "validate-timestamp",
      "convert-human-time",
      "inspect-timezone",
    ]);

    expect(WEB_MCP_TOOLS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "get-current-time",
          endpoint: "/now",
        }),
        expect.objectContaining({
          name: "convert-timestamp",
          endpoint: "/convert",
        }),
        expect.objectContaining({
          name: "validate-timestamp",
          endpoint: "/validate",
        }),
        expect.objectContaining({
          name: "convert-human-time",
          endpoint: "/tz/convert",
        }),
        expect.objectContaining({
          name: "inspect-timezone",
          endpoint: "/tz/resolve",
        }),
      ]),
    );
  });

  it("includes JSON Schemas for each tool input", () => {
    for (const tool of WEB_MCP_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toMatchObject({
        type: "object",
      });
      expect(Array.isArray(tool.required)).toBe(true);
    }
  });
});

describe("WebMCP registration script", () => {
  it("guards registration on navigator.modelContext and exposes all tools", () => {
    const registration = buildWebMcpRegistrationScript();

    expect(registration).toContain('"modelContext" in navigator');
    expect(registration).toContain('typeof navigator.modelContext.provideContext !== "function"');
    expect(registration).toContain("try {");
    expect(registration).toContain("} catch {");
    expect(registration).toContain("navigator.modelContext.provideContext");
    expect(registration).toContain("get-current-time");
    expect(registration).toContain("convert-timestamp");
    expect(registration).toContain("validate-timestamp");
    expect(registration).toContain("convert-human-time");
    expect(registration).toContain("inspect-timezone");
  });

  it("is emitted on the landing page", () => {
    expect(landingScript()).toContain("navigator.modelContext.provideContext");
  });
});
