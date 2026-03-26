import { describe, expect, it } from "vitest";

import {
  extractCreatedProjectSlug,
  resolveProjectPublishSlug,
  shouldPublishProject,
} from "../scripts/publish-scalar-lib.mjs";

describe("extractCreatedProjectSlug", () => {
  it("reads the project slug from Scalar CLI output", () => {
    const output = [
      "Project uid: \u001b[36mabc123\u001b[39m",
      "Project slug: \u001b[36mrfc3339date-j2huc\u001b[39m",
    ].join("\n");

    expect(extractCreatedProjectSlug(output)).toBe("rfc3339date-j2huc");
  });

  it("returns null when the CLI output has no created slug", () => {
    expect(extractCreatedProjectSlug("Project already exists")).toBeNull();
  });

  it("returns null when the slug line only contains whitespace", () => {
    expect(extractCreatedProjectSlug("Project slug:   \n")).toBeNull();
  });
});

describe("resolveProjectPublishSlug", () => {
  it("uses the created slug when Scalar assigns a fallback slug", () => {
    const output = "Project slug: rfc3339date-j2huc";

    expect(resolveProjectPublishSlug("rfc3339date", output)).toBe(
      "rfc3339date-j2huc",
    );
  });

  it("keeps the requested slug when no created slug is present", () => {
    expect(resolveProjectPublishSlug("rfc3339date", "")).toBe("rfc3339date");
  });
});

describe("shouldPublishProject", () => {
  it("defaults to skipping project publishing", () => {
    expect(shouldPublishProject(undefined)).toBe(false);
    expect(shouldPublishProject("")).toBe(false);
  });

  it("accepts explicit opt-in values", () => {
    expect(shouldPublishProject("1")).toBe(true);
    expect(shouldPublishProject("true")).toBe(true);
    expect(shouldPublishProject("yes")).toBe(true);
    expect(shouldPublishProject("TRUE")).toBe(true);
    expect(shouldPublishProject("YES")).toBe(true);
  });

  it("rejects explicit opt-out values", () => {
    expect(shouldPublishProject("0")).toBe(false);
  });
});
