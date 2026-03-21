---
title: rfc3339.date
description: Strict RFC3339 API documentation and downloads.
---

# rfc3339.date

Strict RFC3339 API with validation, conversion, timezone transitions, and leap second dataset endpoints.

> This is a fun project, not a reliable source of correct date or time. It only reports the server clock and is not backed by any serious timekeeping hardware or authority.

## Start Here

- [Open the API reference](/api)
- [OpenAPI YAML](https://rfc3339.date/openapi.yaml)
- [OpenAPI JSON](https://rfc3339.date/openapi.json)
- [Scalar-compatible JSON](https://rfc3339.date/openapi.scalar.json)
- [Scalar Registry](https://registry.scalar.com/@iq42/apis/rfc3339date-time-api@latest)
- [Project website](https://rfc3339.date)

## Quick Examples

```bash
curl https://rfc3339.date/now
curl "https://rfc3339.date/convert?value=1700000000&in=unix&out=rfc3339"
curl "https://rfc3339.date/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z"
```

## Notes

- No auth
- No tracking
- Intended for development and testing, not authoritative timekeeping
