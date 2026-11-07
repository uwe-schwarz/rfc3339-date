import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  accountId: "3412b7b18e61869bba3dc055c8096f84",
  worker: {
    name: "rfc3339-date",
    entrypoint: "src/index.ts",
    compatibilityDate: "2025-09-27",
    compatibilityFlags: ["nodejs_compat"],
    previewUrls: true,
    domains: ["rfc3339.date"],
    observability: { enabled: false },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/", "/imprint", "/index.html", "/imprint.html"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  },
});
