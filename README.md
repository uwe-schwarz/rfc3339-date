# rfc3339.date

Cloudflare Worker API for RFC3339 validation, encoding conversion, human-friendly timezone conversion, timezone offsets/transitions, and leap second dataset access.

## Run

```bash
pnpm install
pnpm dev
```

## Quality Checks

```bash
pnpm run checks
```

`pnpm run checks` runs all quality gates in sequence: `lint`, `typecheck`, `test`, and `build`.

## Deploy

```bash
pnpm deploy
```

## Example Calls

```bash
curl https://rfc3339.date/now
curl "https://rfc3339.date/now/Europe%2FBerlin?precision=3"
curl "https://rfc3339.date/validate?value=2026-02-25T19:17:03Z&profile=rfc3339&mode=strict&json=1"
curl "https://rfc3339.date/convert?value=1700000000&in=unix&out=rfc3339"
curl "https://rfc3339.date/tz/convert?value=2026-05-22%2017:35%20CEST&to=America%2FNew_York&json=1"
curl "https://rfc3339.date/tz/convert?value=5pm%20DST&from=Europe%2FBerlin&to=America%2FNew_York&base=2026-06-01T12:00:00Z"
curl "https://rfc3339.date/tz/Europe%2FBerlin/transitions?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z"
curl "https://rfc3339.date/leapseconds"
```
