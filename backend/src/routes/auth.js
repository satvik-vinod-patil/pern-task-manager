import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler, HttpError } from "../errors.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(body) {
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email) || email.length > 255) {
    throw new HttpError(400, "A valid email is required.");
  }
  if (password.length < 8 || password.length > 72) {
    throw new HttpError(400, "Password must be between 8 and 72 characters.");
  }
  return { email, password };
}

export function authRouter(pool, config) {
  const router = Router();

  const signToken = (user) =>
    jwt.sign({ email: user.email }, config.jwtSecret, {
      subject: String(user.id),
      expiresIn: config.jwtExpiresIn,
    });

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const { email, password } = readCredentials(req.body);
      const passwordHash = await bcrypt.hash(password, 10);

      let result;
      try {
        result = await pool.query(
          "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
          [email, passwordHash]
        );
      } catch (err) {
        if (err.code === "23505") {
          throw new HttpError(409, "An account with that email already exists.");
        }
        throw err;
      }

      const user = result.rows[0];
      res.status(201).json({ token: signToken(user), user });
    })
  );

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const { email, password } = readCredentials(req.body);

      const result = await pool.query(
        "SELECT id, email, password_hash FROM users WHERE email = $1",
        [email]
      );
      const row = result.rows[0];
      const ok = row && (await bcrypt.compare(password, row.password_hash));

      // Same message for unknown email and wrong password, on purpose.
      if (!ok) throw new HttpError(401, "Invalid email or password.");

      const user = { id: row.id, email: row.email };
      res.json({ token: signToken(user), user });
    })
  );

  return router;
}
