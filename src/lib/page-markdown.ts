import { SCALAR_REGISTRY_URL, SITE_URL } from "./page-constants.ts";

export function renderLandingMarkdown(nowIso: string): string {
  return `# rfc3339.date

Strict RFC3339 time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing.

Current example time: \`${nowIso}\`

## API discovery

- Base URL: ${SITE_URL}
- OpenAPI YAML: ${SITE_URL}/openapi.yaml
- OpenAPI JSON: ${SITE_URL}/openapi.json
- Scalar Registry: ${SCALAR_REGISTRY_URL}

## Example endpoints

- \`GET /now\` returns the current instant as RFC3339 UTC.
- \`GET /now/{tz}\` renders the current instant in an IANA timezone.
- \`GET /validate\` checks timestamps against RFC3339 and related profiles.
- \`GET /convert\` converts between RFC3339, Unix, HTTP-date, emaildate, GPS, TAI, Excel, and more.
- \`GET /tz/convert\` turns human event-time text into a concrete timezone-aware instant.

## Notes

- This is a fun project, not a reliable source of correct date or time.
- No authentication, no tracking, and plain text responses are first-class.`;
}

export function renderImprintMarkdown(): string {
  return `# rfc3339.date imprint

- Owner: Uwe Schwarz, Uhlandstr. 20, 67069 Ludwigshafen, Germany
- Email: mail@uweschwarz.eu
- GitHub: https://github.com/uwe-schwarz
- Scalar Registry: ${SCALAR_REGISTRY_URL}

This service is provided for development and testing use. No user tracking and no authentication.`;
}
