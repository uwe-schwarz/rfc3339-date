import { describe, expect, it } from "vitest";
import app from "../src/index";

function request(path: string, init?: RequestInit): Promise<Response> {
  return Promise.resolve(app.request(`http://localhost${path}`, init));
}

function mcpRequest(body: unknown, headers?: Record<string, string>): Promise<Response> {
  return request("/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("MCP discovery and transport", () => {
  it("serves a truthful MCP server card", async () => {
    const response = await request("/.well-known/mcp/server-card.json");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const card = (await response.json()) as {
      $schema: string;
      version: string;
      protocolVersion: string;
      serverInfo: { name: string; title: string; version: string; websiteUrl: string };
      transport: { type: string; endpoint: string };
      capabilities: Record<string, unknown>;
      resources: Array<{ uri: string }>;
      tools: Array<{ name: string }>;
    };

    expect(card.$schema).toContain("mcp-server-card");
    expect(card.protocolVersion).toBe("2025-11-25");
    expect(card.serverInfo).toMatchObject({
      name: "rfc3339-date",
      title: "rfc3339.date MCP Server",
      version: "1.2.0",
      websiteUrl: "https://rfc3339.date",
    });
    expect(card.transport).toEqual({
      type: "streamable-http",
      endpoint: "/mcp",
    });
    expect(card.capabilities).toMatchObject({
      resources: {},
      tools: {
        listChanged: false,
      },
    });
    expect(card.resources).toContainEqual(
      expect.objectContaining({
        uri: "mcp://server-card.json",
      }),
    );
    expect(card.tools.map((tool) => tool.name)).toEqual([
      "get-current-time",
      "convert-timestamp",
      "parse-human-time",
      "validate-timestamp",
    ]);
  });

  it("rejects invalid origins for the mcp endpoint", async () => {
    const response = await mcpRequest(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      },
      {
        origin: "https://evil.example",
      },
    );

    expect(response.status).toBe(403);
  });

  it("advertises only the supported mcp methods during preflight", async () => {
    const response = await request("/mcp", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:8787",
        "access-control-request-method": "POST",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:8787");
    expect(response.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  });

  it("implements streamable http initialize, tools, and resources as JSON responses", async () => {
    const initialize = await mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });

    expect(initialize.status).toBe(200);
    expect(initialize.headers.get("content-type")).toContain("application/json");
    const initializeJson = (await initialize.json()) as {
      jsonrpc: string;
      id: number;
      result: {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: { name: string; version: string };
      };
    };
    expect(initializeJson).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2025-11-25",
        capabilities: {
          resources: {},
          tools: { listChanged: false },
        },
        serverInfo: {
          name: "rfc3339-date",
          version: "1.2.0",
        },
      },
    });

    const initialized = await mcpRequest(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
      },
      { "mcp-protocol-version": "2025-11-25" },
    );
    expect(initialized.status).toBe(202);

    const toolList = await mcpRequest(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      },
      { "mcp-protocol-version": "2025-11-25" },
    );
    expect(toolList.status).toBe(200);
    const toolListJson = (await toolList.json()) as {
      result: { tools: Array<{ name: string; inputSchema: { type: string } }> };
    };
    expect(toolListJson.result.tools.map((tool) => tool.name)).toEqual([
      "get-current-time",
      "convert-timestamp",
      "parse-human-time",
      "validate-timestamp",
    ]);
    expect(toolListJson.result.tools[0]?.inputSchema.type).toBe("object");

    const callTool = await mcpRequest(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "parse-human-time",
          arguments: {
            value: "tomorrow 10am PST",
            to: "Europe/Berlin",
            base: "2026-06-01T12:00:00Z",
          },
        },
      },
      { "mcp-protocol-version": "2025-11-25" },
    );
    expect(callTool.status).toBe(200);
    const callToolJson = (await callTool.json()) as {
      result: {
        content: Array<{ type: string; text: string }>;
        structuredContent: { target: { local: string } };
        isError?: boolean;
      };
    };
    expect(callToolJson.result.isError).not.toBe(true);
    expect(callToolJson.result.structuredContent.target.local).toContain("2026-06-02T");
    expect(callToolJson.result.content[0]?.type).toBe("text");

    const resourceList = await mcpRequest(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "resources/list",
      },
      { "mcp-protocol-version": "2025-11-25" },
    );
    expect(resourceList.status).toBe(200);
    const resourceListJson = (await resourceList.json()) as {
      result: { resources: Array<{ uri: string }> };
    };
    expect(resourceListJson.result.resources).toContainEqual(
      expect.objectContaining({
        uri: "mcp://server-card.json",
      }),
    );

    const resourceRead = await mcpRequest(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "resources/read",
        params: {
          uri: "mcp://server-card.json",
        },
      },
      { "mcp-protocol-version": "2025-11-25" },
    );
    expect(resourceRead.status).toBe(200);
    const resourceReadJson = (await resourceRead.json()) as {
      result: {
        contents: Array<{ uri: string; mimeType: string; text: string }>;
      };
    };
    expect(resourceReadJson.result.contents[0]).toMatchObject({
      uri: "mcp://server-card.json",
      mimeType: "application/json",
    });
    expect(resourceReadJson.result.contents[0]?.text).toContain('"transport"');
  });

  it("returns 405 for GET and DELETE on the stateless mcp endpoint", async () => {
    const getResponse = await request("/mcp", {
      headers: { accept: "text/event-stream" },
    });
    expect(getResponse.status).toBe(405);

    const deleteResponse = await request("/mcp", {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(405);
  });

  it("returns invalid request when a request id is present but method is missing", async () => {
    const response = await mcpRequest({
      jsonrpc: "2.0",
      id: 99,
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toMatchObject({
      jsonrpc: "2.0",
      id: 99,
      error: {
        code: -32600,
        message: "Invalid JSON-RPC request.",
      },
    });
  });

  it("returns http 400 for unsupported protocol version headers", async () => {
    const response = await mcpRequest(
      {
        jsonrpc: "2.0",
        id: 7,
        method: "tools/list",
      },
      { "mcp-protocol-version": "1999-01-01" },
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toMatchObject({
      jsonrpc: "2.0",
      id: 7,
      error: {
        code: -32602,
        message: "Unsupported protocol version",
      },
    });
  });
});
