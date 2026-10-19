import { Router } from "express";
import { asyncHandler, HttpError } from "../errors.js";

const COLUMNS = "id, title, completed, created_at";

export function tasksRouter(pool) {
  const router = Router();

  // GET /api/tasks - all tasks for the logged-in user
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const result = await pool.query(
        `SELECT ${COLUMNS} FROM tasks WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
        [req.user.id]
      );
      res.json(result.rows);
    })
  );

  // POST /api/tasks - body: { "title": "Buy milk" }
  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
      if (!title) throw new HttpError(400, "Title is required.");
      if (title.length > 200) throw new HttpError(400, "Title must be 200 characters or fewer.");

      const result = await pool.query(
        `INSERT INTO tasks (user_id, title) VALUES ($1, $2) RETURNING ${COLUMNS}`,
        [req.user.id, title]
      );
      res.status(201).json(result.rows[0]);
    })
  );

  // PATCH /api/tasks/:id - body: { "completed": true } (defaults to true)
  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Task id must be a positive integer.");

      const completed = req.body?.completed ?? true;
      if (typeof completed !== "boolean") throw new HttpError(400, "'completed' must be true or false.");

      const result = await pool.query(
        `UPDATE tasks SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING ${COLUMNS}`,
        [completed, id, req.user.id]
      );
      if (result.rowCount === 0) throw new HttpError(404, "Task not found.");
      res.json(result.rows[0]);
    })
  );

  return router;
}
