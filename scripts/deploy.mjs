import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function runCommand(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed.`);
}

export function deploy({ run = runCommand, env = process.env, args = [] } = {}) {
  if (
    [env.CI, env.WORKERS_CI, env.CF_PAGES].some(
      (value) => value && value !== "false" && value !== "0",
    )
  ) {
    throw new Error(
      "Deploy locally: dependency updates and validation must finish before uploading.",
    );
  }
  // Keep compatible major versions and the release-age policy in pnpm-workspace.yaml.
  run("pnpm", ["update", "--dev"]);
  run("pnpm", ["run", "checks"]);
  run("pnpm", ["exec", "wrangler", "deploy", ...args.filter((arg) => arg !== "--")]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  deploy({ args: process.argv.slice(2) });
}
