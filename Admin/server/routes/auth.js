import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getAdminDb } from "../db.js";
import { normalizeEmail, serializeId } from "../services/format.js";
import { getAccessSecret, getRefreshSecret } from "../services/env.js";

const genAccessToken = (id) =>
  jwt.sign({ userId: id }, getAccessSecret(), { expiresIn: "15m" });
const genRefreshToken = (id) =>
  jwt.sign({ userId: id }, getRefreshSecret(), { expiresIn: "7d" });

function serializeMe(user = {}) {
  return {
    id: serializeId(user._id),
    email: normalizeEmail(user.email),
    role: user.role || "user",
    adminEnabled: user.adminEnabled === true,
    approvalStatus: user.approvalStatus || "pending",
  };
}

export function registerAuthRoutes(app, { authenticateJWT, requireAdmin }) {
  app.post("/api/auth/login", async (req, res) => {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    try {
      const user = await getAdminDb().collection("adminUsers").findOne({ email });
      if (!user) return res.status(401).json({ error: "Credenciais invalidas" });

      const valid = await bcrypt.compare(password, user.passwordHash || "");
      if (!valid) return res.status(401).json({ error: "Credenciais invalidas" });

      if (
        user.approvalStatus !== "approved" ||
        user.role !== "admin" ||
        user.adminEnabled !== true ||
        user.deletedAt
      ) {
        return res.status(403).json({ error: "Acesso administrativo nao autorizado" });
      }

      const accessToken = genAccessToken(user._id.toString());
      const refreshToken = genRefreshToken(user._id.toString());

      await getAdminDb().collection("adminUsers").updateOne({ _id: user._id }, { $set: { refreshToken } });

      return res.json({ accessToken, refreshToken });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    try {
      const payload = jwt.verify(refreshToken, getRefreshSecret());
      if (!ObjectId.isValid(payload.userId)) return res.sendStatus(403);

      const user = await getAdminDb().collection("adminUsers").findOne({ _id: new ObjectId(payload.userId) });
      if (
        !user ||
        user.refreshToken !== refreshToken ||
        user.approvalStatus !== "approved" ||
        user.role !== "admin" ||
        user.adminEnabled !== true ||
        user.deletedAt
      ) {
        return res.sendStatus(403);
      }

      return res.json({ accessToken: genAccessToken(user._id.toString()) });
    } catch {
      return res.sendStatus(403);
    }
  });

  app.get("/api/me", authenticateJWT, requireAdmin, async (req, res) => {
    return res.json(serializeMe(req.adminUser));
  });
}
