import { createHash } from "node:crypto";
import { SITE_URL } from "./page-constants";

const AGENT_SKILLS_SCHEMA_URL = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const SITE_SKILL_NAME = "rfc3339-date";
const SITE_SKILL_PATH = `/.well-known/agent-skills/${SITE_SKILL_NAME}/SKILL.md`;

export type AgentSkillIndexDocument = {
  $schema: string;
  skills: Array<{
    name: string;
    type: "skill-md";
    description: string;
    url: string;
    digest: string;
  }>;
};

export function buildSiteSkillMarkdown(): string {
  return `---
name: ${SITE_SKILL_NAME}
description: Use this skill for strict RFC3339 time lookups, validation, conversion, timezone resolution, and human event-time conversion on rfc3339.date.
---

# rfc3339.date

Use this skill when a task needs precise timestamp handling through the public rfc3339.date API.

## Base URL

\`${SITE_URL}\`

## API Description

- OpenAPI JSON: ${SITE_URL}/openapi.json
- OpenAPI YAML: ${SITE_URL}/openapi.yaml
- Load the OpenAPI description when a task needs exact parameter names, supported formats, or response fields.

## Main Tasks

- Get the current time in UTC or a requested IANA timezone with \`/now\` and \`/now/{tz}\`.
- Validate timestamps with \`/validate\`.
- Convert between RFC3339, Unix, HTTP-date, emaildate, GPS, TAI, Excel, and related formats with \`/convert\`.
- Convert human-written event text into a concrete instant with \`/tz/convert\`.
- Resolve timezone aliases with \`/tz/resolve\`.

## Guidance

- Prefer JSON output by adding \`?json=1\` when a task needs structured results.
- Use \`/tz/convert\` for relative or ambiguous event text such as \`tomorrow 10am PST\`.
- Use \`/tz/resolve\` before conversion when a task starts with a Windows timezone alias.
`;
}

export function getSiteSkillPath(): string {
  return SITE_SKILL_PATH;
}

export function buildAgentSkillsIndex(): AgentSkillIndexDocument {
  const skillMarkdown = buildSiteSkillMarkdown();
  const digest = createHash("sha256").update(skillMarkdown).digest("hex");

  return {
    $schema: AGENT_SKILLS_SCHEMA_URL,
    skills: [
      {
        name: SITE_SKILL_NAME,
        type: "skill-md",
        description:
          "Use the rfc3339.date API for current time, timestamp validation, conversions, timezone resolution, and human event-time parsing.",
        url: SITE_SKILL_PATH,
        digest: `sha256:${digest}`,
      },
    ],
  };
}
