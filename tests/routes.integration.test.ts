import { describe, expect, it } from "vitest";
import app from "../src/index";

const FIXED_ISO = "2026-02-26T12:34:56.789Z";

function makeAssetEnv(body = "asset", status = 200): Env {
  return {
    ASSETS: {
      fetch: async () => new Response(body, { status, headers: { "content-type": "text/plain" } }),
    },
  } as unknown as Env;
}

function request(path: string, init?: RequestInit, env?: Env): Promise<Response> {
  return Promise.resolve(app.request(`http://localhost${path}`, init, env as never));
}

describe("all routes", () => {
  it("serves page and static routes", async () => {
    const landing = await request("/");
    expect(landing.status).toBe(200);
    expect(landing.headers.get("content-type")).toContain("text/html");

    const docs = await request("/docs");
    expect(docs.status).toBe(200);
    expect(docs.headers.get("content-security-policy")).toContain("default-src 'self'");

    const imprint = await request("/imprint");
    expect(imprint.status).toBe(200);

    const openapi = await request("/openapi.yaml");
    expect(openapi.status).toBe(200);
    expect(await openapi.text()).toContain("openapi: 3.1.0");

    const styles = await request("/styles.css");
    expect(styles.status).toBe(200);
    expect(styles.headers.get("content-type")).toContain("text/css");

    const fontLine = await request("/fonts/geist-pixel-line.woff2");
    const fontSquare = await request("/fonts/geist-pixel-square.woff2");
    const fontMono = await request("/fonts/geist-mono-regular.woff2");
    expect(fontLine.status).toBe(200);
    expect(fontSquare.status).toBe(200);
    expect(fontMono.status).toBe(200);
    expect((await fontLine.arrayBuffer()).byteLength).toBeGreaterThan(100);
    expect((await fontSquare.arrayBuffer()).byteLength).toBeGreaterThan(100);
    expect((await fontMono.arrayBuffer()).byteLength).toBeGreaterThan(100);

    const rapidocAsset = await request("/rapidoc/rapidoc-min.js", undefined, makeAssetEnv("js"));
    expect(rapidocAsset.status).toBe(200);
    expect(await rapidocAsset.text()).toBe("js");

    const rapidocMissing = await request("/rapidoc/missing.js", undefined, makeAssetEnv("", 404));
    expect(rapidocMissing.status).toBe(404);
  });

  it("serves time and validation routes", async () => {
    const now = await request(`/now?fixed=${encodeURIComponent(FIXED_ISO)}&json=1`);
    expect(now.status).toBe(200);
    const nowJson = (await now.json()) as { now: string; tz: string };
    expect(nowJson.now).toBe(FIXED_ISO);
    expect(nowJson.tz).toBe("UTC");

    const nowZone = await request(`/now/Europe%2FBerlin?fixed=${encodeURIComponent(FIXED_ISO)}`);
    expect(nowZone.status).toBe(200);
    expect(await nowZone.text()).toContain("2026-02-26T");

    const validateOk = await request(`/validate?value=${encodeURIComponent(FIXED_ISO)}&json=1`);
    expect(validateOk.status).toBe(200);
    const validateOkJson = (await validateOk.json()) as { valid: boolean };
    expect(validateOkJson.valid).toBe(true);

    const validateMissing = await request("/validate");
    expect(validateMissing.status).toBe(400);

    const validateBatch = await request("/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: "rfc3339",
        items: [{ value: FIXED_ISO }, { value: "not-a-date" }],
      }),
    });
    expect(validateBatch.status).toBe(200);
    const validateBatchJson = (await validateBatch.json()) as { results: Array<{ valid: boolean }> };
    expect(validateBatchJson.results).toHaveLength(2);

    const validateBadBody = await request("/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [] }),
    });
    expect(validateBadBody.status).toBe(400);
  });

  it("serves conversion routes", async () => {
    const canonical = await request(
      `/canonical?value=${encodeURIComponent(FIXED_ISO)}&out=rfc3339&json=1`,
    );
    expect(canonical.status).toBe(200);
    const canonicalJson = (await canonical.json()) as { value_out: string };
    expect(canonicalJson.value_out).toContain("2026-02-26T12:34:56");

    const canonicalMissing = await request("/canonical");
    expect(canonicalMissing.status).toBe(400);

    const convert = await request("/convert?value=1700000000&in=unix&out=rfc3339&json=1");
    expect(convert.status).toBe(200);
    const convertJson = (await convert.json()) as { out: string; value_out: string };
    expect(convertJson.out).toBe("rfc3339");
    expect(convertJson.value_out).toContain("T");

    const convertBad = await request("/convert?value=not-a-date&in=rfc3339&out=unix");
    expect(convertBad.status).toBe(400);

    const round = await request(
      `/round?value=${encodeURIComponent(FIXED_ISO)}&in=rfc3339&unit=hour&mode=floor&out=rfc3339&json=1`,
    );
    expect(round.status).toBe(200);
    const roundJson = (await round.json()) as { notes: string[] };
    expect(roundJson.notes[0]).toContain("mode=floor");

    const roundBad = await request(
      `/round?value=${encodeURIComponent(FIXED_ISO)}&in=rfc3339&unit=invalid`,
    );
    expect(roundBad.status).toBe(400);
  });

  it("serves timezone and dataset routes", async () => {
    const tzList = await request("/tz?q=berlin&limit=5");
    expect(tzList.status).toBe(200);
    const tzListJson = (await tzList.json()) as { zones: Array<{ id: string }> };
    expect(Array.isArray(tzListJson.zones)).toBe(true);

    const tzOffset = await request(
      `/tz/Europe%2FBerlin/offset?at=${encodeURIComponent(FIXED_ISO)}&json=1`,
    );
    expect(tzOffset.status).toBe(200);
    const tzOffsetJson = (await tzOffset.json()) as { zone: string; offset: string };
    expect(tzOffsetJson.zone).toBe("Europe/Berlin");
    expect(tzOffsetJson.offset).toMatch(/^[+-]\d\d:\d\d|Z$/);

    const tzOffsetBad = await request("/tz/Europe%2FBerlin/offset?at=invalid");
    expect(tzOffsetBad.status).toBe(400);

    const tzTransitionsMissing = await request("/tz/Europe%2FBerlin/transitions");
    expect(tzTransitionsMissing.status).toBe(400);

    const tzTransitions = await request(
      "/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2026-12-31T00:00:00Z&granularity=hour&refine=s",
    );
    expect(tzTransitions.status).toBe(200);
    const tzTransitionsJson = (await tzTransitions.json()) as { transitions: unknown[] };
    expect(Array.isArray(tzTransitionsJson.transitions)).toBe(true);

    const leapSeconds = await request("/leapseconds");
    expect(leapSeconds.status).toBe(200);
    const leapSecondsJson = (await leapSeconds.json()) as { version: string; entries: unknown[] };
    expect(leapSecondsJson.version).toContain("IERS");
    expect(leapSecondsJson.entries.length).toBeGreaterThan(0);

    const leapSecondsBadVersion = await request("/leapseconds?version=bogus");
    expect(leapSecondsBadVersion.status).toBe(404);
  });
});
