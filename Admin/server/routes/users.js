import bcrypt from "bcrypt";
import { getTargetDb } from "../db.js";
import { addAdminLog } from "../services/adminLogs.js";
import { getUserWithData, serializeAuthUser } from "../services/users.js";

function requireReasonFor(status, reason) {
  return ["blocked", "rejected"].includes(status) && !String(reason || "").trim();
}

export function registerUserRoutes(app, { authenticateJWT, requireAdmin, requireTargetDb, proxyAdminDataApi }) {
  app.get("/api/users", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.get("/api/users/pending", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.get("/api/users/:userId", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.patch("/api/users/:userId/approval", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const decision = String(req.body?.decision || "").toLowerCase();
    const reason = String(req.body?.reason || "").trim();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "decision deve ser approve ou reject." });
    }

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });
    if (result.authUser.approvalStatus !== "pending") {
      return res.status(409).json({ message: "Usuario nao esta pendente." });
    }

    const now = new Date();
    const nextStatus = decision === "approve" ? "approved" : "rejected";
    await getTargetDb().collection("authUsers").updateOne(
      { _id: result.authUser._id },
      {
        $set: {
          approvalStatus: nextStatus,
          approvedAt: decision === "approve" ? now : null,
          rejectedAt: decision === "reject" ? now : null,
          lastAdminActionAt: now,
        },
        $unset: { approvalTokenHash: "" },
      },
    );

    await addAdminLog({
      req,
      action: `user_${nextStatus}`,
      targetType: "user",
      targetUser: result.authUser,
      reason,
    });

    const updated = await getUserWithData(req.params.userId);
    return res.json({ user: serializeAuthUser(updated.authUser, updated.dataDoc) });
  });

  app.patch("/api/users/:userId/status", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const status = String(req.body?.status || "").toLowerCase();
    const reason = String(req.body?.reason || "").trim();
    if (!["approved", "blocked", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status invalido." });
    }
    if (requireReasonFor(status, reason)) {
      return res.status(400).json({ message: "Motivo obrigatorio para este status." });
    }

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });

    const now = new Date();
    const set = {
      approvalStatus: status,
      lastAdminActionAt: now,
    };
    if (status === "blocked") {
      set.blockedAt = now;
      set.blockedByAdminId = req.adminUser._id;
      set.blockedReason = reason;
    }
    if (status === "rejected") {
      set.rejectedAt = now;
      set.rejectedReason = reason;
    }
    if (status === "approved") {
      set.approvedAt = result.authUser.approvedAt || now;
    }

    await getTargetDb().collection("authUsers").updateOne({ _id: result.authUser._id }, { $set: set });
    await addAdminLog({ req, action: `user_status_${status}`, targetType: "user", targetUser: result.authUser, reason });

    const updated = await getUserWithData(req.params.userId);
    return res.json({ user: serializeAuthUser(updated.authUser, updated.dataDoc) });
  });

  app.put("/api/users/:userId/password", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const newPassword = String(req.body?.newPassword || "");
    const reason = String(req.body?.reason || "").trim();
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "A nova senha deve ter pelo menos 8 caracteres." });
    }
    if (!reason) {
      return res.status(400).json({ message: "Motivo obrigatorio." });
    }

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });

    const isSamePassword = await bcrypt.compare(
      newPassword,
      result.authUser.passwordHash || "",
    );
    if (isSamePassword) {
      return res.status(409).json({ message: "A nova senha deve ser diferente da senha atual." });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      Number(process.env.BCRYPT_ROUNDS || 12),
    );
    const now = new Date();
    await getTargetDb().collection("authUsers").updateOne(
      { _id: result.authUser._id },
      {
        $set: {
          passwordHash,
          passwordChangedAt: now,
          passwordChangedByAdminId: req.adminUser._id,
          lastAdminActionAt: now,
        },
        $inc: { authVersion: 1 },
        $unset: {
          refreshToken: "",
          resetPasswordTokenHash: "",
          resetPasswordExpiresAt: "",
          resetPasswordRequestedAt: "",
        },
      },
    );

    await addAdminLog({
      req,
      action: "user_password_reset",
      targetType: "user",
      targetUser: result.authUser,
      reason,
      metadata: { sessionsInvalidated: true },
    });

    return res.json({
      message: "Senha redefinida e sessoes existentes invalidadas.",
    });
  });

  app.delete("/api/users/:userId", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Motivo obrigatorio." });

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });
    if (String(result.authUser._id) === String(req.adminUser._id)) {
      return res.status(409).json({ message: "Nao e permitido excluir a propria conta por esta rota." });
    }

    await getTargetDb().collection("authUsers").updateOne(
      { _id: result.authUser._id },
      {
        $set: {
          approvalStatus: "blocked",
          deletedAt: new Date(),
          deletedByAdminId: req.adminUser._id,
          deleteReason: reason,
          refreshToken: null,
        },
      },
    );
    await addAdminLog({ req, action: "user_soft_deleted", targetType: "user", targetUser: result.authUser, reason });
    return res.json({ message: "Usuario marcado como excluido." });
  });
}
