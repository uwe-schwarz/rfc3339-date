# rfc3339-date Cursor plugin

Agent Plugin wrapping the public [rfc3339.date](https://rfc3339.date) HTTP API.

Fun project, not a reliable time source. No auth, no secrets.

Canonical hub: `Instant = { rfc3339z, unix, unixms }`.

Tools: `now`, `validate`, `convert`, `parse`, `tz_convert`.

stdio MCP from repo root: `node ./server.mjs`

Local: copy `plugin.json`, `mcp.json`, `server.mjs`, and `skills/` into a real directory at `~/.cursor/plugins/local/rfc3339-date`, then reload Cursor.
