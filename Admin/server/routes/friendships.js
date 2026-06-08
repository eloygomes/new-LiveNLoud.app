import { getTargetDb } from "../db.js";
import { addAdminLog } from "../services/adminLogs.js";
import { normalizeEmail } from "../services/format.js";
import { getUserWithData } from "../services/users.js";

export function registerFriendshipRoutes(app, { authenticateJWT, requireAdmin, requireTargetDb, proxyAdminDataApi }) {
  app.get("/api/friendships", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.get("/api/users/:userId/friendships", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.delete("/api/users/:userId/friendships/:counterpartEmail", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Motivo obrigatorio." });

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });

    const email = normalizeEmail(result.authUser.email);
    const counterpartEmail = normalizeEmail(req.params.counterpartEmail);
    await getTargetDb().collection("authUsers").updateMany(
      { email: { $in: [email, counterpartEmail] } },
      { $pull: { acceptedInvitations: { counterpartEmail: { $in: [email, counterpartEmail] } } } },
    );
    const invitations = await getTargetDb().collection("invitations").deleteMany({
      status: "pending",
      $or: [
        { senderEmail: email, receiverEmail: counterpartEmail },
        { senderEmail: counterpartEmail, receiverEmail: email },
      ],
    });

    await addAdminLog({
      req,
      action: "friendship_removed",
      targetType: "friendship",
      targetUser: result.authUser,
      metadata: { counterpartEmail, pendingInvitationsDeleted: invitations.deletedCount },
      reason,
    });

    return res.json({ removed: true, pendingInvitationsDeleted: invitations.deletedCount });
  });
}
