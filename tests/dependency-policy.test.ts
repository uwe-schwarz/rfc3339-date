import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

function readMinimumReleaseAgeExcludes(workspace: string): string[] {
  const parsed = parse(workspace) as { minimumReleaseAgeExclude?: unknown };
  const excludes = parsed.minimumReleaseAgeExclude;
  if (!Array.isArray(excludes)) return [];

  return excludes.filter((entry): entry is string => typeof entry === "string");
}

describe("dependency release-age policy", () => {
  it("does not broadly exempt deploy tooling from minimum release age", () => {
    const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
    const excludes = readMinimumReleaseAgeExcludes(workspace);

    expect(excludes).not.toContain("wrangler");
    expect(excludes).not.toContain("miniflare");
  });

  it("normalizes quoted YAML scalars before checking package names", () => {
    const excludes = readMinimumReleaseAgeExcludes(
      [
        "minimumReleaseAgeExclude:",
        '  - "wrangler"',
        "  - 'miniflare'",
        "  - wrangler@4.100.0",
      ].join("\n"),
    );

    expect(excludes).toEqual(["wrangler", "miniflare", "wrangler@4.100.0"]);
  });

  it("accepts YAML-indented release-age list entries", () => {
    const excludes = readMinimumReleaseAgeExcludes(
      [
        "minimumReleaseAgeExclude:",
        "    - wrangler",
        "    - miniflare@4.20260611.0",
      ].join("\n"),
    );

    expect(excludes).toEqual(["wrangler", "miniflare@4.20260611.0"]);
  });

  it("accepts inline comments on the release-age key", () => {
    const excludes = readMinimumReleaseAgeExcludes(
      [
        "minimumReleaseAgeExclude: # temporary allowlist",
        "  - wrangler",
      ].join("\n"),
    );

    expect(excludes).toEqual(["wrangler"]);
  });

  it("accepts flow-style release-age list entries", () => {
    const excludes = readMinimumReleaseAgeExcludes(
      "minimumReleaseAgeExclude: [wrangler, miniflare]",
    );

    expect(excludes).toEqual(["wrangler", "miniflare"]);
  });
});
