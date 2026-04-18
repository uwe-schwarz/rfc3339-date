type JsonSchemaProperty =
  | {
      type: "string";
      description: string;
      enum?: readonly string[];
    }
  | {
      type: "integer";
      description: string;
      minimum?: number;
      maximum?: number;
    };

type JsonSchema = {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties?: boolean;
};

export type WebMcpTool = {
  name: string;
  description: string;
  endpoint: string;
  inputSchema: JsonSchema;
  required: readonly string[];
};

export const WEB_MCP_TOOLS: readonly WebMcpTool[] = [
  {
    name: "get-current-time",
    description: "Return the current time in UTC or in a requested IANA timezone.",
    endpoint: "/now",
    inputSchema: {
      type: "object",
      properties: {
        tz: {
          type: "string",
          description: "Optional IANA timezone such as Europe/Berlin.",
        },
        precision: {
          type: "integer",
          description: "Optional fractional second precision from 0 to 9.",
          minimum: 0,
          maximum: 9,
        },
      },
      additionalProperties: false,
    },
    required: [],
  },
  {
    name: "convert-timestamp",
    description: "Convert a timestamp value between supported formats such as RFC3339 and Unix.",
    endpoint: "/convert",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "Input timestamp value to convert.",
        },
        in: {
          type: "string",
          description: "Input format identifier such as rfc3339 or unix.",
        },
        out: {
          type: "string",
          description: "Output format identifier such as rfc3339 or unixms.",
        },
      },
      required: ["value", "in", "out"],
      additionalProperties: false,
    },
    required: ["value", "in", "out"],
  },
  {
    name: "validate-timestamp",
    description: "Validate one timestamp string against the site's supported profiles.",
    endpoint: "/validate",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "Timestamp string to validate.",
        },
        profile: {
          type: "string",
          description: "Optional profile such as rfc3339 or iso8601.",
        },
        mode: {
          type: "string",
          description: "Optional validation mode such as strict or lenient.",
          enum: ["strict", "lenient"],
        },
      },
      required: ["value"],
      additionalProperties: false,
    },
    required: ["value"],
  },
  {
    name: "convert-human-time",
    description: "Convert human-written event time text into a concrete timezone-aware instant.",
    endpoint: "/tz/convert",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "Human time text such as tomorrow 10am PST.",
        },
        to: {
          type: "string",
          description: "Target timezone or zone specification.",
        },
        from: {
          type: "string",
          description: "Optional source IANA timezone for ambiguous inputs.",
        },
        base: {
          type: "string",
          description: "Optional RFC3339 base instant for DST or relative-date disambiguation.",
        },
        precision: {
          type: "integer",
          description: "Optional fractional second precision from 0 to 9.",
          minimum: 0,
          maximum: 9,
        },
      },
      required: ["value", "to"],
      additionalProperties: false,
    },
    required: ["value", "to"],
  },
  {
    name: "inspect-timezone",
    description: "Resolve a timezone name or Windows alias to the site's canonical IANA timezone.",
    endpoint: "/tz/resolve",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Timezone name or alias to resolve.",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    required: ["name"],
  },
] as const;

function serializeToolsForBrowser(): string {
  return JSON.stringify(
    WEB_MCP_TOOLS.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  );
}

export function buildWebMcpRegistrationScript(): string {
  return `
    const webMcpTools = ${serializeToolsForBrowser()};
    const webMcpFetchJson = async (url) => {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload.message === "string" ? payload.message : "Request failed.";
        throw new Error(message);
      }
      return payload;
    };
    const webMcpToolHandlers = {
      "get-current-time": async (input = {}) => {
        const params = new URLSearchParams({ json: "1" });
        if (input.precision !== undefined) params.set("precision", String(input.precision));
        const path = input.tz ? "/now/" + encodeURIComponent(input.tz) : "/now";
        return webMcpFetchJson(path + "?" + params.toString());
      },
      "convert-timestamp": async (input = {}) => {
        const params = new URLSearchParams({
          json: "1",
          value: String(input.value ?? ""),
          in: String(input.in ?? ""),
          out: String(input.out ?? ""),
        });
        return webMcpFetchJson("/convert?" + params.toString());
      },
      "validate-timestamp": async (input = {}) => {
        const params = new URLSearchParams({
          json: "1",
          value: String(input.value ?? ""),
        });
        if (input.profile) params.set("profile", String(input.profile));
        if (input.mode) params.set("mode", String(input.mode));
        return webMcpFetchJson("/validate?" + params.toString());
      },
      "convert-human-time": async (input = {}) => {
        const params = new URLSearchParams({
          json: "1",
          value: String(input.value ?? ""),
          to: String(input.to ?? ""),
        });
        if (input.from) params.set("from", String(input.from));
        if (input.base) params.set("base", String(input.base));
        if (input.precision !== undefined) params.set("precision", String(input.precision));
        return webMcpFetchJson("/tz/convert?" + params.toString());
      },
      "inspect-timezone": async (input = {}) => {
        const params = new URLSearchParams({
          json: "1",
          name: String(input.name ?? ""),
        });
        return webMcpFetchJson("/tz/resolve?" + params.toString());
      },
    };
    const registerWebMcpContext = () => {
      if (!("modelContext" in navigator) || !navigator.modelContext) return;
      if (typeof navigator.modelContext.provideContext !== "function") return;
      try {
        navigator.modelContext.provideContext({
          tools: webMcpTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: (input) => webMcpToolHandlers[tool.name](input),
          })),
        });
      } catch {
        // WebMCP is optional; registration failures must not break core page behavior.
      }
    };
  `;
}
