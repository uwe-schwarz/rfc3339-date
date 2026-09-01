---
name: rfc3339-date
description: >
  Work with timestamps via rfc3339.date MCP tools. Canonical hub Instant
  { rfc3339z, unix, unixms }. Use when you need current time, RFC3339 or
  ISO-8601 validation, encoding conversion, human-time parse, or timezone
  conversion. Call the tools; never invent API data.
---

# rfc3339.date

Canonical hub:

```
Instant = { rfc3339z: string, unix: number, unixms: number }
```

Call the MCP tools. Do not invent timestamps, offsets, encodings, or conversion results.

## When to call which tool

- **Current time** (UTC or IANA zone such as `Europe/Berlin`) → `now`
- **Is this string valid RFC3339 / ISO-8601?** → `validate` (required `value`)
- **Convert encodings** (unix, unixms, NTP, GPS, TAI, HTTP-date, email-date, Excel, Julian, weekdate, …) → `convert` (required `value`; optional `in` default `auto`, `out` default `rfc3339`)
- **Parse a timestamp or human expression** (`tomorrow 17:00`, `2026-02-25T19:17:03.482Z`) → `parse` (required `q`; optional `tz`, default UTC)
- **Human local time into another zone token** (`5pm`, `tomorrow 3am CET`, IANA / UTC / abbreviation / offset) → `tz_convert` (required `value` and `to`)

`convert` and `tz_convert` return Instant. Prefer `instant.rfc3339z` when passing times between tools.
