import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("dependency release-age policy", () => {
  it("does not broadly exempt deploy tooling from minimum release age", () => {
    const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
    const lines = workspace.split("\n");
    const startIndex = lines.findIndex((line) => line === "minimumReleaseAgeExclude:");
    const excludeLines = lines
      .slice(startIndex + 1)
      .filter((line) => line.startsWith("  - "));
    const excludes = excludeLines
      .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
      .filter((entry): entry is string => Boolean(entry));

    expect(excludes).not.toContain("wrangler");
    expect(excludes).not.toContain("miniflare");
  });
});
