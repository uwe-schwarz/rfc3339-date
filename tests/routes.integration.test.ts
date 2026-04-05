import { describe, expect, it } from "vitest";
import app from "../src/index";

const FIXED_ISO = "2026-02-26T12:34:56.789Z";

function request(path: string, init?: RequestInit): Promise<Response> {
  return Promise.resolve(app.request(`http://localhost${path}`, init));
}

describe("all routes", () => {
  it("serves page and static routes", async () => {
    const landing = await request("/");
    expect(landing.status).toBe(200);
    expect(landing.headers.get("content-type")).toContain("text/html");
    const landingHtml = await landing.text();
    expect(landingHtml).toContain("This is a fun project");
    expect(landingHtml).toContain('href="/openapi.json"');
    expect(landingHtml).toContain('href="/openapi.scalar.json"');

    const docs = await request("/docs");
    expect(docs.status).toBe(404);

    const imprint = await request("/imprint");
    expect(imprint.status).toBe(200);
    expect(await imprint.text()).toContain("Loading GitHub contribution stats");

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      if (String(input).includes("github.com/users/uwe-schwarz/contributions")) {
        return new Response(
          '<h2 id="js-contribution-activity-description">123 contributions in the last year</h2><table><tbody><tr><td class="ContributionCalendar-day" data-level="2" onclick="alert(1)"></td><td><script>alert(1)</script></td></tr></tbody></table>',
          { status: 200, headers: { "content-type": "text/html" } },
        );
      }
      return originalFetch(input, init);
    };

    try {
      const githubContributions = await request("/github/uwe-schwarz/contributions");
      expect(githubContributions.status).toBe(200);
      const githubJson = (await githubContributions.json()) as {
        countText: string | null;
        calendarHtml: string | null;
      };
      expect(githubJson.countText).toContain("123 contributions");
      expect(githubJson.calendarHtml).toContain('data-level="2"');
      expect(githubJson.calendarHtml).not.toContain("onclick");
      expect(githubJson.calendarHtml).not.toContain("<script");
    } finally {
      globalThis.fetch = originalFetch;
    }

    const openapi = await request("/openapi.yaml");
    expect(openapi.status).toBe(200);
    expect(await openapi.text()).toContain("openapi: 3.1.0");

    const openapiJson = await request("/openapi.json");
    expect(openapiJson.status).toBe(200);
    expect(openapiJson.headers.get("content-type")).toContain("application/json");
    expect(await openapiJson.text()).toContain('"openapi": "3.1.0"');

    const openapiScalarJson = await request("/openapi.scalar.json");
    expect(openapiScalarJson.status).toBe(200);
    expect(openapiScalarJson.headers.get("content-type")).toContain("application/json");
    expect(await openapiScalarJson.text()).toContain('"openapi": "3.0.3"');

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

    const rapidocAsset = await request("/rapidoc/rapidoc-min.js");
    expect(rapidocAsset.status).toBe(404);
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

    const nowBadPrecision = await request("/now?precision=10");
    expect(nowBadPrecision.status).toBe(400);

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
    const validateBatchJson = (await validateBatch.json()) as {
      results: Array<{ valid: boolean }>;
    };
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

    const tzListBadLimit = await request("/tz?limit=0");
    expect(tzListBadLimit.status).toBe(400);

    const tzConvert = await request(
      "/tz/convert?value=2026-05-22%2017:35%20CEST&to=America%2FNew_York&json=1",
    );
    expect(tzConvert.status).toBe(200);
    const tzConvertJson = (await tzConvert.json()) as {
      value_out: string;
      from: { kind: string };
      to: { tz: string | null; kind: string };
    };
    expect(tzConvertJson.value_out).toBe("2026-05-22T11:35:00-04:00");
    expect(tzConvertJson.from.kind).toBe("abbreviation");
    expect(tzConvertJson.to.tz).toBe("America/New_York");
    expect(tzConvertJson.to.kind).toBe("iana");

    const tzConvertRelative = await request(
      `/tz/convert?value=${encodeURIComponent("5pm DST")}&from=Europe%2FBerlin&to=America%2FNew_York&base=2026-06-01T12:00:00Z`,
    );
    expect(tzConvertRelative.status).toBe(200);
    expect(await tzConvertRelative.text()).toBe("2026-06-01T11:00:00-04:00");

    const tzConvertUtc = await request(
      "/tz/convert?value=tomorrow%203am%20CET&to=UTC&base=2026-05-21T22:30:00Z",
    );
    expect(tzConvertUtc.status).toBe(200);
    expect(await tzConvertUtc.text()).toBe("2026-05-22T02:00:00Z");

    const tzConvertCet = await request(
      "/tz/convert?value=tomorrow+5pm+PST&to=CET&base=2026-05-21T22:30:00Z&json=1",
    );
    expect(tzConvertCet.status).toBe(200);
    const tzConvertCetJson = (await tzConvertCet.json()) as {
      value_out: string;
      to: { kind: string; tz: string | null; abbreviation: string | null };
    };
    expect(tzConvertCetJson.value_out).toBe("2026-05-23T02:00:00+01:00");
    expect(tzConvertCetJson.to.kind).toBe("abbreviation");
    expect(tzConvertCetJson.to.tz).toBeNull();
    expect(tzConvertCetJson.to.abbreviation).toBe("CET");

    const tzConvertBadBase = await request(
      "/tz/convert?value=5pm%20DST&from=Europe%2FBerlin&to=America%2FNew_York&base=invalid",
    );
    expect(tzConvertBadBase.status).toBe(400);

    const tzConvertBadTargetToken = await request(
      "/tz/convert?value=2026-05-22%2017:35%20CEST&to=DST",
    );
    expect(tzConvertBadTargetToken.status).toBe(400);

    const tzConvertUnknownTargetZone = await request(
      "/tz/convert?value=2026-05-22%2017:35%20CEST&to=Bad%2FZone",
    );
    expect(tzConvertUnknownTargetZone.status).toBe(404);

    const tzConvertEmptyBase = await request(
      "/tz/convert?value=5pm%20DST&from=Europe%2FBerlin&to=America%2FNew_York&base=",
    );
    expect(tzConvertEmptyBase.status).toBe(400);

    const tzConvertEmptyPrecision = await request(
      "/tz/convert?value=2026-05-22%2017:35%20CEST&to=UTC&precision=",
    );
    expect(tzConvertEmptyPrecision.status).toBe(400);

    const tzConvertEmptyFrom = await request(
      "/tz/convert?value=2026-05-22%2017:35%20CEST&from=&to=UTC",
    );
    expect(tzConvertEmptyFrom.status).toBe(404);

    const tzConvertBadSlashZone = await request(
      "/tz/convert?value=2026-05-22%2017:35%20Bad%2FZone&to=UTC",
    );
    expect(tzConvertBadSlashZone.status).toBe(400);

    const tzConvertNegative = await request(
      "/tz/convert?value=1969-12-31%2023:59:58.500%20UTC&to=UTC&json=1",
    );
    expect(tzConvertNegative.status).toBe(200);
    const tzConvertNegativeJson = (await tzConvertNegative.json()) as {
      instant: { unix: number; unixms: number };
    };
    expect(tzConvertNegativeJson.instant.unix).toBe(-2);
    expect(tzConvertNegativeJson.instant.unixms).toBe(-1500);

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

    const tzTransitionsTooLarge = await request(
      "/tz/Europe%2FBerlin/transitions?start=1900-01-01T00:00:00Z&end=2026-01-01T00:00:00Z&granularity=minute",
    );
    expect(tzTransitionsTooLarge.status).toBe(400);
    const tzTransitionsTooLargeJson = (await tzTransitionsTooLarge.json()) as { error?: string };
    expect(tzTransitionsTooLargeJson.error).toBe("range_too_large");

    const leapSeconds = await request("/leapseconds");
    expect(leapSeconds.status).toBe(200);
    const leapSecondsJson = (await leapSeconds.json()) as { version: string; entries: unknown[] };
    expect(leapSecondsJson.version).toContain("IERS");
    expect(leapSecondsJson.entries.length).toBeGreaterThan(0);

    const leapSecondsBadVersion = await request("/leapseconds?version=bogus");
    expect(leapSecondsBadVersion.status).toBe(404);
  });
});

describe("developer UX endpoints", () => {
  it("supports parse/format/diff/add and helper utilities", async () => {
    const parse = await request("/parse?q=tomorrow%2017:00&tz=Europe%2FBerlin&json=1");
    expect(parse.status).toBe(200);
    const parseJson = (await parse.json()) as {
      instant: string;
      timezone: string;
      confidence: number;
    };
    expect(parseJson.timezone).toBe("Europe/Berlin");
    expect(parseJson.instant).toContain("T");
    expect(parseJson.confidence).toBeGreaterThan(0.5);

    const format = await request("/format?value=2026-04-04T12:00:00Z&style=http");
    expect(format.status).toBe(200);
    expect(await format.text()).toContain("GMT");

    const formatBadPrototypeStyle = await request(
      "/format?value=2026-04-04T12:00:00Z&style=constructor",
    );
    expect(formatBadPrototypeStyle.status).toBe(400);

    const diff = await request(
      "/diff?from=2026-04-04T12:00:00Z&to=2026-04-04T13:30:00Z&unit=min&json=1",
    );
    expect(diff.status).toBe(200);
    const diffJson = (await diff.json()) as { value: number; isoDuration: string };
    expect(diffJson.value).toBe(90);
    expect(diffJson.isoDuration).toBe("P0DT1H30M0S");

    const diffBadPrototypeUnit = await request(
      "/diff?from=2026-04-04T12:00:00Z&to=2026-04-04T13:30:00Z&unit=constructor",
    );
    expect(diffBadPrototypeUnit.status).toBe(400);

    const diffNanoseconds = await request(
      "/diff?from=2026-01-01T00:00:00.000000100Z&to=2026-01-01T00:00:00.000000900Z&unit=ms&json=1",
    );
    expect(diffNanoseconds.status).toBe(200);
    const diffNanosecondsJson = (await diffNanoseconds.json()) as {
      value: number;
      isoDuration: string;
    };
    expect(diffNanosecondsJson.value).toBe(0.0008);
    expect(diffNanosecondsJson.isoDuration).toBe("P0DT0H0M0.0000008S");

    const addAbsolute = await request(
      "/add?ts=2026-03-29T00:30:00Z&duration=PT1H&mode=absolute&tz=Europe%2FBerlin&json=1",
    );
    expect(addAbsolute.status).toBe(200);
    const addAbsoluteJson = (await addAbsolute.json()) as { result: string };
    expect(addAbsoluteJson.result).toBe("2026-03-29T01:30:00Z");

    const addWall = await request(
      "/add?ts=2026-03-29T01:30:00Z&duration=PT1H&mode=wall&tz=Europe%2FBerlin&json=1",
    );
    expect(addWall.status).toBe(200);
    const addWallJson = (await addWall.json()) as {
      local: string;
      ambiguity_resolution: string | null;
      chosen_candidate_index: number | null;
    };
    expect(addWallJson.local).toBe("2026-03-29T04:30:00+02:00");
    expect(addWallJson.ambiguity_resolution).toBeNull();
    expect(addWallJson.chosen_candidate_index).toBeNull();

    const addAbsoluteBadZone = await request(
      "/add?ts=2026-03-29T00:30:00Z&duration=PT1H&mode=absolute&tz=Bad%2FZone",
    );
    expect(addAbsoluteBadZone.status).toBe(404);

    const addAbsoluteCalendarUnits = await request(
      "/add?ts=2026-03-29T00:30:00Z&duration=P1M&mode=absolute&tz=UTC",
    );
    expect(addAbsoluteCalendarUnits.status).toBe(400);

    const addAbsoluteNegative = await request(
      "/add?ts=2026-03-29T00:30:00Z&duration=-PT1H&mode=absolute&tz=UTC&json=1",
    );
    expect(addAbsoluteNegative.status).toBe(200);
    const addAbsoluteNegativeJson = (await addAbsoluteNegative.json()) as { result: string };
    expect(addAbsoluteNegativeJson.result).toBe("2026-03-28T23:30:00Z");

    const addWallPreservesSubsecond = await request(
      "/add?ts=2026-03-29T00:30:59.900Z&duration=PT0.2S&mode=wall&tz=UTC",
    );
    expect(addWallPreservesSubsecond.status).toBe(200);
    expect(await addWallPreservesSubsecond.text()).toBe("2026-03-29T00:31:00Z");

    const addWallAmbiguous = await request(
      "/add?ts=2026-10-25T00:30:00Z&duration=PT0S&mode=wall&tz=Europe%2FBerlin&json=1",
    );
    expect(addWallAmbiguous.status).toBe(200);
    const addWallAmbiguousJson = (await addWallAmbiguous.json()) as {
      result: string;
      ambiguity: string | null;
      ambiguity_resolution: string | null;
      chosen_candidate_index: number | null;
      candidates: string[];
    };
    expect(addWallAmbiguousJson.result).toBe("2026-10-25T00:30:00Z");
    expect(addWallAmbiguousJson.ambiguity).toBe("ambiguous_local_time");
    expect(addWallAmbiguousJson.ambiguity_resolution).toBe("closest_to_input_instant");
    expect(addWallAmbiguousJson.chosen_candidate_index).toBe(0);
    expect(addWallAmbiguousJson.candidates).toEqual([
      "2026-10-25T00:30:00Z",
      "2026-10-25T01:30:00Z",
    ]);

    const addWallFoldPreserved = await request(
      "/add?ts=2026-10-25T01:30:00Z&duration=PT0S&mode=wall&tz=Europe%2FBerlin&json=1",
    );
    expect(addWallFoldPreserved.status).toBe(200);
    const addWallFoldPreservedJson = (await addWallFoldPreserved.json()) as {
      result: string;
      chosen_candidate_index: number | null;
    };
    expect(addWallFoldPreservedJson.result).toBe("2026-10-25T01:30:00Z");
    expect(addWallFoldPreservedJson.chosen_candidate_index).toBe(1);

    const serialToIso = await request("/excel/serial-to-iso?value=45246.5&json=1");
    expect(serialToIso.status).toBe(200);
    const serialToIsoJson = (await serialToIso.json()) as { iso: string };
    expect(serialToIsoJson.iso).toContain("T");

    const serialToIsoBadSystem = await request("/excel/serial-to-iso?value=45246.5&system=190O");
    expect(serialToIsoBadSystem.status).toBe(400);

    const isoToSerial = await request("/excel/iso-to-serial?ts=2026-04-04T12:00:00Z&json=1");
    expect(isoToSerial.status).toBe(200);
    const isoToSerialJson = (await isoToSerial.json()) as { serial: string };
    expect(Number(isoToSerialJson.serial)).toBeGreaterThan(40000);

    const isoToSerialBadSystem = await request(
      "/excel/iso-to-serial?ts=2026-04-04T12:00:00Z&system=190O",
    );
    expect(isoToSerialBadSystem.status).toBe(400);

    const week = await request("/iso-week?ts=2026-04-04T12:00:00Z&json=1");
    expect(week.status).toBe(200);
    const weekJson = (await week.json()) as { yearWeek: string; week: number };
    expect(weekJson.yearWeek).toBe("2026-W14");
    expect(weekJson.week).toBe(14);

    const weekRange = await request("/iso-week/start-end?year=2026&week=14");
    expect(weekRange.status).toBe(200);
    const weekRangeJson = (await weekRange.json()) as { start: string; end: string };
    expect(weekRangeJson.start).toBe("2026-03-30T00:00:00Z");
    expect(weekRangeJson.end).toBe("2026-04-05T23:59:59.999Z");

    const weekRangeInvalid = await request("/iso-week/start-end?year=2021&week=53");
    expect(weekRangeInvalid.status).toBe(400);

    const httpDate = await request("/http-date?ts=2026-04-04T12:00:00Z");
    expect(httpDate.status).toBe(200);
    expect(await httpDate.text()).toBe("Sat, 04 Apr 2026 12:00:00 GMT");

    const lintIso = await request("/lint/iso?value=2026-04-04T12:00:00Z&json=1");
    expect(lintIso.status).toBe(200);
    const lintIsoJson = (await lintIso.json()) as { valid: boolean; normalized: string | null };
    expect(lintIsoJson.valid).toBe(true);
    expect(lintIsoJson.normalized).toBe("2026-04-04T12:00:00Z");

    const lintIsoFractional = await request("/lint/iso?value=2026-04-05T12:00:00.123Z&json=1");
    expect(lintIsoFractional.status).toBe(200);
    const lintIsoFractionalJson = (await lintIsoFractional.json()) as { normalized: string | null };
    expect(lintIsoFractionalJson.normalized).toBe("2026-04-05T12:00:00.123Z");

    const validateLocal = await request(
      "/validate-local?local=2026-10-25T02:15:00&tz=Europe%2FBerlin",
    );
    expect(validateLocal.status).toBe(200);
    const validateLocalJson = (await validateLocal.json()) as {
      status: string;
      candidates: unknown[];
    };
    expect(validateLocalJson.status).toBe("ambiguous");
    expect(validateLocalJson.candidates.length).toBe(2);

    const tzResolve = await request("/tz/resolve?name=W.%20Europe%20Standard%20Time&json=1");
    expect(tzResolve.status).toBe(200);
    const tzResolveJson = (await tzResolve.json()) as { resolved: string };
    expect(tzResolveJson.resolved).toBe("Europe/Berlin");

    const tzResolvePrototypeAlias = await request("/tz/resolve?name=__proto__");
    expect(tzResolvePrototypeAlias.status).toBe(404);
  });

  it("uses plain text by default and json when requested on scalar helper routes", async () => {
    const parsePlain = await request("/parse?q=2026-04-04T12:00:00Z");
    expect(parsePlain.status).toBe(200);
    expect(parsePlain.headers.get("content-type")).toContain("text/plain");
    expect(await parsePlain.text()).toBe("2026-04-04T12:00:00Z");

    const parseJson = await request("/parse?q=2026-04-04T12:00:00Z", {
      headers: { accept: "application/json" },
    });
    expect(parseJson.status).toBe(200);
    expect(parseJson.headers.get("content-type")).toContain("application/json");

    const diffPlain = await request(
      "/diff?from=2026-04-04T12:00:00Z&to=2026-04-04T13:30:00Z&unit=min",
    );
    expect(diffPlain.status).toBe(200);
    expect(await diffPlain.text()).toBe("90");

    const excelPlain = await request("/excel/serial-to-iso?value=45246.5");
    expect(excelPlain.status).toBe(200);
    expect(await excelPlain.text()).toBe("2023-11-16T12:00:00.000Z");

    const weekPlain = await request("/iso-week?ts=2026-04-04T12:00:00Z");
    expect(weekPlain.status).toBe(200);
    expect(await weekPlain.text()).toBe("2026-W14");

    const lintPlain = await request("/lint/iso?value=2026-04-04T12:00:00Z");
    expect(lintPlain.status).toBe(200);
    expect(await lintPlain.text()).toBe("2026-04-04T12:00:00Z");

    const resolvePlain = await request("/tz/resolve?name=W.%20Europe%20Standard%20Time");
    expect(resolvePlain.status).toBe(200);
    expect(await resolvePlain.text()).toBe("Europe/Berlin");
  });
});
