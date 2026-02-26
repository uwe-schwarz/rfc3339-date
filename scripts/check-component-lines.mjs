import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src");
const MAX_LINES = 300;
const INCLUDED = /\.(ts|tsx|js|jsx|html|css)$/;
const EXCLUDED = [/worker-configuration\.d\.ts$/, /\.generated\./];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (!INCLUDED.test(full) || EXCLUDED.some((pattern) => pattern.test(full))) {
      continue;
    }
    out.push(full);
  }
  return out;
}

const violations = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > MAX_LINES) {
    violations.push({ file: file.replace(`${process.cwd()}/`, ""), lines });
  }
}

if (violations.length > 0) {
  console.error(`Component line limit exceeded (${MAX_LINES} lines max):`);
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.lines} lines`);
  }
  process.exit(1);
}

console.log(`Component line check passed (<=${MAX_LINES} lines).`);
