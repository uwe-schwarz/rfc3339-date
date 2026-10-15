import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import app from "../src/index.ts";

// Use the same contracts against workerd with RFC3339_TEST_URL=http://127.0.0.1:4321.
const liveUrl = process.env.RFC3339_TEST_URL;
const env = {
  ASSETS: {
    fetch: async (request: Request) =>
      new Response(
        await readFile(
          fileURLToPath(new URL(`../public${new URL(request.url).pathname}`, import.meta.url).href),
        ),
      ),
  },
} as unknown as Env;
const request = (path: string, init?: RequestInit) =>
  liveUrl
    ? fetch(new URL(path, liveUrl), init)
    : Promise.resolve(app.request(`http://localhost${path}`, init, env));

async function json(path: string) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  return response.json() as Promise<any>;
}

test("negotiated pages retain headers, HEAD and fresh Markdown time", async () => {
  for (const path of ["/", "/imprint"]) {
    const html = await request(path);
    assert.equal(html.status, 200);
    assert.match(html.headers.get("content-type")!, /text\/html/);
    assert.equal(html.headers.get("vary"), "Accept");
    assert.equal(html.headers.get("x-content-type-options"), "nosniff");
    assert.match(html.headers.get("link")!, /openapi/);
    const markdown = await request(path, { headers: { accept: "text/markdown" } });
    assert.equal(markdown.status, 200);
    assert.match(markdown.headers.get("content-type")!, /text\/markdown/);
    assert.ok(Number(markdown.headers.get("x-markdown-tokens")) > 0);
    const body = await markdown.text();
    if (path === "/") {
      const timestamp = body.match(/Current example time: `([^`]+)`/)?.[1];
      assert.ok(timestamp);
      assert.ok(Math.abs(Date.now() - Date.parse(timestamp)) < 10000);
    }
    const head = await request(path, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  }
  for (const path of ["/missing", "/imprint/", "/index.html", "/imprint.html", "/docs"]) {
    assert.equal((await request(path)).status, 404, path);
  }
});

test("known API answers, invalid input and DST gaps/folds", async () => {
  const converted = await request("/convert?value=1700000000&in=unix&out=rfc3339&precision=0");
  assert.equal(await converted.text(), "2023-11-14T22:13:20Z");
  const valid = await json("/validate?value=2026-02-25T19:17:03Z&json=1");
  assert.equal(valid.valid, true);
  const invalid = await json("/validate?value=2026-02-30T19:17:03Z&json=1");
  assert.equal(invalid.valid, false);
  assert.equal((await request("/convert?value=not-a-date&in=rfc3339")).status, 400);
  const human = await json(
    "/tz/convert?value=5pm%20DST&from=Europe%2FBerlin&to=UTC&base=2026-06-01T12:00:00Z&json=1",
  );
  assert.equal(human.instant.rfc3339z, "2026-06-01T15:00:00Z");
  for (const [local, status, count] of [
    ["2026-03-29T02:30:00", "invalid", 0],
    ["2026-10-25T02:15:00", "ambiguous", 2],
  ] as const) {
    const result = await json(`/validate-local?local=${local}&tz=Europe%2FBerlin`);
    assert.equal(result.status, status);
    assert.equal(result.candidates.length, count);
  }
  const fold = await json(
    "/add?ts=2026-10-25T01:30:00Z&duration=PT0S&tz=Europe%2FBerlin&mode=wall&json=1",
  );
  assert.equal(fold.result, "2026-10-25T01:30:00Z");
  assert.equal(
    await (await request("/tz/resolve?name=W.%20Europe%20Standard%20Time")).text(),
    "Europe/Berlin",
  );
  assert.equal((await request("/tz/resolve?name=__proto__")).status, 404);
  assert.equal((await request("/mcp", { method: "GET" })).status, 405);
  assert.equal((await request("/mcp", { method: "OPTIONS" })).status, 204);
  assert.deepEqual(await json("/health"), { status: "ok" });
  for (const path of [
    "/now?json=1",
    "/leapseconds",
    "/.well-known/api-catalog",
    "/.well-known/agent-skills/index.json",
    "/.well-known/mcp/server-card.json",
  ]) {
    assert.equal((await request(path)).status, 200, path);
  }
});

test("MCP initialization, dispatch, invalid protocol and origin", async () => {
  const rpc = (body: unknown, headers = {}) =>
    request("/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  const init = await rpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-11-25" },
  });
  assert.equal(((await init.json()) as any).result.protocolVersion, "2025-11-25");
  const tool = await rpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "convert-timestamp",
      arguments: { value: "1700000000", in: "unix", out: "rfc3339", precision: 0 },
    },
  });
  const result = (await tool.json()) as any;
  assert.equal(result.result.isError, undefined);
  assert.match(JSON.stringify(result.result), /2023-11-14T22:13:20/);
  assert.equal(
    (
      await rpc(
        { jsonrpc: "2.0", id: 3, method: "tools/list" },
        { "mcp-protocol-version": "1999-01-01" },
      )
    ).status,
    400,
  );
  assert.equal((await rpc([])).status, 400);
  assert.equal(
    (
      await rpc(
        { jsonrpc: "2.0", id: 4, method: "tools/list" },
        { origin: "https://untrusted.example" },
      )
    ).status,
    403,
  );
});

test(
  "workerd serves static assets directly with the existing media types",
  { skip: !liveUrl },
  async () => {
    for (const [path, type] of [
      ["/styles.css", "text/css"],
      ["/fonts/geist-pixel-line.woff2", "font/woff2"],
      ["/fonts/geist-pixel-square.woff2", "font/woff2"],
      ["/fonts/geist-mono-regular.woff2", "font/woff2"],
      ["/openapi.json", "application/json"],
      ["/openapi.scalar.json", "application/json"],
      ["/openapi.yaml", "application/yaml"],
    ]) {
      const response = await request(path);
      assert.equal(response.status, 200, path);
      assert.ok(response.headers.get("content-type")?.includes(type!), path);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    }
  },
);
