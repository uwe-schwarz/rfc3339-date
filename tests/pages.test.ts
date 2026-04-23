import { describe, expect, it } from "vitest";
import { renderImprint, renderLanding, SCALAR_REGISTRY_URL } from "../src/lib/html";

describe("renderLanding", () => {
  it("mentions the api focus, interactive controls, and openapi links", () => {
    const html = renderLanding("2026-01-01T00:00:00.000Z");

    expect(html).toContain(">rfc3339.date<");
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
    expect(html).toContain("<picture>");
    expect(html).toContain('type="image/avif"');
    expect(html).toContain('srcset="/fav-380.avif 1x, /fav-760.avif 2x"');
    expect(html).toContain('type="image/webp"');
    expect(html).toContain('srcset="/fav-380.webp 1x, /fav-760.webp 2x"');
    expect(html).toContain('src="/fav-380.png"');
    expect(html).toContain('srcset="/fav-380.png 1x, /fav-760.png 2x"');
    expect(html).toContain('alt="rfc3339.date clock emblem"');
    expect(html).toContain("navigator.modelContext.provideContext");
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
    expect(html).toContain('<meta property="og:image:alt" content="rfc3339.date clock emblem" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta name="twitter:image" content="https://rfc3339.date/fav.png" />');
  });
});

describe("renderImprint", () => {
  it("links to github and loads the contributions view from same origin", () => {
    const html = renderImprint();

    expect(html).toContain("https://github.com/uwe-schwarz");
    expect(html).toContain("/github/uwe-schwarz/contributions");
    expect(html).toContain("Loading GitHub contribution stats");
    expect(html).not.toContain("proxy.scalar.com");
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
