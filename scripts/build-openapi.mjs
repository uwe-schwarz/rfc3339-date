import { readFile, writeFile } from "node:fs/promises";

const openapiYaml = await readFile("docs/openapi.yaml", "utf8");

const output = `export const OPENAPI_YAML = ${JSON.stringify(openapiYaml)};\n`;

await writeFile("src/lib/openapi.generated.ts", output, "utf8");

console.log("Generated src/lib/openapi.generated.ts from docs/openapi.yaml");
