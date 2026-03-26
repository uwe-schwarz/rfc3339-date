import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { resolveProjectPublishSlug } from "./publish-scalar-lib.mjs";

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function runScalar(args, options = {}) {
  const result = spawnSync("pnpm", ["dlx", "@scalar/cli", ...args], {
    encoding: "utf8",
    stdio: "pipe",
    env: process.env,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`Scalar command failed: scalar ${args.join(" ")}`);
  }
  return result;
}

loadEnvFile(".env.local");

const token = process.env.SCALAR_TOKEN ?? process.env.SCALAR_AGENT_KEY;
if (!token) {
  console.error("SCALAR_TOKEN is required to publish to Scalar. SCALAR_AGENT_KEY is accepted as a fallback env name.");
  process.exit(1);
}
if (!process.env.SCALAR_TOKEN && process.env.SCALAR_AGENT_KEY) {
  console.warn(
    "Using SCALAR_AGENT_KEY as a fallback. If Scalar CLI rejects it, use a personal token in SCALAR_TOKEN instead.",
  );
}

const namespace = process.env.SCALAR_NAMESPACE ?? "iq42";
const slug = process.env.SCALAR_API_SLUG ?? "rfc3339date-time-api";
const file = process.env.SCALAR_OPENAPI_FILE ?? "docs/openapi.scalar.json";
const projectSlug = process.env.SCALAR_PROJECT_SLUG ?? "rfc3339date";
const projectName = process.env.SCALAR_PROJECT_NAME ?? "rfc3339.date";
const projectConfig = process.env.SCALAR_PROJECT_CONFIG ?? "scalar.config.json";

const openapi = JSON.parse(readFileSync(file, "utf8"));
const version = openapi.info?.version;
const title = openapi.info?.title ?? "rfc3339.date — Time API";
const description =
  openapi.info?.description ??
  "RFC3339 API that exposes server time, validation, conversion, timezone, and leap-second endpoints.";

if (!version) {
  console.error(`Missing info.version in ${file}`);
  process.exit(1);
}

runScalar(["auth", "login", "--token", token]);
runScalar([
  "registry",
  "publish",
  file,
  "--namespace",
  namespace,
  "--slug",
  slug,
  "--version",
  version,
  "--force",
]);
runScalar([
  "registry",
  "update",
  namespace,
  slug,
  "--title",
  title,
  "--description",
  description,
]);

const createResult = runScalar(
  ["project", "create", "--name", projectName, "--slug", projectSlug],
  { allowFailure: true },
);
const publishProjectSlug = resolveProjectPublishSlug(
  projectSlug,
  createResult.stdout ?? "",
);
if (createResult.status !== 0) {
  console.warn(
    "Scalar project create did not succeed. Continuing with publish; this is expected if the project already exists.",
  );
} else if (publishProjectSlug !== projectSlug) {
  console.warn(
    `Scalar assigned project slug ${publishProjectSlug} instead of requested slug ${projectSlug}. Publishing to the created project.`,
  );
}

runScalar([
  "project",
  "publish",
  "--slug",
  publishProjectSlug,
  "--config",
  projectConfig,
]);
