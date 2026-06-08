import { getAdminDb } from "../db.js";
import { normalizeEmail, serializeId } from "./format.js";

export async function addAdminLog({
  req,
  action,
  targetType = "system",
  targetUser,
  metadata = {},
  reason = "",
}) {
  const adminUser = req.adminUser || {};
  const doc = {
    adminId: serializeId(adminUser._id),
    adminEmail: normalizeEmail(adminUser.email),
    action,
    targetType,
    targetUserEmail: normalizeEmail(targetUser?.email || ""),
    targetUserId: serializeId(targetUser?._id),
    metadata,
    reason,
    createdAt: new Date(),
    request: {
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
    },
  };

  await getAdminDb().collection("adminLogs").insertOne(doc);
  return doc;
}

export function serializeAdminLog(log = {}) {
  return {
    id: serializeId(log._id),
    adminId: log.adminId || "",
    adminEmail: log.adminEmail || "",
    action: log.action || "",
    targetType: log.targetType || "",
    targetUserEmail: log.targetUserEmail || "",
    targetUserId: log.targetUserId || "",
    metadata: log.metadata || {},
    reason: log.reason || "",
    createdAt: log.createdAt || null,
    request: log.request || {},
  };
}
