export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Lets async route handlers pass errors to Express (Express 4 does not do this itself).
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const DB_DOWN_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "57P03", // cannot_connect_now
  "28P01", // invalid_password
  "3D000", // database does not exist
  "42P01", // table missing (migration not run)
]);

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON." });
  }

  if (err.code === "23505") {
    return res.status(409).json({ error: "That record already exists." });
  }

  if (DB_DOWN_CODES.has(err.code) || err.code?.startsWith?.("08")) {
    console.error("Database error:", err.code, err.message);
    return res.status(503).json({
      error: "Database is unavailable. Check the database connection and that migrations have run.",
    });
  }

  // Never leak internal details to the client.
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
}
