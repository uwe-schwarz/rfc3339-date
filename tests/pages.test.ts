import { describe, expect, it } from "vitest";
import { renderImprint, renderLanding, SCALAR_REGISTRY_URL } from "../src/lib/html";
import { LANDING_PAGE_STYLES } from "../src/lib/landing-page-styles";

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("renderLanding", () => {
  it("mentions the api focus, interactive controls, and openapi links", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain(">rfc3339.date<");
    expect(html).not.toContain('<a class="neo-label" href="/">rfc3339.date</a>');
    expect(html).toContain("Strict RFC3339 time API");
    expect(html).toContain("This is a fun project");
    expect(html).toContain("not a reliable source of correct date or time");
    expect(html).toContain("Reset to my timezone");
    expect(html).toContain("Plain text");
    expect(html).toContain("JSON output");
    expect(html).toContain("https://rfc3339.date/tz/convert");
    expect(html).toContain("https://rfc3339.date/convert");
    expect(html).toContain('id="helper-code"');
    expect(html).toContain("eventlocal() {");
    expect(html).toContain('data-field="value"');
    expect(html).toContain('<select id="convert-unix-in" data-field="in"');
    expect(html).toContain('<option value="excel1900">excel1900</option>');
    expect(html).toContain('<option value="emaildate">emaildate</option>');
    expect(html).toContain(SCALAR_REGISTRY_URL);
    expect(html).toContain('href="/openapi.yaml"');
    expect(html).toContain('href="/openapi.json"');
    expect(html).toContain('href="/openapi.scalar.json"');
    expect(html).toContain("Agent Discovery");
    expect(html).toContain("Install MCP");
    expect(html).toContain("codex mcp add rfc3339 --url https://rfc3339.date/mcp");
    expect(html).toContain("Opencode");
    expect(html).toContain("https://opencode.ai/config.json");
    expect(html).toContain("&quot;mcp&quot;");
    expect(html).toContain("&quot;type&quot;: &quot;remote&quot;");
    expect(html).toContain('data-copy-target="codex-mcp-install"');
    expect(html).toContain('data-copy-target="opencode-mcp-install"');
    expect(html).toContain('href="/.well-known/agent-skills/rfc3339-date/SKILL.md"');
    expect(html).toContain(">SKILL.md<");
    expect(html).not.toContain('href="/.well-known/mcp/server-card.json"');
    expect(html).not.toContain('href="/.well-known/agent-skills/index.json"');
    expect(html).not.toContain('href="/mcp"');
    expect(html).not.toContain("There is no browser link here because the transport is meant for MCP clients, not direct navigation.");
    expect(html).not.toContain("Published Skill");
    expect(html).not.toContain("WebMCP Browser Tools");
    expect(html).toContain("<picture ");
    expect(html).toContain("neo-logo-mat");
    expect(html).toContain('type="image/avif"');
    expect(html).toContain('srcset="/logo-560.avif 560w, /logo-1115.avif 1115w"');
    expect(html).toContain('type="image/webp"');
    expect(html).toContain('srcset="/logo-560.webp 560w, /logo-1115.webp 1115w"');
    expect(html).toContain('src="/logo-560.png"');
    expect(html).toContain('srcset="/logo-560.png 560w, /logo-1115.png 1115w"');
    expect(html).toContain('alt="rfc3339.date logo"');
    expect(html).toContain("navigator.modelContext.provideContext");
  });

  it("renders neobrutalist light and dark mode controls", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain("neo-page");
    expect(html).toContain("neo-panel");
    expect(html).toContain("neo-shadow");
    expect(html).toContain("neo-hero-controls");
    expect(html).toContain('id="theme-toggle"');
    expect(html).toContain('data-theme-toggle="1"');
    expect(html).toContain("Light");
    expect(html).toContain("Dark");
    expect(html).not.toContain('data-theme-preview="dark"');
    expect(html).not.toContain("Dark mode preview");
    expect(html).toContain('matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"');
    expect(html).toContain('document.documentElement.dataset.theme = theme');
    expect(html).toContain('localStorage.setItem("rfc3339-theme", theme)');
  });

  it("keeps neobrutalist text colors at WCAG AA contrast", () => {
    expect(LANDING_PAGE_STYLES).toContain("--neo-paper: #fff7d6");

    const pairs = [
      ["light ink on paper", "#101014", "#fff7d6"],
      ["light muted on paper", "#3d3a33", "#fff7d6"],
      ["light ink on panel", "#101014", "#fffef5"],
      ["dark ink on paper", "#fff7d6", "#24212b"],
      ["dark muted on paper", "#d8cfa6", "#24212b"],
      ["dark ink on panel", "#fff7d6", "#302c37"],
      ["light code on strong panel", "#fff7d6", "#101014"],
      ["dark code on strong panel", "#fff7d6", "#101014"],
      ["ink on cyan", "#101014", "#27d7ff"],
      ["ink on lime", "#101014", "#b7ff2a"],
      ["ink on coral", "#101014", "#ff5a5f"],
      ["cyan code on black", "#27d7ff", "#101014"],
      ["lime code on black", "#b7ff2a", "#101014"],
      ["coral code on black", "#ff5a5f", "#101014"],
      ["violet code on black", "#8568ff", "#101014"],
    ] as const;

    for (const [label, foreground, background] of pairs) {
      expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("renders two event cards and two additional api examples", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html.match(/data-example="/g)).toHaveLength(4);
    expect(html.match(/data-card="tz-convert"/g)).toHaveLength(2);
    expect(html).toContain('data-card="now-zone"');
    expect(html).toContain('data-card="convert"');
  });

  it("uses semantic inline elements for code, variables, user input, and sample output", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain("<code>/tz/convert</code>");
    expect(html).toContain("<code>/now/<var>tz</var></code>");
    expect(html).toContain("<var>value</var>");
    expect(html).toContain("<var>base</var>");
    expect(html).toContain('<var id="browser-tz"');
    expect(html).toContain("<kbd");
    expect(html).toContain(">tomorrow 10am PST</kbd>");
    expect(html).toContain('<samp data-status');
    expect(html).toContain('<samp data-output');
  });

  it("uses modern semantic structures for interactive examples and technical copy", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html.match(/<form data-example-form/g)).toHaveLength(4);
    expect(html.match(/<fieldset class="example-fields/g)).toHaveLength(4);
    expect(html).toContain("<legend");
    expect(html).toContain("<output");
    expect(html).toContain("aria-live=\"polite\"");
    expect(html).toContain("<time datetime=\"2026-01-15T12:00:00Z\">2026-01-15T12:00:00Z</time>");
    expect(html).toContain('<abbr title="Request for Comments 3339">RFC3339</abbr>');
    expect(html).toContain('<abbr title="Daylight Saving Time">DST</abbr>');
    expect(html).toContain('<abbr title="Standard Time">STD</abbr>');
    expect(html).toContain("<ul class=\"fx-enter fx-delay-1 mb-8 grid gap-3 lg:grid-cols-4\"");
    expect(html).toContain("<li");
    expect(html).toContain("container-type: inline-size");
    expect(html).toContain("@container example-card");
    expect(html).toContain("min-h-dvh");
  });

  it("wires live output submit handling, busy state, and stale response guards", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain("data-output-wrapper");
    expect(html).toContain("data-output");
    expect(html).toContain("data-status");
    expect(html).toContain('addEventListener("submit"');
    expect(html).toContain("event.preventDefault()");
    expect(html).toContain("clearTimeout(timer)");
    expect(html).toContain('setAttribute("aria-busy", "true")');
    expect(html).toContain('setAttribute("aria-busy", "false")');
    expect(html).toContain("const latestRender = new WeakMap()");
    expect(html).toContain("const isLatestRender = () => latestRender.get(card) === renderId");
    expect(html).toContain("if (!isLatestRender()) return");
    expect(html).toContain("output.textContent = text");
    expect(html).toContain("status.textContent = response.ok ? \"200 ok\" : String(response.status)");
  });

  it("includes standard favicon metadata", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain('href="/favicon.ico"');
    expect(html).toContain('href="/favicon-32x32.png"');
    expect(html).toContain('href="/favicon-16x16.png"');
    expect(html).toContain('href="/apple-touch-icon.png"');
    expect(html).toContain('href="/site.webmanifest"');
  });

  it("includes canonical, open graph, and twitter metadata using the logo image", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain(
      '<meta name="description" content="Strict RFC3339 time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing." />',
    );
    expect(html).toContain('<link rel="canonical" href="https://rfc3339.date/" />');
    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta property="og:title" content="rfc3339.date" />');
    expect(html).toContain(
      '<meta property="og:description" content="Strict RFC3339 time API for current time, validation, conversion, timezone lookup, transitions, and human event-time parsing." />',
    );
    expect(html).toContain('<meta property="og:url" content="https://rfc3339.date/" />');
    expect(html).toContain('<meta property="og:image" content="https://rfc3339.date/fav.png" />');
    expect(html).toContain('<meta property="og:image:width" content="660" />');
    expect(html).toContain('<meta property="og:image:height" content="660" />');
    expect(html).toContain('<meta property="og:image:alt" content="rfc3339.date icon" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta name="twitter:image" content="https://rfc3339.date/fav.png" />');
    expect(html).toContain('<meta name="twitter:image:alt" content="rfc3339.date icon" />');
  });
});

describe("renderImprint", () => {
  it("links to github and loads the contributions view from same origin", () => {
    const html = renderImprint();

    expect(html).toContain('<a class="neo-label" href="/">← Back to main</a>');
    expect(html).not.toContain('<a class="neo-label" href="/">rfc3339.date</a>');
    expect(html).toContain("https://github.com/uwe-schwarz");
    expect(html).toContain("/github/uwe-schwarz/contributions");
    expect(html).toContain("Loading GitHub contribution stats");
    expect(html).not.toContain("proxy.scalar.com");
  });

  it("uses the shared neobrutalist theme system", () => {
    const html = renderImprint();

    expect(html).toContain("neo-page");
    expect(html).toContain("neo-panel");
    expect(html).toContain("neo-shadow");
    expect(html).toContain('id="theme-toggle"');
    expect(html).toContain('data-theme-toggle="1"');
    expect(html).toContain('matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"');
    expect(html).toContain('document.documentElement.dataset.theme = theme');
    expect(html).toContain('localStorage.setItem("rfc3339-theme", theme)');
    expect(html).not.toContain("surface-card");
    expect(html).not.toContain("bg-zinc-950/40");
    expect(html).not.toContain("text-lime-");
    expect(html).not.toContain("fx-flicker");
  });

  it("keeps the scalar registry target in one place", () => {
    expect(SCALAR_REGISTRY_URL).toBe(
      "https://registry.scalar.com/@iq42/apis/rfc3339date-time-api@latest",
    );
  });

  it("uses local styles and no rapidoc assets", () => {
    const html = renderImprint();

    expect(html).toContain('href="/styles.css"');
    expect(html).not.toContain("rapidoc-min.js");
  });

  it("includes share metadata for the imprint page", () => {
    const html = renderImprint();

    expect(html).toContain('<link rel="canonical" href="https://rfc3339.date/imprint" />');
    expect(html).toContain('<meta property="og:title" content="rfc3339.date imprint" />');
    expect(html).toContain('<meta property="og:url" content="https://rfc3339.date/imprint" />');
    expect(html).toContain('<meta property="og:image" content="https://rfc3339.date/fav.png" />');
  });
});
