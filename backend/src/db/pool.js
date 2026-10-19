import "dotenv/config";
import pg from "pg";

// Connection settings come only from environment variables.
export const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 10,
  connectionTimeoutMillis: 5000,
});

// Prevents the process from crashing on idle-client errors.
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});
