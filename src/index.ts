import { Hono } from "hono";
import { registerConvertRoutes } from "./routes/convert";
import { registerDatasetRoutes } from "./routes/datasets";
import { registerDevUxRoutes } from "./routes/devux-core";
import { registerDevUxHelperRoutes } from "./routes/devux-helpers";
import { setHeaderSafely } from "./lib/http";
import { registerMcpRoutes } from "./routes/mcp";
import { registerPageRoutes } from "./routes/pages";
import { registerTimeRoutes } from "./routes/time";
import { registerTimezoneRoutes } from "./routes/timezones";

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
