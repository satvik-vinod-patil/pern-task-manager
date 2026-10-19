import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { tasksRouter } from "./routes/tasks.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./errors.js";

// Dependencies (pool, config) are passed in so the app is easy to test.
export function createApp(pool, config) {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: "10kb" }));

  app.use(healthRouter(pool));
  app.use("/api/auth", authRouter(pool, config));
  app.use("/api/tasks", requireAuth(config.jwtSecret), tasksRouter(pool));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
