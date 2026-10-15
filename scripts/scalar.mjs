import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import packageJson from "../package.json" with { type: "json" };

// Documentation tooling is downloaded only when explicitly requested.
export function runScalar(args, options = {}) {
  const result = spawnSync(
    "pnpm",
    [
      "--config.ignore-scripts=true",
      "dlx",
      `@scalar/cli@${packageJson.config.scalarCliVersion}`,
      ...args,
    ],
    { encoding: "utf8", env: process.env },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 && !options.allowFailure) {
    // Arguments can contain credentials, so never include them in errors.
    throw new Error("Scalar command failed.");
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runScalar(process.argv.slice(2));
}
