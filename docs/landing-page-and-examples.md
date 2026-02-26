1. Simple API-spec page + “free” badge + imprint + auto dark/light

Where to host it (no payments)

Cloudflare Worker is fine for both the API and docs. Do it as:
• / → landing/docs page (HTML)
• /openapi.yaml → the raw spec
• /docs → rendered OpenAPI (Swagger UI or Redoc)
• /imprint → imprint page (or embed in /)

Implementation shape (Worker)
• Serve one static HTML with:
• a header (“rfc3339.date”)
• a “FREE / no-auth / no-tracking” badge row
• quick curl examples
• links: /docs, /openapi.yaml, /imprint
• Dark/light mode:
• CSS via prefers-color-scheme (automatic)
• no JS needed for theming

Suggested minimal HTML/CSS (concept)
• Use system fonts, high contrast, no gradients.
• Colors:
• light: background #fff, text #111
• dark: background #0b0d12, text #e8eaf0
• Badge chips with subtle borders.
• Put imprint at the bottom of / plus standalone /imprint.

Swagger UI / Redoc
• Swagger UI is heavy-ish but acceptable for a “silly project”.
• Redoc is typically simpler for read-only docs.

In Worker: just serve an HTML that loads the JS from a CDN and points it at /openapi.yaml.

⸻

2. Excel “obscure conversions” list?

If you mean Excel’s own serial-number-to-components conversions (month/year/day/hour/minute/second etc.): that’s not obscure—Excel documents these as standard date/time functions (e.g., MONTH, YEAR, DAY, HOUR, MINUTE, SECOND, etc.). ￼

If you mean “weird” Excel date systems behavior worth encoding into your API:
• 1900 vs 1904 date systems (different epochs) ￼
• The infamous 1900 leap-year bug (serial 60 = 1900-02-29) ￼

Those two are the main landmines. There isn’t a single canonical “obscure Excel conversions list” beyond “Excel date/time functions reference” + these epoch quirks. So: keep your Excel conversions as specified (excel1900 + excel1904), add explicit behavior for serial 60 in excel1900, and you’re good.

⸻

3. Examples (curl) for the API + exotic stuff

Time (plain text)

curl https://rfc3339.date/now
curl "https://rfc3339.date/now?precision=9"
curl "https://rfc3339.date/now/Europe%2FBerlin?precision=3"

Validation

curl "https://rfc3339.date/validate?value=2026-02-25T20:17:03+01:00&profile=rfc3339&mode=strict&json=1"
curl "https://rfc3339.date/validate?value=2026-02-25 20:17:03&profile=rfc3339&mode=strict&json=1" # should fail (missing 'T')
curl "https://rfc3339.date/validate?value=20260225T201703+0100&profile=iso8601:basic&mode=strict&json=1"

Canonicalize

curl "https://rfc3339.date/canonical?value=2026-02-25T20:17:03+01:00&profile=rfc3339"

# -> 2026-02-25T19:17:03Z

Convert: Unix ↔ RFC3339

curl "https://rfc3339.date/convert?value=1700000000&in=unix&out=rfc3339"
curl "https://rfc3339.date/convert?value=2026-02-25T19:17:03Z&in=rfc3339&out=unixms"

Convert: HTTP-date + RFC5322 email date

curl "https://rfc3339.date/convert?value=Sun,%2006%20Nov%201994%2008:49:37%20GMT&in=httpdate&out=rfc3339"
curl "https://rfc3339.date/convert?value=Tue,%2015%20Nov%201994%2008:12:31%20-0500&in=emaildate&out=rfc3339"

Convert: NTP (64-bit seconds.fraction)

Represent NTP as seconds:fraction (hex) or seconds.fraction (decimal). Pick one and document it; hex is common for debugging.

curl "https://rfc3339.date/convert?value=0x83AA7E80:0x00000000&in=ntp&out=rfc3339"

Convert: Excel

# excel1900 serial 1 -> 1900-01-01

curl "https://rfc3339.date/convert?value=1&in=excel1900&out=rfc3339"

# excel1900 serial 60 -> 1900-02-29 (the intentional bug-compat behavior) [oai_citation:3‡Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/wrongly-assumes-1900-is-leap-year?utm_source=chatgpt.com)

curl "https://rfc3339.date/convert?value=60&in=excel1900&out=rfc3339"

# excel1904 serial 0/1 semantics: document explicitly per your chosen convention; Excel uses 1904 system with different base. [oai_citation:4‡Microsoft Support](https://support.microsoft.com/en-us/office/date-systems-in-excel-e7fe7167-48a9-4b96-bb53-5612a800b487?utm_source=chatgpt.com)

curl "https://rfc3339.date/convert?value=39267&in=excel1904&out=rfc3339"

Convert: GPS / TAI (requires leap second dataset)

curl "https://rfc3339.date/leapseconds"
curl "https://rfc3339.date/convert?value=0&in=gps&out=rfc3339&leapdata=latest"
curl "https://rfc3339.date/convert?value=2026-02-25T19:17:03Z&in=rfc3339&out=tai&leapdata=latest"

Convert: JD / MJD

curl "https://rfc3339.date/convert?value=2460000.5&in=jd&out=rfc3339"
curl "https://rfc3339.date/convert?value=60000&in=mjd&out=rfc3339"

Timezone transitions (DST boundaries)

curl "https://rfc3339.date/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z&granularity=hour&refine=s"

⸻

4. Test vectors pack (copy/paste-able)

RFC3339 valid
• 2026-02-25T19:17:03Z
• 2026-02-25T19:17:03.0Z
• 2026-02-25T19:17:03.482Z
• 2026-02-25T20:17:03+01:00
• 2026-12-31T23:59:59-08:00

RFC3339 invalid (strict)
• 2026-02-25 19:17:03Z (space instead of T)
• 2026-02-25T19:17Z (missing seconds)
• 2026-02-25T19:17:03+0100 (offset missing colon)
• 2026-02-25T19:17:03+01 (offset incomplete)
• 2026-02-25T19:17:03.1234567890Z (fraction > 9 digits)
• 2026-02-30T19:17:03Z (invalid date)

ISO8601 “basic” examples (for iso8601:basic)
• 20260225T191703Z
• 20260225T201703+0100

HTTP-date (IMF-fixdate)
• Sun, 06 Nov 1994 08:49:37 GMT

RFC5322 email date
• Tue, 15 Nov 1994 08:12:31 -0500

Excel landmines
• excel1900 1 → 1900-01-01
• excel1900 59 → 1900-02-28
• excel1900 60 → 1900-02-29 (bug-compat) ￼
• excel1900 61 → 1900-03-01
• excel1900 vs excel1904 delta = 1462 days (use in tests) ￼

Timezone edge tests
• Europe/Berlin around DST start/end in 2026:
• test start=2026-03-20..2026-04-10 for an offset change
• test start=2026-10-15..2026-11-15 for the reverse change

⸻

One spec tweak I’d add (for better examples + deterministic docs)

Add support for a fixed “now” in dev/testing only:
• query: ?fixed=2026-02-25T19:17:03Z
• or header: X-Fixed-Time: ...

That makes docs/examples reproducible and makes your API a testing oracle.

If you want, I’ll update the OpenAPI YAML to include:
• /openapi.yaml endpoint
• / + /docs + /imprint HTML endpoints
• the fixed parameter + X-Fixed-Time header
• explicit ntp value format (hex vs decimal), so it’s unambiguous.
