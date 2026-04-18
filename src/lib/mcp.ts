import packageJson from "../../package.json";
import { parseInputToInstant, toOutput } from "./convert";
import { formatRfc3339Utc } from "./date";
import { parseHumanTime, convertInstantToTargetDetails, resolveZoneSpec } from "./human-time";
import { validateValue } from "./validation";
import { ensureIanaZone } from "./zone";
import { SITE_URL } from "./page-constants";

const JSON_RPC_VERSION = "2.0";
const MCP_ENDPOINT = "/mcp";
const SERVER_CARD_URI = "mcp://server-card.json";
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2025-11-25"] as const;
const OUTPUT_ENCODINGS = [
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
] as const;
const INPUT_ENCODINGS = ["auto", ...OUTPUT_ENCODINGS] as const;
const VALIDATION_PROFILES = [
  "rfc3339",
  "iso8601",
  "iso8601:strict",
  "iso8601:extended",
  "iso8601:basic",
] as const;
const VALIDATION_MODES = ["strict", "lenient"] as const;

type ToolArgs = Record<string, unknown>;
type ToolResult = { content: Array<{ type: "text"; text: string }>; structuredContent?: unknown; isError?: true };
type JsonRpcRequest = { jsonrpc?: string; id: string | number | null; method: string; params?: Record<string, unknown> };

const SERVER_INFO = {
  name: "rfc3339-date",
  title: "rfc3339.date MCP Server",
  version: packageJson.version,
  description:
    "Read-only MCP tools for current time, timestamp validation, conversion, and human-time parsing.",
  icons: [{ src: `${SITE_URL}/fav.png`, mimeType: "image/png", sizes: ["760x760"] }],
  websiteUrl: SITE_URL,
};

const MCP_CAPABILITIES = {
  resources: {},
  tools: { listChanged: false },
};

function toolText(payload: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function toolError(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

function parsePrecision(value: unknown, fallback = 3): number | null {
  if (value === undefined) return fallback;
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 9 ? Number(value) : null;
}

async function getCurrentTime(args: ToolArgs): Promise<ToolResult> {
  const precision = parsePrecision(args.precision);
  if (precision === null) return toolError("`precision` must be an integer between 0 and 9.");
  const tz = typeof args.tz === "string" && args.tz ? args.tz : "UTC";
  if (tz !== "UTC" && !ensureIanaZone(tz)) return toolError(`Unknown IANA time zone '${tz}'.`);
  const instant = { unixMs: Date.now(), nsRemainder: 0 };
  const now = tz === "UTC" ? formatRfc3339Utc(instant, precision) : toOutput(instant, "rfc3339", tz, precision);
  return toolText({
    now,
    tz,
    offset: now.endsWith("Z") ? "Z" : now.slice(-6),
    precision,
    unix: Math.trunc(instant.unixMs / 1000),
    unixms: instant.unixMs,
  });
}

async function convertTimestamp(args: ToolArgs): Promise<ToolResult> {
  const value = typeof args.value === "string" ? args.value : "";
  const input = typeof args.in === "string" ? args.in : "auto";
  const out = typeof args.out === "string" ? args.out : "rfc3339";
  if (!value) return toolError("`value` is required.");
  if (!INPUT_ENCODINGS.includes(input as (typeof INPUT_ENCODINGS)[number])) return toolError("Unsupported `in` encoding.");
  if (!OUTPUT_ENCODINGS.includes(out as (typeof OUTPUT_ENCODINGS)[number])) return toolError("Unsupported `out` encoding.");
  const precision = parsePrecision(args.precision);
  if (precision === null) return toolError("`precision` must be an integer between 0 and 9.");
  const tz = typeof args.tz === "string" && args.tz ? args.tz : null;
  if (tz && !ensureIanaZone(tz)) return toolError(`Unknown IANA time zone '${tz}'.`);
  const parsed = parseInputToInstant(value, input as (typeof INPUT_ENCODINGS)[number], "latest");
  if (!("instant" in parsed)) return toolError(parsed.message);
  return toolText({
    in: parsed.resolvedIn,
    out,
    value_in: value,
    value_out: toOutput(parsed.instant, out as (typeof OUTPUT_ENCODINGS)[number], tz, precision),
    tz,
    precision,
    instant: {
      rfc3339z: formatRfc3339Utc(parsed.instant, precision),
      unix: Math.trunc(parsed.instant.unixMs / 1000),
      unixms: parsed.instant.unixMs,
    },
    notes: parsed.notes,
    candidates: "candidates" in parsed ? parsed.candidates : undefined,
  });
}

async function parseHumanTimeTool(args: ToolArgs): Promise<ToolResult> {
  const value = typeof args.value === "string" ? args.value : "";
  const to = typeof args.to === "string" ? args.to : "";
  if (!value || !to) return toolError("`value` and `to` are required.");
  const targetResolved = resolveZoneSpec(to);
  if ("error" in targetResolved) return toolError(targetResolved.message);
  const from = typeof args.from === "string" && args.from ? args.from : null;
  if (from && from !== "UTC" && !ensureIanaZone(from)) return toolError(`Unknown IANA time zone '${from}'.`);
  const baseRaw = typeof args.base === "string" ? args.base : undefined;
  const baseParsed = baseRaw ? parseInputToInstant(baseRaw, "rfc3339", "latest") : null;
  if (baseRaw && !(baseParsed && "instant" in baseParsed)) return toolError("`base` must be RFC3339.");
  const precision = parsePrecision(args.precision, 0);
  if (precision === null) return toolError("`precision` must be an integer between 0 and 9.");
  const parsed = parseHumanTime(value, {
    from,
    baseInstant: baseParsed && "instant" in baseParsed ? baseParsed.instant : { unixMs: Date.now(), nsRemainder: 0 },
  });
  if (!("instant" in parsed)) return toolError(parsed.message);
  const target = convertInstantToTargetDetails(parsed.instant, targetResolved.spec, precision);
  return toolText({
    value_in: value,
    value_out: target.local,
    from: parsed.source.zone,
    to: { raw: target.raw, kind: target.kind, tz: target.tz, offset: target.offset, abbreviation: target.abbreviation, dst: target.dst },
    source: { local: parsed.source.local, date: parsed.source.localDate, time: parsed.source.localTime, date_source: parsed.source.dateSource, base: parsed.source.base },
    target: { local: target.local, date: target.date, time: target.time },
    instant: { rfc3339z: formatRfc3339Utc(parsed.instant, precision), unix: Math.floor(parsed.instant.unixMs / 1000), unixms: parsed.instant.unixMs },
    notes: parsed.notes,
  });
}

async function validateTimestamp(args: ToolArgs): Promise<ToolResult> {
  const value = typeof args.value === "string" ? args.value : "";
  const profile = typeof args.profile === "string" ? args.profile : "rfc3339";
  const mode = typeof args.mode === "string" ? args.mode : "strict";
  if (!value) return toolError("`value` is required.");
  if (!VALIDATION_PROFILES.includes(profile as (typeof VALIDATION_PROFILES)[number])) return toolError("Unsupported `profile`.");
  if (!VALIDATION_MODES.includes(mode as (typeof VALIDATION_MODES)[number])) return toolError("Unsupported `mode`.");
  return toolText(validateValue(value, profile as (typeof VALIDATION_PROFILES)[number], mode as (typeof VALIDATION_MODES)[number]));
}

const MCP_TOOLS = [
  { name: "get-current-time", title: "Get Current Time", description: "Return the current time in UTC or a requested IANA timezone.", inputSchema: { type: "object", properties: { tz: { type: "string", description: "Optional IANA timezone such as Europe/Berlin." }, precision: { type: "integer", description: "Optional fractional second precision from 0 to 9.", minimum: 0, maximum: 9 } }, additionalProperties: false }, call: getCurrentTime },
  { name: "convert-timestamp", title: "Convert Timestamp", description: "Convert a timestamp value between supported formats.", inputSchema: { type: "object", properties: { value: { type: "string", description: "Input timestamp value." }, in: { type: "string", description: "Input encoding.", enum: INPUT_ENCODINGS }, out: { type: "string", description: "Output encoding.", enum: OUTPUT_ENCODINGS }, tz: { type: "string", description: "Optional IANA timezone for RFC3339 output." }, precision: { type: "integer", description: "Optional fractional second precision from 0 to 9.", minimum: 0, maximum: 9 } }, required: ["value", "in", "out"], additionalProperties: false }, call: convertTimestamp },
  { name: "parse-human-time", title: "Parse Human Time", description: "Resolve human-written event time text into a concrete instant in a target timezone.", inputSchema: { type: "object", properties: { value: { type: "string", description: "Human time text such as tomorrow 10am PST." }, to: { type: "string", description: "Target timezone or zone specification." }, from: { type: "string", description: "Optional source IANA timezone." }, base: { type: "string", description: "Optional RFC3339 base instant for relative dates or DST disambiguation." }, precision: { type: "integer", description: "Optional fractional second precision from 0 to 9.", minimum: 0, maximum: 9 } }, required: ["value", "to"], additionalProperties: false }, call: parseHumanTimeTool },
  { name: "validate-timestamp", title: "Validate Timestamp", description: "Validate one timestamp string against the supported RFC3339 and ISO8601 profiles.", inputSchema: { type: "object", properties: { value: { type: "string", description: "Timestamp string to validate." }, profile: { type: "string", description: "Validation profile.", enum: VALIDATION_PROFILES }, mode: { type: "string", description: "Validation mode.", enum: VALIDATION_MODES } }, required: ["value"], additionalProperties: false }, call: validateTimestamp },
] as const;

const MCP_RESOURCES = [{ uri: SERVER_CARD_URI, name: "server-card.json", title: "MCP Server Card", description: "Static MCP Server Card for rfc3339.date.", mimeType: "application/json" }] as const;

function jsonRpcResult(id: string | number | null, result: unknown) {
  return { jsonrpc: JSON_RPC_VERSION, id, result };
}

function jsonRpcError(id: string | number | null, code: number, message: string, data?: unknown) {
  return { jsonrpc: JSON_RPC_VERSION, id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

export function buildMcpServerCard() {
  return { $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json", version: "1.0", protocolVersion: "2025-11-25", serverInfo: SERVER_INFO, description: SERVER_INFO.description, iconUrl: `${SITE_URL}/fav.png`, documentationUrl: SITE_URL, transport: { type: "streamable-http", endpoint: MCP_ENDPOINT }, capabilities: MCP_CAPABILITIES, instructions: "All tools are read-only wrappers around the public rfc3339.date API behavior.", resources: MCP_RESOURCES, tools: MCP_TOOLS.map(({ call: _call, ...tool }) => tool) };
}

function validOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return origin === SITE_URL || (url.protocol === "https:" && url.hostname.endsWith(".workers.dev")) || ((url.protocol === "http:" || url.protocol === "https:") && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

export function mcpCorsHeaders(origin: string | null): Record<string, string> {
  return validOrigin(origin) && origin ? { "access-control-allow-origin": origin, vary: "Origin", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type, Accept, MCP-Protocol-Version" } : {};
}

function protocolVersionFor(request: JsonRpcRequest, headerVersion: string | null) {
  if (request.method === "initialize") {
    const requested = typeof request.params?.protocolVersion === "string" ? request.params.protocolVersion : null;
    if (!requested) return null;
    return SUPPORTED_PROTOCOL_VERSIONS.includes(requested as (typeof SUPPORTED_PROTOCOL_VERSIONS)[number]) ? requested : "2025-11-25";
  }
  const version = headerVersion ?? "2025-03-26";
  return SUPPORTED_PROTOCOL_VERSIONS.includes(version as (typeof SUPPORTED_PROTOCOL_VERSIONS)[number]) ? version : null;
}

export async function handleMcpJsonRpc(request: JsonRpcRequest, headerVersion: string | null) {
  const protocolVersion = protocolVersionFor(request, headerVersion);
  if (request.jsonrpc !== JSON_RPC_VERSION) return jsonRpcError(request.id, -32600, "Invalid JSON-RPC version.");
  if (!protocolVersion) return jsonRpcError(request.id, -32602, "Unsupported protocol version", { supported: SUPPORTED_PROTOCOL_VERSIONS, requested: headerVersion ?? request.params?.protocolVersion ?? null });
  switch (request.method) {
    case "initialize":
      return jsonRpcResult(request.id, { protocolVersion, capabilities: MCP_CAPABILITIES, serverInfo: SERVER_INFO, instructions: "Use the read-only tools to query or transform time data without side effects." });
    case "ping":
      return jsonRpcResult(request.id, {});
    case "tools/list":
      return jsonRpcResult(request.id, { tools: MCP_TOOLS.map(({ call: _call, ...tool }) => tool) });
    case "tools/call": {
      const tool = MCP_TOOLS.find(({ name }) => name === request.params?.name);
      if (!tool) return jsonRpcError(request.id, -32602, `Unknown tool '${String(request.params?.name ?? "")}'.`);
      return jsonRpcResult(request.id, await tool.call((request.params?.arguments as ToolArgs | undefined) ?? {}));
    }
    case "resources/list":
      return jsonRpcResult(request.id, { resources: MCP_RESOURCES });
    case "resources/read":
      return request.params?.uri === SERVER_CARD_URI ? jsonRpcResult(request.id, { contents: [{ uri: SERVER_CARD_URI, mimeType: "application/json", text: JSON.stringify(buildMcpServerCard(), null, 2) }] }) : jsonRpcError(request.id, -32602, `Unknown resource '${String(request.params?.uri ?? "")}'.`);
    case "resources/templates/list":
      return jsonRpcResult(request.id, { resourceTemplates: [] });
    default:
      return jsonRpcError(request.id, -32601, `Method '${request.method}' not found.`);
  }
}
