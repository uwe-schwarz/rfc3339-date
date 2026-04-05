import { describe, expect, it } from "vitest";
import {
  OPENAPI_JSON,
  OPENAPI_SCALAR_COMPAT_JSON,
  OPENAPI_YAML,
} from "../src/lib/openapi.generated";

describe("openapi document", () => {
  it("does not include website page routes", () => {
    expect(OPENAPI_YAML).not.toContain("\n  /:");
    expect(OPENAPI_YAML).not.toContain("\n  /docs:");
    expect(OPENAPI_YAML).not.toContain("\n  /imprint:");
    expect(OPENAPI_YAML).not.toContain("\n  /openapi.yaml:");
    expect(OPENAPI_YAML).not.toContain("\n  /openapi.json:");
    expect(OPENAPI_YAML).not.toContain("\n  /openapi.scalar.json:");
  });

  it("generates scalar import artifacts", () => {
    expect(OPENAPI_JSON).toContain('"openapi": "3.1.0"');
    expect(OPENAPI_SCALAR_COMPAT_JSON).toContain('"openapi": "3.0.3"');
    expect(OPENAPI_SCALAR_COMPAT_JSON).not.toContain('"x-runtime"');
  });

  it("includes the new developer ux routes", () => {
    const documentedRoutes = [
      "/parse",
      "/format",
      "/diff",
      "/add",
      "/excel/serial-to-iso",
      "/excel/iso-to-serial",
      "/iso-week",
      "/iso-week/start-end",
      "/http-date",
      "/lint/iso",
      "/validate-local",
      "/tz/resolve",
    ];

    for (const route of documentedRoutes) {
      expect(OPENAPI_YAML).toContain(`\n  ${route}:`);
      expect(OPENAPI_JSON).toContain(`"${route}"`);
    }
  });
});
