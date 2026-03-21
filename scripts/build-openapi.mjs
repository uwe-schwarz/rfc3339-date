import { readFile, writeFile } from "node:fs/promises";
import { buildOpenApiArtifacts } from "./openapi-artifacts.mjs";

const openapiYaml = await readFile("docs/openapi.yaml", "utf8");
const artifacts = await buildOpenApiArtifacts(openapiYaml);

if (!artifacts.valid) {
  console.error(`Scalar parser validation failed during ${artifacts.stage} processing`);
  for (const error of artifacts.errors) {
    console.error(JSON.stringify(error, null, 2));
  }
  process.exit(1);
}

const output =
  `export const OPENAPI_YAML = ${JSON.stringify(openapiYaml)};\n` +
  `export const OPENAPI_JSON = ${JSON.stringify(artifacts.openapiJson)};\n` +
  `export const OPENAPI_SCALAR_COMPAT_JSON = ${JSON.stringify(artifacts.scalarCompatJson)};\n`;

await writeFile("docs/openapi.json", `${artifacts.openapiJson}\n`, "utf8");
await writeFile("docs/openapi.scalar.json", `${artifacts.scalarCompatJson}\n`, "utf8");
await writeFile("src/lib/openapi.generated.ts", output, "utf8");

console.log("Generated OpenAPI artifacts from docs/openapi.yaml");
