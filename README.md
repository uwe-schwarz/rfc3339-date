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

## Local Event-Time Helper

For interactive local use, a shell function is more useful than a plain alias because it can accept the event time as an argument. This helper tries to discover your current IANA timezone on macOS and Linux, then calls the local worker with it.

```bash
rfc3339_local_tz() {
  if [ -n "${TZ:-}" ] && [ "${TZ#*:}" = "$TZ" ]; then
    printf '%s\n' "$TZ"
    return
  fi

  if [ -L /etc/localtime ]; then
    local tz_link
    tz_link="$(readlink /etc/localtime 2>/dev/null || true)"
    case "$tz_link" in
      */zoneinfo/*)
        printf '%s\n' "${tz_link##*/zoneinfo/}"
        return
        ;;
    esac
  fi

  if command -v timedatectl >/dev/null 2>&1; then
    local tz
    tz="$(timedatectl show --property=Timezone --value 2>/dev/null)"
    if [ -n "$tz" ] && [ "$tz" != "n/a" ]; then
      printf '%s\n' "$tz"
      return
    fi
  fi

  if [ -f /etc/timezone ]; then
    local tz
    tz="$(tr -d '\n' < /etc/timezone)"
    if [ -n "$tz" ]; then
      printf '%s\n' "$tz"
      return
    fi
  fi

  printf '%s\n' "UTC"
}

rfc3339_event_local() {
  local api="${RFC3339_DATE_API:-https://rfc3339.date}"
  local tz
  tz="$(rfc3339_local_tz)"

  curl --get "$api/tz/convert" \
    --data-urlencode "value=$*" \
    --data-urlencode "to=$tz"
}

alias eventlocal='rfc3339_event_local'
```

Examples:

```bash
eventlocal "tomorrow 7:30pm CET"
eventlocal "2026-05-22 17:35 CEST"
eventlocal "5pm DST"
```

If the input needs a specific source region for DST/STD disambiguation, call `curl` directly and add `from=...` plus an optional `base=...`.

```bash
curl --get "http://127.0.0.1:8787/tz/convert" \
  --data-urlencode "value=5pm DST" \
  --data-urlencode "from=Europe/Berlin" \
  --data-urlencode "to=$(rfc3339_local_tz)" \
  --data-urlencode "base=2026-06-01T12:00:00Z"
```
