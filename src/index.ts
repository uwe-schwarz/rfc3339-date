import { Hono } from "hono";
import { registerConvertRoutes } from "./routes/convert";
import { registerDatasetRoutes } from "./routes/datasets";
import { setHeaderSafely } from "./lib/http";
import { registerPageRoutes } from "./routes/pages";
import { registerTimeRoutes } from "./routes/time";
import { registerTimezoneRoutes } from "./routes/timezones";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  c.res = setHeaderSafely(c.res, "X-Content-Type-Options", "nosniff");
});

registerPageRoutes(app);
registerTimeRoutes(app);
registerConvertRoutes(app);
registerTimezoneRoutes(app);
registerDatasetRoutes(app);

export default app;
