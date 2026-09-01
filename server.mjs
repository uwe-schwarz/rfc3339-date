#!/usr/bin/env node
/**
 * Zero-dep stdio MCP server for https://rfc3339.date
 * JSON-RPC 2.0. Primary framing: LSP-style Content-Length.
 * Fallback: NDJSON (one JSON object per line).
 */
"use strict";

const BASE = "https://rfc3339.date";
const SERVER_NAME = "rfc3339-date";
const SERVER_VERSION = "0.1.0";

const IN_ENCODINGS = [
  "auto",
  "rfc3339",
  "iso8601",
  "unix",
  "unixms",
  "ntp",
  "httpdate",
  "emaildate",
  "gps",
  "tai",
  "jd",
  "mjd",
  "excel1900",
  "excel1904",
  "weekdate",
  "ordinal",
  "doy",
];

const OUT_ENCODINGS = IN_ENCODINGS.filter((e) => e !== "auto");

const PROFILES = [
  "rfc3339",
  "iso8601",
  "iso8601:strict",
  "iso8601:extended",
  "iso8601:basic",
];

const MODES = ["strict", "lenient"];
const FORMATS = ["rfc3339", "rfc3339sec", "rfc3339nano"];

const TOOLS = [
  {
    name: "now",
    description:
      "Current Instant rendered as RFC3339. Optional IANA tz (e.g. Europe/Berlin). Returns NowResponse { now, tz, offset, precision, unix?, unixms? }.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        tz: {
          type: "string",
          description: "IANA time zone. Omit for UTC. Example: Europe/Berlin",
        },
        precision: {
          type: "integer",
          minimum: 0,
          maximum: 9,
          description: "Fractional second digits (0–9). Default 3.",
        },
        format: {
          type: "string",
          enum: FORMATS,
          description: "rfc3339 | rfc3339sec | rfc3339nano",
        },
      },
    },
  },
  {
    name: "validate",
    description:
      "Validate a timestamp string. Returns ValidateResponse { valid, profile, mode, canonical?, parsed?, errors, warnings }. Does not invent results.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["value"],
      properties: {
        value: {
          type: "string",
          description: "Timestamp string to validate.",
        },
        profile: {
          type: "string",
          enum: PROFILES,
          description: "Validation profile. Default rfc3339.",
        },
        mode: {
          type: "string",
          enum: MODES,
          description: "strict (default) or lenient.",
        },
      },
    },
  },
  {
    name: "convert",
    description:
      "Convert a time value between encodings. Canonical hub Instant { rfc3339z, unix, unixms } is in ConvertResponse.instant when present.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["value"],
      properties: {
        value: {
          type: "string",
          description: "Input timestamp or numeric encoding.",
        },
        in: {
          type: "string",
          enum: IN_ENCODINGS,
          description: "Input encoding. Default auto.",
        },
        out: {
          type: "string",
          enum: OUT_ENCODINGS,
          description: "Output encoding. Default rfc3339.",
        },
        precision: {
          type: "integer",
          minimum: 0,
          maximum: 9,
        },
        tz: {
          type: "string",
          description: "IANA zone for zone-dependent outputs.",
        },
        leapdata: {
          type: "string",
          description: 'Leap-second dataset version, or "latest".',
        },
      },
    },
  },
  {
    name: "parse",
    description:
      "Parse a timestamp or human expression (e.g. \"tomorrow 17:00\") into an instant. Returns ParseResponse { input, timezone, instant, local, confidence, notes }.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["q"],
      properties: {
        q: {
          type: "string",
          description: "Timestamp or human time expression.",
        },
        tz: {
          type: "string",
          description: "IANA zone for human expressions. Default UTC.",
        },
      },
    },
  },
  {
    name: "tz_convert",
    description:
      "Convert a human local time into another zone token. Returns TzConvertResponse with Instant { rfc3339z, unix, unixms }.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["value", "to"],
      properties: {
        value: {
          type: "string",
          description:
            "Human-style local time. Examples: 5pm DST, tomorrow 3am CET, 2026-05-22 17:35 CEST.",
        },
        to: {
          type: "string",
          description: "Target zone token (IANA, UTC, abbreviation, or offset).",
        },
        from: {
          type: "string",
          description: "Source IANA zone when value omits a zone or uses DST/STD.",
        },
        base: {
          type: "string",
          description: "RFC3339 base instant for relative values like tomorrow.",
        },
        precision: {
          type: "integer",
          minimum: 0,
          maximum: 9,
        },
      },
    },
  },
];

function writeMessage(obj) {
  const json = JSON.stringify(obj);
  const body = Buffer.from(json, "utf8");
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii");
  process.stdout.write(Buffer.concat([header, body]));
}

function rpcResult(id, result) {
  writeMessage({ jsonrpc: "2.0", id, result });
}

function rpcError(id, code, message, data) {
  const err = { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
  if (data !== undefined) err.error.data = data;
  writeMessage(err);
}

function toolResult(text, isError = false) {
  const result = {
    content: [{ type: "text", text: typeof text === "string" ? text : JSON.stringify(text) }],
  };
  if (isError) result.isError = true;
  return result;
}

function missing(name) {
  return toolResult(
    JSON.stringify({ error: "invalid_params", message: `Missing required argument: ${name}` }),
    true
  );
}

function queryString(params) {
  const usp = new URLSearchParams();
  usp.set("json", "1");
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  return usp.toString();
}

async function apiGet(pathname, params = {}) {
  const url = `${BASE}${pathname}?${queryString(params)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function callApi(pathname, params) {
  try {
    const { status, text } = await apiGet(pathname, params);
    const body = text && text.length ? text : JSON.stringify({ error: "http_error", message: `HTTP ${status}` });
    if (status >= 400) return toolResult(body, true);
    return toolResult(body, false);
  } catch (err) {
    return toolResult(
      JSON.stringify({
        error: "fetch_failed",
        message: err && err.message ? String(err.message) : String(err),
      }),
      true
    );
  }
}

function argsOf(params) {
  if (!params || typeof params !== "object") return {};
  const a = params.arguments ?? params.args ?? {};
  return a && typeof a === "object" ? a : {};
}

async function callTool(name, args) {
  switch (name) {
    case "now": {
      const { tz, precision, format } = args;
      const q = {};
      if (precision !== undefined && precision !== null && precision !== "") q.precision = precision;
      if (format) q.format = format;
      const path =
        tz && String(tz).trim()
          ? `/now/${encodeURIComponent(String(tz).trim())}`
          : "/now";
      return callApi(path, q);
    }
    case "validate": {
      if (!args.value && args.value !== 0) return missing("value");
      const q = { value: args.value };
      if (args.profile) q.profile = args.profile;
      if (args.mode) q.mode = args.mode;
      return callApi("/validate", q);
    }
    case "convert": {
      if (!args.value && args.value !== 0) return missing("value");
      const q = { value: args.value };
      if (args.in) q.in = args.in;
      if (args.out) q.out = args.out;
      if (args.precision !== undefined && args.precision !== null && args.precision !== "") {
        q.precision = args.precision;
      }
      if (args.tz) q.tz = args.tz;
      if (args.leapdata) q.leapdata = args.leapdata;
      return callApi("/convert", q);
    }
    case "parse": {
      if (!args.q && args.q !== 0) return missing("q");
      const q = { q: args.q };
      if (args.tz) q.tz = args.tz;
      return callApi("/parse", q);
    }
    case "tz_convert": {
      if (!args.value && args.value !== 0) return missing("value");
      if (!args.to && args.to !== 0) return missing("to");
      const q = { value: args.value, to: args.to };
      if (args.from) q.from = args.from;
      if (args.base) q.base = args.base;
      if (args.precision !== undefined && args.precision !== null && args.precision !== "") {
        q.precision = args.precision;
      }
      return callApi("/tz/convert", q);
    }
    default:
      return toolResult(
        JSON.stringify({ error: "unknown_tool", message: `Unknown tool: ${name}` }),
        true
      );
  }
}

async function handleRequest(msg) {
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case "initialize": {
        const requested =
          params && typeof params.protocolVersion === "string"
            ? params.protocolVersion
            : "2025-03-26";
        rpcResult(id, {
          protocolVersion: requested,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          instructions:
            "Instant hub { rfc3339z, unix, unixms }. Tools: now, validate, convert, parse, tz_convert.",
        });
        return;
      }
      case "notifications/initialized":
      case "initialized":
        return;
      case "ping":
        if (!isNotification) rpcResult(id, {});
        return;
      case "tools/list":
        rpcResult(id, { tools: TOOLS });
        return;
      case "tools/call": {
        const name = params && params.name;
        if (!name) {
          rpcError(id, -32602, "Missing tool name");
          return;
        }
        const result = await callTool(name, argsOf(params));
        rpcResult(id, result);
        return;
      }
      default:
        if (!isNotification) rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    if (!isNotification) {
      rpcError(id, -32603, "Internal error", String(err && err.message ? err.message : err));
    }
  }
}

function findHeaderEnd(buf) {
  for (let i = 0; i < buf.length - 1; i++) {
    if (
      buf[i] === 0x0d &&
      buf[i + 1] === 0x0a &&
      i + 3 < buf.length &&
      buf[i + 2] === 0x0d &&
      buf[i + 3] === 0x0a
    ) {
      return { end: i, skip: 4 };
    }
    if (buf[i] === 0x0a && buf[i + 1] === 0x0a) {
      return { end: i, skip: 2 };
    }
  }
  return null;
}

function looksLikeHeader(buf) {
  const n = Math.min(buf.length, 64);
  const head = buf.toString("ascii", 0, n).toLowerCase();
  return head.startsWith("content-length:") || head.startsWith("content-type:");
}

let buf = Buffer.alloc(0);
let chain = Promise.resolve();

function enqueue(msg) {
  chain = chain.then(() => handleRequest(msg)).catch((err) => {
    process.stderr.write(`[rfc3339-date] ${err && err.stack ? err.stack : err}\n`);
  });
}

function consume() {
  while (buf.length > 0) {
    let start = 0;
    while (
      start < buf.length &&
      (buf[start] === 0x20 ||
        buf[start] === 0x09 ||
        buf[start] === 0x0d ||
        buf[start] === 0x0a)
    ) {
      start++;
    }
    if (start > 0) buf = buf.subarray(start);
    if (buf.length === 0) return;

    if (looksLikeHeader(buf) || buf.includes(Buffer.from("Content-Length:", "ascii")) && buf.indexOf(0x7b) === -1) {
      const hdr = findHeaderEnd(buf);
      if (!hdr) return;
      const headerText = buf.toString("ascii", 0, hdr.end);
      const m = headerText.match(/content-length:\s*(\d+)/i);
      if (!m) {
        buf = buf.subarray(hdr.end + hdr.skip);
        continue;
      }
      const len = Number(m[1]);
      const bodyStart = hdr.end + hdr.skip;
      if (buf.length < bodyStart + len) return;
      const body = buf.subarray(bodyStart, bodyStart + len).toString("utf8");
      buf = buf.subarray(bodyStart + len);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (err) {
        rpcError(null, -32700, "Parse error", String(err.message));
        continue;
      }
      enqueue(parsed);
      continue;
    }

    if (buf[0] === 0x7b) {
      const nl = buf.indexOf(0x0a);
      if (nl < 0) return;
      let line = buf.subarray(0, nl).toString("utf8");
      buf = buf.subarray(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.trim()) continue;
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch (err) {
        rpcError(null, -32700, "Parse error", String(err.message));
        continue;
      }
      enqueue(parsed);
      continue;
    }

    // Unknown prefix: skip a line if possible, else wait.
    const nl = buf.indexOf(0x0a);
    if (nl < 0) return;
    buf = buf.subarray(nl + 1);
  }
}

process.stdin.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  consume();
});

process.stdin.on("end", () => {
  if (buf.length > 0 && buf[0] === 0x7b) {
    const line = buf.toString("utf8").replace(/\r?\n$/, "");
    buf = Buffer.alloc(0);
    try {
      enqueue(JSON.parse(line));
    } catch (err) {
      rpcError(null, -32700, "Parse error", String(err.message));
    }
  }
});

process.stdin.on("close", () => {
  chain.finally(() => process.exit(0));
});

process.stdin.resume();
