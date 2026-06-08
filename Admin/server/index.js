import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import { connectDb, requireTargetDb } from "./db.js";
import { authenticateJWT } from "./auth/authenticateJWT.js";
import { requireAdmin } from "./auth/requireAdmin.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerSummaryRoutes } from "./routes/summary.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerSongRoutes } from "./routes/songs.js";
import { registerFriendshipRoutes } from "./routes/friendships.js";
import { registerLogRoutes } from "./routes/logs.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { requireJwtSecrets } from "./services/env.js";
import { bootstrapAdminUser } from "./services/bootstrapAdmin.js";
import { proxyAdminDataApi } from "./services/adminDataApi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 5175);

function getAllowedOrigins() {
  return new Set([
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://admin.sustenido.eloygomes.com",
    "https://admin.sustenido.eloygomes.com",
    ...(process.env.ADMIN_PUBLIC_ORIGIN || "").split(",").filter(Boolean),
    ...(process.env.CORS_ALLOWED_ORIGINS || "").split(",").filter(Boolean),
  ]);
}

app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().has(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
}));

app.get("/health", (req, res) => res.json({ ok: true, service: "admin" }));

await connectDb();
requireJwtSecrets();
await bootstrapAdminUser();

const routeDeps = { authenticateJWT, requireAdmin, requireTargetDb, proxyAdminDataApi };
registerAuthRoutes(app, routeDeps);
registerSummaryRoutes(app, routeDeps);
registerUserRoutes(app, routeDeps);
registerSongRoutes(app, routeDeps);
registerFriendshipRoutes(app, routeDeps);
registerLogRoutes(app, routeDeps);
registerAnalyticsRoutes(app, routeDeps);

const distDir = path.resolve(__dirname, "../dist");
app.use(express.static(distDir, {
  setHeaders(res, filePath) {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-store");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  },
}));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (req.path.startsWith("/assets/")) {
    return res.status(404).json({ message: "Asset not found." });
  }
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Admin server listening on ${port}`);
});
