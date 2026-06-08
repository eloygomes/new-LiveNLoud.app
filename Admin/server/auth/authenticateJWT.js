import jwt from "jsonwebtoken";
import { getAccessSecret } from "../services/env.js";

export function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, getAccessSecret(), (error, user) => {
    if (error) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
