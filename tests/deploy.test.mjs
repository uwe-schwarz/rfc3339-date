import { test } from "node:test";
import assert from "node:assert/strict";
import { deploy } from "../scripts/deploy.mjs";

test("deployment updates tools locally, validates, then uploads", () => {
  const calls = [];
  deploy({ env: {}, args: ["--", "--dry-run"], run: (...call) => calls.push(call) });
  assert.deepEqual(calls, [
    ["pnpm", ["update", "--dev"]],
    ["pnpm", ["run", "checks"]],
    ["pnpm", ["exec", "wrangler", "deploy", "--dry-run"]],
  ]);
});

test("failed update or validation stops before upload", () => {
  for (const failAt of [1, 2]) {
    let calls = 0;
    assert.throws(
      () =>
        deploy({
          env: {},
          run: () => {
            if (++calls === failAt) throw new Error("failed");
          },
        }),
      /failed/,
    );
    assert.equal(calls, failAt);
  }
});

test("CI cannot update dependencies or deploy", () => {
  for (const env of [{ CI: "true" }, { WORKERS_CI: "1" }, { CF_PAGES: "1" }]) {
    assert.throws(
      () => deploy({ env, run: () => assert.fail("Unexpected command") }),
      /Deploy locally/,
    );
  }
});
