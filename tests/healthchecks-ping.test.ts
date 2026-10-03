import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { postPing, runHealthcheck } from "../scripts/healthchecks-ping.mjs";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));

const directories: string[] = [];
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "healthchecks-test-"));
  directories.push(directory);
  return {
    stateFile: join(directory, "state"),
    environment: { HEALTHCHECKS_PING_URL: "https://healthchecks.example/existing-secret" },
    transport: vi.fn((_url: string, _environment: unknown) => true),
  };
}
afterEach(() =>
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true })),
);

describe("maintenance Healthchecks lifecycle", () => {
  it.each(["success", "fail"])(
    "sends one start and one %s, refusing duplicate or contradictory results",
    (action) => {
      const options = fixture();
      runHealthcheck({ ...options, action: "start" });
      runHealthcheck({ ...options, action });
      expect(options.transport.mock.calls.map(([url]) => url)).toEqual([
        `${options.environment.HEALTHCHECKS_PING_URL}/start`,
        options.environment.HEALTHCHECKS_PING_URL + (action === "fail" ? "/fail" : ""),
      ]);
      expect(() => runHealthcheck({ ...options, action: "start" })).toThrow(/already exists/);
      for (const terminal of ["success", "fail"]) {
        expect(() => runHealthcheck({ ...options, action: terminal })).toThrow(/already attempted/);
      }
      expect(options.transport).toHaveBeenCalledTimes(2);
      expect(readFileSync(options.stateFile, "utf8")).not.toContain("existing-secret");
    },
  );

  it("refuses a terminal ping without a confirmed start", () => {
    const options = fixture();
    expect(() => runHealthcheck({ ...options, action: "success" })).toThrow(/no confirmed start/);
    expect(options.transport).not.toHaveBeenCalled();
  });

  it("refuses to complete a run against a different check", () => {
    const options = fixture();
    runHealthcheck({ ...options, action: "start" });
    expect(() =>
      runHealthcheck({
        ...options,
        action: "success",
        environment: { HEALTHCHECKS_PING_URL: "https://healthchecks.example/other-secret" },
      }),
    ).toThrow(/no confirmed start/);
    expect(options.transport).toHaveBeenCalledTimes(1);
  });

  it.each(["start", "success"])(
    "does not retry ambiguous %s delivery or expose a transport exception",
    (action) => {
      const options = fixture();
      if (action === "success") runHealthcheck({ ...options, action: "start" });
      options.transport.mockImplementation(() => {
        throw new Error(options.environment.HEALTHCHECKS_PING_URL);
      });
      expect(() => runHealthcheck({ ...options, action })).toThrow(/^Healthchecks ping failed;/);
      const count = options.transport.mock.calls.length;
      expect(() => runHealthcheck({ ...options, action })).toThrow();
      expect(() => runHealthcheck({ ...options, action: "fail" })).toThrow();
      expect(options.transport).toHaveBeenCalledTimes(count);
    },
  );

  it.each([
    undefined,
    "",
    "http://example.test/secret",
    "https://example.test/secret?create=1",
    "https://example.test/secret/start",
  ])("fails closed on missing or invalid configuration", (value) => {
    const options = fixture();
    expect(() =>
      runHealthcheck({
        ...options,
        environment: { HEALTHCHECKS_PING_URL: value },
        action: "start",
      }),
    ).toThrow(/HEALTHCHECKS_PING_URL/);
    expect(options.transport).not.toHaveBeenCalled();
  });
});

describe("Healthchecks transport", () => {
  it("POSTs with bounded timeouts and keeps the URL out of arguments and child environment", () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: "200" } as ReturnType<
      typeof spawnSync
    >);
    const url = "https://healthchecks.example/existing-secret/start";
    expect(postPing(url, { PATH: "/usr/bin", HEALTHCHECKS_PING_URL: url })).toBe(true);
    const [command, args, options] = vi.mocked(spawnSync).mock.calls.at(-1)!;
    expect(command).toBe("curl");
    expect(args).toEqual([
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
    ]);
    expect(options).toMatchObject({
      input: `url = ${JSON.stringify(url)}\n`,
      env: { PATH: "/usr/bin" },
      timeout: 16000,
      stdio: ["pipe", "pipe", "ignore"],
    });
    expect(options?.env).not.toHaveProperty("HEALTHCHECKS_PING_URL");
  });

  it.each([
    [0, "302"],
    [0, "403"],
    [0, "500"],
    [28, "000"],
    [null, ""],
  ])(
    "rejects redirects, rejected auth, server errors and uncertain delivery (%s/%s)",
    (status, stdout) => {
      vi.mocked(spawnSync).mockReturnValue({ status, stdout } as ReturnType<typeof spawnSync>);
      expect(postPing("https://healthchecks.example/existing-secret", {})).toBe(false);
    },
  );
});
