export const LANDING_PAGE_STYLES = `<style>
    .neo-page {
      --neo-paper: #fff7d6;
      --neo-paper-2: #f4e8ba;
      --neo-ink: #101014;
      --neo-muted: #3d3a33;
      --neo-panel: #fffef5;
      --neo-panel-strong: #101014;
      --neo-cyan: #27d7ff;
      --neo-lime: #b7ff2a;
      --neo-coral: #ff5a5f;
      --neo-violet: #8568ff;
      --neo-shadow: #101014;
      --neo-code: #fff7d6;
      color: var(--neo-ink);
      overflow-x: clip;
      padding-bottom: 0.75rem;
    }
    :root[data-theme="dark"] .neo-page {
      --neo-paper: #24212b;
      --neo-paper-2: #312d38;
      --neo-ink: #fff7d6;
      --neo-muted: #d8cfa6;
      --neo-panel: #302c37;
      --neo-panel-strong: #101014;
      --neo-shadow: #07070a;
      --neo-code: #f7f2dc;
      color: var(--neo-ink);
    }
    body:has(.neo-page) {
      background:
        linear-gradient(90deg, color-mix(in oklab, var(--neo-ink, #101014) 12%, transparent) 1px, transparent 1px),
        linear-gradient(color-mix(in oklab, var(--neo-ink, #101014) 12%, transparent) 1px, transparent 1px),
        var(--neo-paper, #fff7d6);
      background-size: 28px 28px;
      color: var(--neo-ink, #101014);
      text-shadow: none;
    }
    :root[data-theme="dark"] body:has(.neo-page) {
      background:
        radial-gradient(circle at 1px 1px, rgb(255 247 214 / 0.08) 1px, transparent 1.4px),
        linear-gradient(90deg, rgb(255 247 214 / 0.08) 1px, transparent 1px),
        linear-gradient(rgb(255 247 214 / 0.08) 1px, transparent 1px),
        var(--neo-paper);
      background-size: 14px 14px, 28px 28px, 28px 28px, 100% 100%;
      color: #fff7d6;
    }
    .neo-panel {
      background: var(--neo-panel);
      border: 3px solid var(--neo-ink);
      border-radius: 0;
      color: var(--neo-ink);
    }
    .neo-shadow { box-shadow: 8px 8px 0 var(--neo-shadow); }
    .neo-shadow-small { box-shadow: 5px 5px 0 var(--neo-shadow); }
    .neo-hero { border: 4px solid var(--neo-ink); background: var(--neo-panel); box-shadow: 12px 12px 0 var(--neo-shadow); }
    .neo-hero-title { color: var(--neo-ink); text-transform: none; letter-spacing: 0; }
    .neo-logo-panel { background: #101014; }
    .neo-logo-mat {
      background:
        radial-gradient(circle, rgb(16 16 20 / 0.11) 1px, transparent 1.3px),
        linear-gradient(135deg, #d9cf9f, #efe3b5 52%, #cfc38f);
      background-size: 9px 9px, 100% 100%;
      border: 3px solid #101014;
    }
    .neo-label {
      color: var(--neo-ink);
      font-family: "Geist Mono", monospace;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .neo-muted { color: var(--neo-muted); }
    .neo-stamp {
      display: inline-flex;
      align-items: center;
      min-height: 2rem;
      border: 2px solid var(--neo-ink);
      background: var(--neo-lime);
      box-shadow: 3px 3px 0 var(--neo-shadow);
      color: #101014;
      font-family: "Geist Mono", monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .neo-chip {
      border: 3px solid var(--neo-ink);
      background: var(--neo-cyan);
      box-shadow: 5px 5px 0 var(--neo-shadow);
      color: #101014;
      font-weight: 700;
      min-height: 3.25rem;
    }
    .neo-chip:nth-child(2) { background: var(--neo-lime); }
    .neo-chip:nth-child(3) { background: var(--neo-coral); color: #101014; }
    .neo-chip button { min-height: 3.25rem; }
    .neo-warning {
      border: 3px solid var(--neo-ink);
      background: var(--neo-coral);
      box-shadow: 6px 6px 0 var(--neo-shadow);
      color: #101014;
      font-weight: 700;
    }
    .neo-hero-controls {
      margin-bottom: 2rem;
      padding-right: 0.25rem;
    }
    .neo-theme-toggle {
      border: 3px solid var(--neo-ink);
      background: var(--neo-lime);
      box-shadow: 5px 5px 0 var(--neo-shadow);
      color: #101014;
      cursor: pointer;
      font-family: "Geist Mono", monospace;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 0.5rem 0.7rem;
      text-transform: uppercase;
    }
    .neo-theme-toggle input { position: absolute; opacity: 0; }
    .neo-theme-toggle .mode-track {
      display: inline-flex;
      align-items: center;
      width: 3.1rem;
      height: 1.7rem;
      border: 2px solid #101014;
      background: #fff7d6;
      margin: 0 0.45rem;
    }
    .neo-theme-toggle .mode-thumb {
      width: 1.05rem;
      height: 1.05rem;
      margin-left: 0.18rem;
      background: #101014;
      transition: transform 160ms ease;
    }
    .neo-theme-toggle input:checked + .mode-track .mode-thumb { transform: translateX(1.35rem); }
    .neo-theme-toggle input:focus-visible + .mode-track { outline: 3px solid var(--neo-violet); outline-offset: 3px; }
    .example-card { position: relative; overflow: hidden; container-name: example-card; container-type: inline-size; }
    .example-card::before {
      content: "";
      position: absolute;
      inset: 0 auto auto 0;
      width: 0.65rem;
      height: 100%;
      background: var(--neo-violet);
    }
    .example-fields { grid-template-columns: minmax(0, 1fr); }
    @container example-card (min-width: 42rem) {
      .example-fields[data-field-count="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .example-fields[data-field-count="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    .neo-field input,
    .neo-field select {
      border: 2px solid var(--neo-ink);
      background: var(--neo-paper);
      color: var(--neo-ink);
      border-radius: 0;
      box-shadow: 3px 3px 0 var(--neo-shadow);
    }
    .neo-field input:focus,
    .neo-field select:focus { box-shadow: 4px 4px 0 var(--neo-violet); }
    .neo-code-panel,
    .neo-output-panel {
      border: 3px solid var(--neo-ink);
      background: var(--neo-panel-strong);
      color: var(--neo-code);
      border-radius: 0;
      box-shadow: 5px 5px 0 var(--neo-shadow);
      max-width: 100%;
      min-width: 0;
    }
    .neo-code-panel header,
    .neo-output-panel header {
      border-bottom: 3px solid var(--neo-ink);
      background: var(--neo-cyan);
      color: #101014;
    }
    .neo-code-panel header .neo-label,
    .neo-output-panel header .neo-label { color: #101014; }
    .neo-output-panel header { background: var(--neo-lime); }
    .neo-code-panel pre,
    .neo-output-panel pre {
      background: color-mix(in oklab, var(--neo-panel-strong) 90%, black);
      max-width: 100%;
      min-width: 0;
    }
    .code-shell { color: var(--neo-code); }
    .code-cmd { color: var(--neo-lime); }
    .code-flag { color: var(--neo-cyan); }
    .code-url { color: var(--neo-coral); }
    .code-arg { color: var(--neo-violet); }
    .code-output-error { color: var(--neo-coral); }
    .neo-copy-button {
      border: 2px solid #101014;
      background: #fff7d6;
      box-shadow: 3px 3px 0 #101014;
      color: #101014;
      font-family: "Geist Mono", monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.65rem;
      text-transform: uppercase;
    }
    .neo-copy-button:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #101014; }
    .neo-status { color: #101014; font-weight: 700; }
    .neo-section { margin-bottom: 3rem; }
    .neo-footer-nav a {
      border: 3px solid var(--neo-ink);
      background: var(--neo-panel);
      box-shadow: 4px 4px 0 var(--neo-shadow);
      color: var(--neo-ink);
      font-family: "Geist Mono", monospace;
      font-weight: 700;
      padding: 0.65rem 0.8rem;
      text-decoration: none;
    }
    .neo-footer-nav a:hover { background: var(--neo-cyan); color: #101014; transform: translate(-1px, -1px); }
    @media (max-width: 42rem) {
      .neo-shadow { box-shadow: 5px 5px 0 var(--neo-shadow); }
      .neo-shadow-small { box-shadow: 4px 4px 0 var(--neo-shadow); }
      .neo-hero { box-shadow: 6px 6px 0 var(--neo-shadow); }
      .neo-chip { box-shadow: 4px 4px 0 var(--neo-shadow); }
      .neo-warning { box-shadow: 4px 4px 0 var(--neo-shadow); }
      .neo-hero-controls { justify-content: flex-start; margin-bottom: 1.25rem; }
      .neo-theme-toggle { box-shadow: 4px 4px 0 var(--neo-shadow); }
    }
    kbd, samp, var { font: inherit; }
    var { font-style: normal; }
  </style>`;
