import { ObjectId } from "mongodb";
import { getTargetDb } from "../db.js";
import { isSongEntry, normalizeEmail, safeDate, serializeId } from "./format.js";

export function serializeAuthUser(user = {}, dataDoc = {}) {
  const profileEntry = Array.isArray(dataDoc?.userdata)
    ? dataDoc.userdata.find((entry) => entry && typeof entry === "object")
    : null;
  const songs = Array.isArray(dataDoc?.userdata) ? dataDoc.userdata.filter(isSongEntry) : [];
  const acceptedInvitations = Array.isArray(user.acceptedInvitations)
    ? user.acceptedInvitations
    : [];
  const resetRequestedAt = user.resetPasswordRequestedAt || (
    user.resetPasswordExpiresAt
      ? new Date(new Date(user.resetPasswordExpiresAt).getTime() - 30 * 60 * 1000)
      : null
  );

  return {
    id: serializeId(user._id),
    email: normalizeEmail(user.email),
    username: profileEntry?.username || user.username || "",
    fullName: profileEntry?.fullName || user.fullName || "",
    role: user.role || "user",
    adminEnabled: user.adminEnabled === true,
    approvalStatus: user.approvalStatus || "pending",
    approvalRequestedAt: safeDate(user.approvalRequestedAt),
    approvedAt: safeDate(user.approvedAt),
    rejectedAt: safeDate(user.rejectedAt),
    blockedAt: safeDate(user.blockedAt),
    deletedAt: safeDate(user.deletedAt),
    passwordChangedAt: safeDate(user.passwordChangedAt),
    resetPasswordRequestedAt: safeDate(resetRequestedAt),
    resetPasswordExpiresAt: safeDate(user.resetPasswordExpiresAt),
    passwordResetPending: Boolean(
      user.resetPasswordTokenHash &&
      user.resetPasswordExpiresAt &&
      new Date(user.resetPasswordExpiresAt).getTime() > Date.now()
    ),
    songCount: songs.length,
    friendCount: acceptedInvitations.length,
    pendingInvitationCount: 0,
    createdAt: safeDate(user.createdAt || user._id?.getTimestamp?.()),
  };
}

export async function findAuthUserByIdOrEmail(idOrEmail) {
  const value = String(idOrEmail || "").trim();
  const authUsers = getTargetDb().collection("authUsers");
  const query = ObjectId.isValid(value)
    ? { _id: new ObjectId(value) }
    : { email: normalizeEmail(value) };

  return authUsers.findOne(query);
}

export async function getUserWithData(idOrEmail) {
  const authUser = await findAuthUserByIdOrEmail(idOrEmail);
  if (!authUser) return null;

  const dataDoc = await getTargetDb()
    .collection("data")
    .findOne({ email: normalizeEmail(authUser.email) });

  return { authUser, dataDoc };
}

export async function listUsers({ q = "", status = "", role = "", page = 1, limit = 25, sort = "createdAt", direction = "desc" }) {
  const authUsers = getTargetDb().collection("authUsers");
  const query = { deletedAt: { $exists: false } };
  const normalizedQ = normalizeEmail(q);

  if (normalizedQ) {
    query.email = { $regex: normalizedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  if (status) query.approvalStatus = status;
  if (role) query.role = role;

  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const sortField = ["email", "approvalStatus", "role", "approvalRequestedAt", "approvedAt"].includes(sort)
    ? sort
    : "_id";
  const sortDirection = direction === "asc" ? 1 : -1;

  const [total, users] = await Promise.all([
    authUsers.countDocuments(query),
    authUsers
      .find(query)
      .sort({ [sortField]: sortDirection })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),
  ]);

  const dataDocs = await getTargetDb()
    .collection("data")
    .find({ email: { $in: users.map((user) => normalizeEmail(user.email)) } })
    .toArray();
  const dataByEmail = new Map(dataDocs.map((doc) => [normalizeEmail(doc.email), doc]));

  const invitationCounts = await getTargetDb()
    .collection("invitations")
    .aggregate([
      { $match: { status: "pending", receiverEmail: { $in: users.map((user) => normalizeEmail(user.email)) } } },
      { $group: { _id: "$receiverEmail", count: { $sum: 1 } } },
    ])
    .toArray();
  const pendingByEmail = new Map(invitationCounts.map((item) => [normalizeEmail(item._id), item.count]));

  return {
    items: users.map((user) => ({
      ...serializeAuthUser(user, dataByEmail.get(normalizeEmail(user.email))),
      pendingInvitationCount: pendingByEmail.get(normalizeEmail(user.email)) || 0,
    })),
    page: safePage,
    limit: safeLimit,
    total,
  };
}

export async function getUserDetails(idOrEmail) {
  const result = await getUserWithData(idOrEmail);
  if (!result) return null;

  const { authUser, dataDoc } = result;
  const email = normalizeEmail(authUser.email);
  const [logs, profileImage, calendarOwnedCount, pendingInvitationCount] = await Promise.all([
    getTargetDb().collection("userLogs").find({ userEmail: email }).sort({ createdAt: -1 }).limit(20).toArray(),
    getTargetDb().collection("profileImages").findOne({ email }, { projection: { data: 0, image: 0 } }),
    getTargetDb().collection("calendarEvents").countDocuments({ ownerEmail: email }),
    getTargetDb().collection("invitations").countDocuments({
      status: "pending",
      $or: [{ senderEmail: email }, { receiverEmail: email }],
    }),
  ]);

  return {
    user: {
      ...serializeAuthUser(authUser, dataDoc),
      pendingInvitationCount,
    },
    dataDoc: dataDoc ? { id: serializeId(dataDoc._id), email: dataDoc.email, availableSetlists: dataDoc.availableSetlists || [] } : null,
    profileImage,
    calendarOwnedCount,
    recentLogs: logs.map((log) => ({ ...log, id: serializeId(log._id) })),
  };
}
