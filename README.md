# rfc3339.date

Cloudflare Worker API for RFC3339 validation, encoding conversion, human-friendly timezone conversion, timezone offsets/transitions, and leap second dataset access.

## Architecture

The two pages are plain HTML, CSS and browser JavaScript in `public/`. Fonts are
local WOFF2 files with their upstream license and provenance in `public/fonts/`.
There is no frontend framework, CSS compiler, font generator or hydration.
`styles.css` contains the existing reset and layout utilities as ordinary CSS;
`design.css` contains the shared visual design. Edit these files directly.

The TypeScript Worker keeps Hono as its only runtime dependency. Existing date
algorithms, APIs, HTTP MCP, WebMCP, GitHub contribution proxy, agent discovery and
Markdown negotiation remain available. Only `/` and `/imprint` need the Worker to
choose HTML or Markdown; HTML is read from assets, and Markdown keeps a fresh
server timestamp. Other assets bypass the Worker. HTML URL normalization is
disabled so unknown URLs keep the existing 404 behavior.

## Run and verify

Use Node.js 24 or newer and the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm run dev
pnpm run checks
```

Checks first compare the static OpenAPI downloads with the canonical contract,
then run TypeScript checking, a small native Node behavioral suite and a Wrangler
dry run. There are no test, lint or screenshot frameworks to maintain.
After changing asset routing, also run the contracts against local workerd:

```sh
RFC3339_TEST_URL=http://127.0.0.1:8787 pnpm run test
```

For page changes, inspect desktop/mobile, both themes, copy buttons, live examples,
JSON mode and keyboard behavior in a browser. The migration was accepted with the
old suite and eight identical before/after screenshots; routine tool updates do
not require a visual regression harness.

## Local deployment

```sh
pnpm run deploy
```

Use `pnpm run deploy` explicitly: `pnpm deploy` is also a pnpm workspace command.
The script updates the three development tools within their declared compatible
major ranges, respecting the one-day release-age policy, runs all checks, then
calls Wrangler. Update or check failures prevent uploading. To exercise the same
flow without publishing, use `pnpm run deploy -- --dry-run`.

Dependency changes stay in the local `package.json` and lockfile for normal Git
review; the deploy script never commits or pushes. Hono is deliberately updated
only for an applicable fix or API change. No scheduled dependency upgrades are
needed. Obsolete security overrides have been removed in favor of upstream
resolution.

Deploy from the owning local host. GitHub Actions only checks the committed
lockfile; it does not update dependencies, publish documentation or deploy.
Disable the existing Cloudflare Workers Builds Git trigger before switching
production to this local workflow. The deployment script rejects CI invocations
so an old hosted build cannot silently bypass local preparation.

## API documentation

`public/openapi.json` is the canonical contract. The existing YAML and Scalar
compatible downloads are checked-in static files. After a contract change:

```sh
pnpm run docs:update
pnpm run docs:check
pnpm run scalar:publish
```

`docs:update` uses a small native transformation. The YAML download uses JSON
syntax, which is valid YAML 1.2. Scalar's explicitly versioned CLI is downloaded
only for documentation commands (`config.scalarCliVersion` in `package.json`),
not normal installs, builds or deployments. Validation first rejects stale derived downloads, then uses that one tool.
`scalar:publish` retains Registry publication and optional docs-project publication
(`SCALAR_PUBLISH_PROJECT=1`), with the existing `.env.local` credentials.
`pnpm run scalar:preview` previews the docs without publishing.

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

For interactive local use, a shell function is more useful than a plain alias because it can accept the event time as an argument. This helper tries to discover your current IANA timezone on macOS and Linux, then calls the local worker with it. Pass an optional second argument when the source time needs an explicit `from` zone.

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
  local api="${RFC3339_DATE_API:-http://127.0.0.1:8787}"
  local tz
  tz="$(rfc3339_local_tz)"

  if [ -n "${2:-}" ]; then
    curl --get "$api/tz/convert" \
      --data-urlencode "value=$1" \
      --data-urlencode "to=$tz" \
      --data-urlencode "from=$2"
    return
  fi

  curl --get "$api/tz/convert" \
    --data-urlencode "value=$1" \
    --data-urlencode "to=$tz"
}

alias eventlocal='rfc3339_event_local'
```

Examples:

```bash
eventlocal "tomorrow 7:30pm CET"
eventlocal "2026-05-22 17:35 CEST"
eventlocal "5pm DST" Europe/Berlin
```

If the input needs a specific source region for DST/STD disambiguation, call `curl` directly and add `from=...` plus an optional `base=...`.

```bash
curl --get "http://127.0.0.1:8787/tz/convert" \
  --data-urlencode "value=5pm DST" \
  --data-urlencode "from=Europe/Berlin" \
  --data-urlencode "to=$(rfc3339_local_tz)" \
  --data-urlencode "base=2026-06-01T12:00:00Z"
```
