import { Hono } from "hono";
import { registerConvertRoutes } from "./routes/convert.ts";
import { registerDatasetRoutes } from "./routes/datasets.ts";
import { registerDevUxRoutes } from "./routes/devux-core.ts";
import { registerDevUxHelperRoutes } from "./routes/devux-helpers.ts";
import { setHeaderSafely } from "./lib/http.ts";
import { registerMcpRoutes } from "./routes/mcp.ts";
import { registerPageRoutes } from "./routes/pages.ts";
import { registerTimeRoutes } from "./routes/time.ts";
import { registerTimezoneRoutes } from "./routes/timezones.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  c.res = setHeaderSafely(c.res, "X-Content-Type-Options", "nosniff");
});

registerPageRoutes(app);
registerMcpRoutes(app);
registerTimeRoutes(app);
registerConvertRoutes(app);
registerTimezoneRoutes(app);
registerDevUxRoutes(app);
registerDevUxHelperRoutes(app);
registerDatasetRoutes(app);

export default app;
