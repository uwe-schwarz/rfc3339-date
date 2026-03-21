import { readFile } from "node:fs/promises";
import { buildOpenApiArtifacts } from "./openapi-artifacts.mjs";

const specification = await readFile("docs/openapi.yaml", "utf8");
const result = await buildOpenApiArtifacts(specification);

if (result.valid) {
  console.log("Scalar parser validation passed for YAML, JSON, and Scalar-compatible JSON");
  process.exit(0);
}

console.error(`Scalar parser validation failed during ${result.stage} processing`);
for (const error of result.errors) {
  console.error(JSON.stringify(error, null, 2));
}
process.exit(1);
