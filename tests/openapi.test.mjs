import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// A valid but stale artifact must stop publishing, without rewriting it.
test("OpenAPI consistency rejects each stale download without changing files", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "rfc3339-openapi-"));
  const script = fileURLToPath(new URL("../scripts/update-openapi.mjs", import.meta.url));
  const run = (...args) =>
    spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
  try {
    await mkdir(join(cwd, "public"));
    await writeFile(
      join(cwd, "public/openapi.json"),
      JSON.stringify({
        openapi: "3.1.0",
        info: { title: "Contract", version: "1.0.0" },
        paths: {},
      }),
    );
    assert.equal(run().status, 0);
    assert.equal(run("--check").status, 0);
    for (const name of ["openapi.yaml", "openapi.scalar.json"]) {
      const file = join(cwd, "public", name);
      const stale = (await readFile(file, "utf8")).replace("Contract", "Old contract");
      await writeFile(file, stale);
      const result = run("--check");
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(name));
      assert.equal(await readFile(file, "utf8"), stale);
      assert.equal(run().status, 0);
    }
    assert.equal(run("--check").status, 0);
  } finally {
    await rm(cwd, { recursive: true });
  }
});
