You are building rfc3339.date as a Cloudflare Worker (wrangler). Implement the OpenAPI 3.1 spec provided below.

Constraints:

- Must run on Cloudflare Workers (free tier). No payments, no auth.
- Prefer tiny dependencies. Use Hono for routing if helpful.
- Default response should be text/plain unless Accept: application/json or query ?json=1.
- Timezone handling MUST use IANA zone names (e.g. Europe/Berlin). Reject abbreviations like CET/EST.
- Use the platform Intl.DateTimeFormat with timeZone=IANA to compute local offset and render RFC3339 with numeric offset.
- For /tz/{zone}/transitions, do NOT ship a timezone database. Instead:
  - compute transitions by scanning the requested range with a step (granularity default hour),
  - detect offset changes via Intl,
  - refine the boundary by binary searching to second or millisecond resolution (refine param).
- Validation:
  - RFC3339 strict: implement ABNF-grade checks (including offset format, mandatory 'T', allowed fractional seconds, etc).
  - ISO8601: support profiles iso8601, iso8601:strict, iso8601:extended, iso8601:basic; be explicit about what you accept.
  - Provide actionable diagnostics with code+message (and optional character index).
- Conversions:
  - Implement encodings: rfc3339, iso8601, unix (s), unixms, ntp (64-bit seconds.fraction since 1900-01-01), httpdate (IMF-fixdate), emaildate (RFC5322), gps, tai, jd, mjd, excel1900, excel1904, weekdate, ordinal, doy.
  - Use a single internal representation of an instant (Unix milliseconds + optional nanoseconds if you want).
  - For GPS/TAI conversions, include a static leap-second table shipped in code and expose it at /leapseconds. Version it as "latest" with a fixed version string in code.
  - Leap-second edge handling: accept 23:59:60 only when profile allows it; conversions must be deterministic and documented in code comments.
- Security:
  - Add basic hardening headers (CSP not required for API, but set: X-Content-Type-Options: nosniff).
  - /now must be Cache-Control: no-store; dataset endpoints can be cached with max-age.
- Provide:
  - worker entry (src/index.ts)
  - wrangler.toml
  - package.json
  - minimal README with examples (curl)
  - unit tests where reasonable (vitest) for validators and conversions.

Implementation recommendation:

- Use Hono + TypeScript.
- Avoid heavy date libraries. Use built-in Date + Intl. For parsing/formatting, implement minimal helpers.

Now implement the service per the spec below, keeping endpoints and response shapes compatible.
(Paste the OpenAPI YAML after this line.)
