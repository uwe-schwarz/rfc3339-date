import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function pingBase(environment) {
  const value = environment.HEALTHCHECKS_PING_URL;
  if (!value) throw new Error("HEALTHCHECKS_PING_URL is required.");
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname === "/" ||
      /\/(?:start|fail)\/?$/.test(url.pathname) ||
      /\s/.test(value) ||
      [...value].some((character) => character.charCodeAt(0) < 32)
    )
      throw new Error();
    return url.href.replace(/\/$/, "");
  } catch {
    throw new Error(
      "HEALTHCHECKS_PING_URL must be an existing HTTPS base ping URL without query parameters.",
    );
  }
}

// Pass the secret URL on stdin, never in argv or diagnostics. Do not load curlrc,
// follow redirects, retry ambiguous delivery, or retain response bodies.
export function postPing(url, environment) {
  const childEnvironment = { ...environment };
  delete childEnvironment.HEALTHCHECKS_PING_URL;
  const result = spawnSync(
    "curl",
    [
      "-q",
      "--config",
      "-",
      "--silent",
      "--output",
      "/dev/null",
      "--request",
      "POST",
      "--connect-timeout",
      "3",
      "--max-time",
      "15",
      "--proto",
      "=https",
      "--write-out",
      "%{http_code}",
    ],
    {
      input: `url = ${JSON.stringify(url)}\n`,
      encoding: "utf8",
      env: childEnvironment,
      timeout: 16000,
      stdio: ["pipe", "pipe", "ignore"],
    },
  );
  return result.status === 0 && /^2\d\d$/.test(result.stdout ?? "");
}

/**
 * @param {{ action: string, stateFile: string,
 * environment?: Record<string, string | undefined>,
 * transport?: (url: string, environment: Record<string, string | undefined>) => boolean }} options
 */
export function runHealthcheck({
  action,
  stateFile,
  environment = process.env,
  transport = postPing,
}) {
  if (!["start", "success", "fail"].includes(action) || !stateFile) {
    throw new Error(
      "Usage: node scripts/healthchecks-ping.mjs start|success|fail <run-state-file>",
    );
  }
  const base = pingBase(environment);
  const identity = createHash("sha256").update(base).digest("hex");
  if (action === "start") {
    try {
      writeFileSync(stateFile, JSON.stringify({ phase: "start-attempted", identity }), {
        flag: "wx",
        mode: 0o600,
      });
    } catch {
      throw new Error("Healthchecks start refused: run state already exists or is unavailable.");
    }
  } else {
    try {
      const state = JSON.parse(readFileSync(stateFile, "utf8"));
      if (state.phase !== "started" || state.identity !== identity) throw new Error();
      // Reserve the terminal result before sending: even a lost response must
      // not cause a duplicate or a contradictory success/fail request.
      writeFileSync(`${stateFile}.terminal`, `${action}-attempted\n`, { flag: "wx", mode: 0o600 });
    } catch {
      throw new Error(
        "Healthchecks terminal refused: no confirmed start for this check, or a terminal result was already attempted.",
      );
    }
  }
  const url = action === "success" ? base : `${base}/${action}`;
  let delivered = false;
  try {
    delivered = transport(url, environment);
  } catch {
    // Transport errors can contain the secret URL; never propagate them.
  }
  if (!delivered) {
    throw new Error(
      "Healthchecks ping failed; delivery is unconfirmed. Do not retry this run or send another terminal result.",
    );
  }
  try {
    writeFileSync(
      action === "start" ? stateFile : `${stateFile}.terminal`,
      action === "start" ? JSON.stringify({ phase: "started", identity }) : `${action}\n`,
    );
  } catch {
    throw new Error(
      "Healthchecks ping delivered but local state update failed; stop and reconcile without retrying.",
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runHealthcheck({ action: process.argv[2], stateFile: process.argv[3] });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
