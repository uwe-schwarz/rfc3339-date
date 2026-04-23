import { buildWebMcpRegistrationScript } from "./webmcp";

export function landingScript(): string {
  return `<script>
    const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    const sh = (value) => value.replaceAll("\\\\", "\\\\\\\\").replaceAll('"', '\\\\"').replaceAll("$", "\\\\$").replaceAll("\`", "\\\\\`");
    const enc = (name, value) => '--data-urlencode "' + name + "=" + sh(value) + '"';
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const wantsJson = () => document.getElementById("json-toggle")?.checked ?? false;
    const helperNode = () => document.getElementById("helper-code");
    const writeClipboard = async (text) => {
      if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
      const probe = document.createElement("textarea");
      probe.value = text; probe.setAttribute("readonly", ""); probe.style.position = "fixed"; probe.style.opacity = "0";
      document.body.append(probe); probe.select(); document.execCommand("copy"); probe.remove();
    };
    const colorize = (parts) => '<code class="code-shell language-bash">' + parts.map(([kind, value]) => '<span class="code-' + kind + '">' + esc(value) + "</span>").join(" ") + "</code>";
    const helperText = () => [
      "eventlocal() {",
      '  curl --get "https://rfc3339.date/tz/convert" \\\\',
      '    --data-urlencode "value=$*" \\\\',
      '    ' + enc("to", browserZone),
      "}",
    ].join("\\n");
    const setBrowserZoneDefaults = () => {
      document.getElementById("browser-tz").textContent = browserZone;
      for (const input of document.querySelectorAll("[data-browser-zone-field]")) if (!input.value.trim()) input.value = browserZone;
      if (helperNode()) helperNode().textContent = helperText();
    };
    const requestForCard = (card) => {
      const kind = card.dataset.card;
      const json = wantsJson();
      if (kind === "tz-convert") {
        const value = card.querySelector('[data-field="value"]').value.trim();
        const to = card.querySelector('[data-field="to"]').value.trim();
        const from = card.querySelector('[data-field="from"]').value.trim();
        const base = card.querySelector('[data-field="base"]').value.trim();
        const params = new URLSearchParams({ value, to });
        const parts = [["cmd", "curl"], ["flag", "--get"], ["url", '"https://rfc3339.date/tz/convert"'], ["arg", enc("value", value)], ["arg", enc("to", to)]];
        if (from) { params.set("from", from); parts.push(["arg", enc("from", from)]); }
        if (base) { params.set("base", base); parts.push(["arg", enc("base", base)]); }
        if (json) { params.set("json", "1"); parts.push(["arg", enc("json", "1")]); }
        return { url: "/tz/convert?" + params.toString(), command: parts.map(([, value]) => value).join(" "), markup: colorize(parts) };
      }
      if (kind === "now-zone") {
        const tz = card.querySelector('[data-field="tz"]').value.trim() || browserZone;
        const tail = encodeURIComponent(tz) + (json ? "?json=1" : "");
        const parts = [["cmd", "curl"], ["url", '"https://rfc3339.date/now/' + tail + '"']];
        return { url: "/now/" + tail, command: parts.map(([, value]) => value).join(" "), markup: colorize(parts) };
      }
      const value = card.querySelector('[data-field="value"]').value.trim();
      const input = card.querySelector('[data-field="in"]').value.trim();
      const out = card.querySelector('[data-field="out"]').value.trim();
      const params = new URLSearchParams({ value, in: input, out });
      const parts = [["cmd", "curl"], ["flag", "--get"], ["url", '"https://rfc3339.date/convert"'], ["arg", enc("value", value)], ["arg", enc("in", input)], ["arg", enc("out", out)]];
      if (json) { params.set("json", "1"); parts.push(["arg", enc("json", "1")]); }
      return { url: "/convert?" + params.toString(), command: parts.map(([, value]) => value).join(" "), markup: colorize(parts) };
    };
    const renderOutput = async (card) => {
      const request = requestForCard(card);
      const status = card.querySelector("[data-status]");
      const output = card.querySelector("[data-output]");
      const outputWrapper = card.querySelector("[data-output-wrapper]");
      card.querySelector("[data-command]").innerHTML = request.markup;
      status.textContent = "loading";
      outputWrapper?.setAttribute("aria-busy", "true");
      try {
        const response = await fetch(request.url);
        const raw = await response.text();
        let text = raw;
        if (wantsJson() || raw.trim().startsWith("{")) {
          try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch {}
        }
        status.textContent = response.ok ? "200 ok" : String(response.status);
        output.classList.toggle("code-output-error", !response.ok);
        output.textContent = text;
        outputWrapper?.setAttribute("aria-busy", "false");
      } catch {
        status.textContent = "error";
        output.classList.add("code-output-error");
        output.textContent = wantsJson() ? '{\\n  "error": "network_error",\\n  "message": "Could not reach the API."\\n}' : "Could not reach the API.";
        outputWrapper?.setAttribute("aria-busy", "false");
      }
    };
    const bindCard = (card) => {
      let timer = 0;
      const refresh = () => { clearTimeout(timer); timer = window.setTimeout(() => void renderOutput(card), 220); };
      for (const input of card.querySelectorAll("[data-field]")) input.addEventListener("input", refresh);
      card.querySelector("[data-example-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        void renderOutput(card);
      });
      card.querySelector("[data-copy]").addEventListener("click", async (event) => {
        const button = event.currentTarget;
        await writeClipboard(requestForCard(card).command);
        button.textContent = "Copied";
        window.setTimeout(() => { button.textContent = "Copy"; }, 1200);
      });
      void renderOutput(card);
    };
    const bindCopyTarget = (button) => {
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget || "");
        if (!target) return;
        await writeClipboard(target.textContent ?? "");
        button.textContent = "Copied";
        window.setTimeout(() => { button.textContent = "Copy"; }, 1200);
      });
    };
    ${buildWebMcpRegistrationScript()}
    addEventListener("DOMContentLoaded", () => {
      registerWebMcpContext();
      setBrowserZoneDefaults();
      const cards = [...document.querySelectorAll("[data-example]")];
      for (const card of cards) bindCard(card);
      for (const button of document.querySelectorAll("[data-copy-target]")) bindCopyTarget(button);
      document.getElementById("reset-my-timezone")?.addEventListener("click", () => {
        for (const input of document.querySelectorAll("[data-browser-zone-field]")) input.value = browserZone;
        if (helperNode()) helperNode().textContent = helperText();
        for (const card of cards) void renderOutput(card);
      });
      document.getElementById("json-toggle")?.addEventListener("change", () => { for (const card of cards) void renderOutput(card); });
      helperNode()?.closest("section")?.querySelector("[data-copy]")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        await writeClipboard(helperText());
        button.textContent = "Copied";
        window.setTimeout(() => { button.textContent = "Copy"; }, 1200);
      });
    });
  </script>`;
}
