import bcrypt from "bcrypt";
import { getAdminDb } from "../db.js";
import { normalizeEmail } from "./format.js";

export async function bootstrapAdminUser() {
  const email = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL || "");
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || "");

  if (!email || !password) {
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must have at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  await getAdminDb().collection("adminUsers").updateOne(
    { email },
    {
      $set: {
        email,
        passwordHash,
        role: "admin",
        adminEnabled: true,
        approvalStatus: "approved",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log(`Admin bootstrap user ready: ${email}`);
}
