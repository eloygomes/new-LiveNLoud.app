import { ObjectId } from "mongodb";
import { getAdminDb } from "../db.js";

export async function requireAdmin(req, res, next) {
  const userId = req.user?.userId;
  if (!userId || !ObjectId.isValid(userId)) return res.sendStatus(401);

  const authUser = await getAdminDb()
    .collection("adminUsers")
    .findOne({ _id: new ObjectId(userId) });

  if (
    !authUser ||
    authUser.approvalStatus !== "approved" ||
    authUser.role !== "admin" ||
    authUser.adminEnabled !== true ||
    authUser.deletedAt
  ) {
    return res.sendStatus(403);
  }

  req.adminUser = authUser;
  next();
}
