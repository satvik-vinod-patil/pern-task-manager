import jwt from "jsonwebtoken";
import { HttpError } from "../errors.js";

export function requireAuth(jwtSecret) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next(new HttpError(401, "Missing or malformed Authorization header."));
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = { id: payload.sub, email: payload.email };
      next();
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid token.";
      next(new HttpError(401, message));
    }
  };
}
