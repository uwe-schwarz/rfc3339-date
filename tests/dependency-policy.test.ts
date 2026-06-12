import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function normalizeYamlScalar(value: string): string {
  const withoutComment = value.split("#")[0]?.trim() ?? "";
  const quote = withoutComment[0];
  if (
    (quote === "'" || quote === '"') &&
    withoutComment.endsWith(quote)
  ) {
    return withoutComment.slice(1, -1);
  }

  return withoutComment;
}

function readMinimumReleaseAgeExcludes(workspace: string): string[] {
  const lines = workspace.split("\n");
  const startIndex = lines.findIndex((line) => line === "minimumReleaseAgeExclude:");
  return lines
    .slice(startIndex + 1)
    .filter((line) => line.startsWith("  - "))
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter((entry): entry is string => Boolean(entry))
    .map(normalizeYamlScalar);
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
});
