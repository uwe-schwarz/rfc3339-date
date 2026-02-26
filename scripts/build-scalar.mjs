import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const packageEntrypoint = require.resolve("rapidoc");
const packageRoot = path.resolve(path.dirname(packageEntrypoint), "..");
const outputDir = path.resolve("public/rapidoc");

await mkdir(outputDir, { recursive: true });
await cp(path.join(packageRoot, "dist", "rapidoc-min.js"), path.join(outputDir, "rapidoc-min.js"));

console.log("Copied RapiDoc assets to public/rapidoc");
