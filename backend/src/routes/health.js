import { Router } from "express";

export function healthRouter(pool) {
  const router = Router();

  // Liveness: is the backend process running? Does not touch the database.
  router.get("/health", (req, res) => {
    res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
  });

  // Readiness: can the backend reach the database? Exposes no credentials.
  router.get("/health/db", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", database: "reachable" });
    } catch (err) {
      console.error("Database readiness check failed:", err.message);
      res.status(503).json({ status: "error", database: "unreachable" });
    }
  });

  return router;
}
