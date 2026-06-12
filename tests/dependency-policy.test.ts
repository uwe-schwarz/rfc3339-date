import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

function readMinimumReleaseAgeExcludes(workspace: string): string[] {
  const parsed = parse(workspace) as { minimumReleaseAgeExclude?: unknown };
  const excludes = parsed.minimumReleaseAgeExclude;
  if (!Array.isArray(excludes)) return [];

  return excludes.filter((entry): entry is string => typeof entry === "string");
}

function globMatches(pattern: string, value: string): boolean {
  const source = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*");

  return new RegExp(`^${source}$`).test(value);
}

function broadlyExemptsPackage(selector: string, packageName: string): boolean {
  if (selector.startsWith("!")) return selector.slice(1) !== packageName;

  const versionSeparator = selector.startsWith("@")
    ? selector.indexOf("@", 1)
    : selector.indexOf("@");
  const selectorName =
    versionSeparator === -1 ? selector : selector.slice(0, versionSeparator);
  const selectorVersion =
    versionSeparator === -1 ? "" : selector.slice(versionSeparator + 1);

  if (!globMatches(selectorName, packageName)) return false;
  if (!selectorVersion) return true;

  const exactVersions = selectorVersion
    .split("||")
    .map((version) => version.trim())
    .filter(Boolean);

  return !exactVersions.every((version) =>
    /^\d+(?:\.\d+)+(?:[-+][0-9A-Za-z.-]+)?$/.test(version),
  );
}

describe("dependency release-age policy", () => {
  it("does not broadly exempt deploy tooling from minimum release age", () => {
    const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
    const excludes = readMinimumReleaseAgeExcludes(workspace);

    expect(excludes.some((entry) => broadlyExemptsPackage(entry, "wrangler"))).toBe(
      false,
    );
    expect(excludes.some((entry) => broadlyExemptsPackage(entry, "miniflare"))).toBe(
      false,
    );
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

  it("detects release-age selector patterns that match deploy tooling", () => {
    expect(broadlyExemptsPackage("wrangler*", "wrangler")).toBe(true);
    expect(broadlyExemptsPackage("miniflare@*", "miniflare")).toBe(true);
    expect(broadlyExemptsPackage("wrangler@4.100.0", "wrangler")).toBe(false);
    expect(broadlyExemptsPackage("miniflare@4.20260611.0", "miniflare")).toBe(
      false,
    );
  });

  it("detects negated release-age selector patterns that match deploy tooling", () => {
    expect(broadlyExemptsPackage("!some-package", "wrangler")).toBe(true);
    expect(broadlyExemptsPackage("!wrangler", "wrangler")).toBe(false);
    expect(broadlyExemptsPackage("!wrangler", "miniflare")).toBe(true);
  });

  it("allows exact-version disjunctions for deploy-tool exceptions", () => {
    expect(
      broadlyExemptsPackage("wrangler@4.100.0 || 4.101.0", "wrangler"),
    ).toBe(false);
    expect(broadlyExemptsPackage("wrangler@4.100.0 || *", "wrangler")).toBe(
      true,
    );
  });
});
