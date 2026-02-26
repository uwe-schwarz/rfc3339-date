import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

execSync(
  "pnpm exec tailwindcss -i ./src/styles/tailwind.css -o ./src/lib/tailwind.generated.css --minify",
  { stdio: "inherit" },
);

const css = readFileSync("./src/lib/tailwind.generated.css", "utf8");
writeFileSync(
  "./src/lib/tailwind.generated.ts",
  `export const TAILWIND_CSS = ${JSON.stringify(css)};\n`,
);
