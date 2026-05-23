import { spawn } from "node:child_process";

const child = spawn(
  "wrangler",
  [
    "dev",
    "--ip",
    "127.0.0.1",
    "--port",
    "4321",
    "--local",
    "--log-level",
    "warn",
    "--show-interactive-dev-session=false",
  ],
  {
    env: { ...process.env, CI: "1" },
    shell: process.platform === "win32",
    stdio: "inherit",
  },
);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", forwardSignal);
process.on("SIGTERM", forwardSignal);

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(signal === "SIGINT" ? 130 : 143);
    return;
  }

  process.exit(code ?? 1);
});
