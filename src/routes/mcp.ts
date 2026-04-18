import type { Hono } from "hono";
import { addCommonHeaders } from "../lib/http";
import { buildMcpServerCard, getMcpProtocolVersion, handleMcpJsonRpc, mcpCorsHeaders } from "../lib/mcp";

function baseHeaders(origin: string | null, headers?: HeadersInit) {
  return addCommonHeaders({ "cache-control": "no-store", ...mcpCorsHeaders(origin), ...headers });
}

function methodNotAllowedResponse(origin: string | null) {
  return new Response("Method Not Allowed", { status: 405, headers: baseHeaders(origin, { allow: "POST, OPTIONS" }) });
}

function forbiddenOriginResponse() {
  return new Response("Forbidden", { status: 403, headers: addCommonHeaders({ "cache-control": "no-store" }) });
}

function hasAllowedOrigin(origin: string | null) {
  return !origin || Boolean(mcpCorsHeaders(origin)["access-control-allow-origin"]);
}

export function registerMcpRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/.well-known/mcp/server-card.json", () => {
    return new Response(JSON.stringify(buildMcpServerCard()), {
      headers: addCommonHeaders({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET",
        "access-control-allow-headers": "Content-Type",
      }),
    });
  });

  app.options("/mcp", (c) => {
    const origin = c.req.header("origin") ?? null;
    if (!hasAllowedOrigin(origin)) return forbiddenOriginResponse();
    return new Response(null, { status: 204, headers: baseHeaders(origin) });
  });

  app.get("/mcp", (c) => {
    const origin = c.req.header("origin") ?? null;
    if (!hasAllowedOrigin(origin)) return forbiddenOriginResponse();
    return methodNotAllowedResponse(origin);
  });

  app.delete("/mcp", (c) => {
    const origin = c.req.header("origin") ?? null;
    if (!hasAllowedOrigin(origin)) return forbiddenOriginResponse();
    return methodNotAllowedResponse(origin);
  });

  app.post("/mcp", async (c) => {
    const origin = c.req.header("origin") ?? null;
    if (!hasAllowedOrigin(origin)) return forbiddenOriginResponse();
    const body = await c.req.json().catch(() => null);
    if (!body || Array.isArray(body) || typeof body !== "object") return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid JSON-RPC request." } }), { status: 400, headers: baseHeaders(origin, { "content-type": "application/json; charset=utf-8" }) });
    if (!("method" in body) || typeof body.method !== "string") {
      if (!("id" in body)) return new Response(null, { status: 202, headers: baseHeaders(origin) });
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { code: -32600, message: "Invalid JSON-RPC request." } }), { status: 400, headers: baseHeaders(origin, { "content-type": "application/json; charset=utf-8" }) });
    }
    const headerVersion = c.req.header("mcp-protocol-version");
    if (!("id" in body)) {
      if (!getMcpProtocolVersion(body as never, headerVersion)) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32602, message: "Unsupported protocol version" } }), { status: 400, headers: baseHeaders(origin, { "content-type": "application/json; charset=utf-8" }) });
      }
      return new Response(null, { status: 202, headers: baseHeaders(origin) });
    }
    const jsonRpcResponse = await handleMcpJsonRpc(body as never, headerVersion);
    const status = "error" in jsonRpcResponse && jsonRpcResponse.error.message === "Unsupported protocol version" ? 400 : 200;
    return new Response(JSON.stringify(jsonRpcResponse), { status, headers: baseHeaders(origin, { "content-type": "application/json; charset=utf-8" }) });
  });
}
