import { describe, expect, it } from "vitest";
import { OPENAPI_YAML } from "../src/lib/openapi.generated";

describe("openapi document", () => {
  it("does not include website page routes", () => {
    expect(OPENAPI_YAML).not.toContain("\n  /:");
    expect(OPENAPI_YAML).not.toContain("\n  /docs:");
    expect(OPENAPI_YAML).not.toContain("\n  /imprint:");
    expect(OPENAPI_YAML).not.toContain("\n  /openapi.yaml:");
  });
});
