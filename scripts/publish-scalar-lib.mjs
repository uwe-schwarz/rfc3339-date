const ESC = String.fromCodePoint(27);
const ANSI_ESCAPE_PATTERN = new RegExp(`${ESC}\\[[0-?]*[ -/]*[@-~]`, "g");

function stripAnsi(text) {
  return text.replace(ANSI_ESCAPE_PATTERN, "");
}

export function extractCreatedProjectSlug(output) {
  const clean = stripAnsi(output);
  const match = clean.match(/Project slug:\s+([^\s]+)/);
  return match?.[1] ?? null;
}

export function resolveProjectPublishSlug(requestedSlug, createOutput) {
  return extractCreatedProjectSlug(createOutput) ?? requestedSlug;
}

export function shouldPublishProject(flag) {
  return /^(1|true|yes)$/i.test(flag ?? "");
}
