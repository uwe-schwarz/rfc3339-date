import type { Context } from "hono";
import type { Diagnostic } from "../types";

export function addCommonHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  merged.set("X-Content-Type-Options", "nosniff");
  return merged;
}

export function shouldReturnJson(request: Request, forced = false): boolean {
  if (forced) return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

export function textOrJson(
  c: Context,
  data: unknown,
  text: string,
  status = 200,
  headers?: HeadersInit,
): Response {
  const wantsJson = c.req.query("json") === "1" || shouldReturnJson(c.req.raw);
  const mergedHeaders = Object.fromEntries(addCommonHeaders(headers).entries());
  if (wantsJson) return c.json(data, status as never, mergedHeaders);
  return new Response(text, {
    status,
    headers: Object.fromEntries(
      addCommonHeaders({ "content-type": "text/plain; charset=utf-8", ...headers }).entries(),
    ),
  });
}

export function errorResponse(
  c: Context,
  status: number,
  error: string,
  message: string,
  details?: Diagnostic[],
): Response {
  const mergedHeaders = Object.fromEntries(
    addCommonHeaders({ "cache-control": "no-store" }).entries(),
  );
  return c.json({ error, message, details: details ?? [] }, status as never, mergedHeaders);
}

export function getPrecision(query: string | undefined, format: string | undefined): number {
  if (format === "rfc3339sec") return 0;
  if (format === "rfc3339nano") return 9;
  const p = query ? Number(query) : 3;
  if (!Number.isInteger(p) || p < 0 || p > 9) return 3;
  return p;
}
