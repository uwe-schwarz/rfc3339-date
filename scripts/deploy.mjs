import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
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
  // Move every dependency to its latest release, including majors; pnpm-workspace.yaml keeps the release-age policy.
  run("pnpm", ["update", "--latest"]);
  run("pnpm", ["run", "checks"]);
  run("pnpm", ["exec", "cf", "deploy", ...args.filter((arg) => arg !== "--")]);
}

// cf does not read .env.local; fall back to the private fleet automation token.
function loadAutomationToken(env) {
  const tokenFile = join(homedir(), "private/vps/cloudflare/automation-api-token");
  if (!env.CLOUDFLARE_API_TOKEN && existsSync(tokenFile)) {
    env.CLOUDFLARE_API_TOKEN = readFileSync(tokenFile, "utf8").trim();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadAutomationToken(process.env);
  deploy({ args: process.argv.slice(2) });
}
