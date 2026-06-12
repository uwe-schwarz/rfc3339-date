import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface PackageJson {
  scripts?: Record<string, string>;
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;
}

describe("package scripts", () => {
  it("uses pnpm dlx for Scalar project config validation", () => {
    const script = readPackageJson().scripts?.["lint:scalar:project"];

    expect(script).toBe(
      "pnpm dlx @scalar/cli project check-config scalar.config.json",
    );
  });
});
