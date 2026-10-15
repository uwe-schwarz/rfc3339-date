import { readFile, writeFile } from "node:fs/promises";
import { createScalarCompatSpec } from "./openapi-artifacts.mjs";

// JSON is canonical. JSON is also valid YAML 1.2, preserving the YAML download
// without introducing a parser, serializer or a second editable contract.
const schema = JSON.parse(await readFile("public/openapi.json", "utf8"));
await writeFile("public/openapi.yaml", `${JSON.stringify(schema, null, 2)}\n`);
await writeFile(
  "public/openapi.scalar.json",
  `${JSON.stringify(createScalarCompatSpec(schema), null, 2)}\n`,
);
console.log("Updated the static YAML and Scalar downloads from public/openapi.json.");
