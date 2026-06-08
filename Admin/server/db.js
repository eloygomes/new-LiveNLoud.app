import { MongoClient } from "mongodb";

let adminClient;
let adminDatabase;
let targetClient;
let targetDatabase;

export async function connectDb() {
  await connectAdminDb();

  try {
    await connectTargetDb();
  } catch (error) {
    console.error(
      [
        "Target database connection failed.",
        "The Admin login/auth database is still available, but Sustenido data routes will fail until SUSTENIDO_MONGO_URI is fixed.",
        "For the isolated Admin compose, use host.docker.internal:27018 instead of db:27017.",
      ].join(" "),
      error.message,
    );
  }
}

export async function connectAdminDb() {
  if (adminDatabase) return adminDatabase;

  const uri = process.env.ADMIN_MONGO_URI || "mongodb://admin-db:27017";
  const dbName = process.env.ADMIN_DB_NAME || "adminPanel";

  adminClient = new MongoClient(uri);
  await adminClient.connect();
  adminDatabase = adminClient.db(dbName);

  await Promise.all([
    adminDatabase.collection("adminUsers").createIndex({ email: 1 }, { unique: true }),
    adminDatabase.collection("adminUsers").createIndex({ approvalStatus: 1 }),
    adminDatabase.collection("adminLogs").createIndex({ createdAt: -1 }),
    adminDatabase.collection("adminLogs").createIndex({ adminEmail: 1, createdAt: -1 }),
    adminDatabase.collection("adminLogs").createIndex({ targetUserEmail: 1, createdAt: -1 }),
  ]);

  return adminDatabase;
}

export async function connectTargetDb() {
  if (targetDatabase) return targetDatabase;

  const uri = process.env.TARGET_MONGO_URI || process.env.SUSTENIDO_MONGO_URI;
  const dbName = process.env.TARGET_DB_NAME || process.env.MONGO_DB_NAME || "sustenido";

  if (!uri) {
    throw new Error("TARGET_MONGO_URI or SUSTENIDO_MONGO_URI is required");
  }

  if (/\/\/(?:[^@/]+@)?(?:db|sustenido_mongodb_container):27017(?:[/?]|$)/.test(uri)) {
    throw new Error(
      "Invalid target Mongo URI for isolated Admin: use host.docker.internal:27018, not db:27017.",
    );
  }

  targetClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: Number(process.env.TARGET_MONGO_TIMEOUT_MS || 5000),
  });
  await targetClient.connect();
  targetDatabase = targetClient.db(dbName);

  await Promise.all([
    targetDatabase.collection("authUsers").createIndex({ email: 1 }, { unique: true }),
    targetDatabase.collection("authUsers").createIndex({ approvalStatus: 1 }),
    targetDatabase.collection("data").createIndex({ email: 1 }, { unique: true }),
    targetDatabase.collection("userLogs").createIndex({ userEmail: 1, createdAt: -1 }),
  ]);

  return targetDatabase;
}

export async function ensureTargetDb() {
  if (targetDatabase) return targetDatabase;
  return connectTargetDb();
}

export async function requireTargetDb(req, res, next) {
  try {
    await ensureTargetDb();
    return next();
  } catch (error) {
    return res.status(503).json({
      message: "Banco do Sustenido indisponivel para o Admin.",
      detail: error.message,
    });
  }
}

export function getAdminDb() {
  if (!adminDatabase) {
    throw new Error("Admin database not connected");
  }
  return adminDatabase;
}

export function getTargetDb() {
  if (!targetDatabase) {
    throw new Error("Target database not connected");
  }
  return targetDatabase;
}

export async function closeDb() {
  if (adminClient) {
    await adminClient.close();
    adminClient = null;
    adminDatabase = null;
  }
  if (targetClient) {
    await targetClient.close();
    targetClient = null;
    targetDatabase = null;
  }
}
