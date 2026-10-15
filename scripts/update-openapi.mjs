import { readFile, writeFile } from "node:fs/promises";
import { createScalarCompatSpec } from "./openapi-artifacts.mjs";

// JSON is canonical. JSON is also valid YAML 1.2, preserving the YAML download
// without introducing a parser, serializer or a second editable contract.
const schema = JSON.parse(await readFile("public/openapi.json", "utf8"));
const downloads = {
  "public/openapi.yaml": schema,
  "public/openapi.scalar.json": createScalarCompatSpec(schema),
};
const checkOnly = process.argv.includes("--check");
for (const [file, value] of Object.entries(downloads)) {
  const expected = `${JSON.stringify(value, null, 2)}\n`;
  if (checkOnly) {
    const actual = await readFile(file, "utf8").catch(() => null);
    if (actual !== expected) {
      console.error(`${file} is out of date. Run pnpm run docs:update.`);
      process.exitCode = 1;
    }
  } else {
    await writeFile(file, expected);
  }
}
if (!process.exitCode)
  console.log(
    checkOnly
      ? "Static OpenAPI downloads agree with the canonical contract."
      : "Updated the static OpenAPI downloads.",
  );
