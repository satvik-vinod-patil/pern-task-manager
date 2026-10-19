import { loadConfig } from "./config.js";
import { pool } from "./db/pool.js";
import { createApp } from "./app.js";

const config = loadConfig(); // exits early with a clear message if JWT_SECRET is missing
const app = createApp(pool, config);

const server = app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port} (${config.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
