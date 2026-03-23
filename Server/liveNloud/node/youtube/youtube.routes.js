// node/youtube/youtube.routes.js
const express = require("express");
const router = express.Router();

const {
  buildAuthUrl,
  verifyState,
  exchangeCodeForTokens,
  createState,
} = require("./youtube.oauth");

const { exportPlaylist } = require("./youtube.service");

const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

// ===== Mongo =====
const uri = process.env.MONGO_URI || "REMOVED_MONGO_URI";
const client = new MongoClient(uri);

let mongoReady = false;
async function getAuthCollection() {
  if (!mongoReady) {
    await client.connect();
    mongoReady = true;
  }
  const db = client.db("liveNloud_");
  return db.collection("authUsers");
}

// ===== env guard =====
function requireEnv(keys = []) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    const err = new Error(`Missing env: ${missing.join(", ")}`);
    err.code = "MISSING_ENV";
    err.missing = missing;
    throw err;
  }
}

function safeReturnTo(returnToRaw, fallback = "/") {
  const s = String(returnToRaw || fallback);
  return s.startsWith("/") ? s : fallback;
}

// ===== JWT middleware =====
function authenticateJWT(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_SECRET, (err, payload) => {
    if (err) {
      console.error("[YT AUTH] jwt.verify failed:", err.name, err.message, {
        hasSecret: !!process.env.ACCESS_SECRET,
      });
      return res
        .status(403)
        .json({ error: "forbidden", reason: err.name, message: err.message });
    }
    req.user = payload; // { userId }
    next();
  });
}

// ===== YouTube token refresh helper =====
async function refreshYouTubeAccessToken(refreshToken) {
  requireEnv(["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"]);

  const url = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams();
  params.set("client_id", process.env.YOUTUBE_CLIENT_ID);
  params.set("client_secret", process.env.YOUTUBE_CLIENT_SECRET);
  params.set("refresh_token", refreshToken);
  params.set("grant_type", "refresh_token");

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("[YT refresh] failed:", resp.status, data);
    const err = new Error(`refresh_failed_${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  // data: { access_token, expires_in, scope, token_type, ... }
  return data;
}

// ===== Get valid access token (refresh if needed) =====
async function getValidYouTubeAccessToken({ userId }) {
  const col = await getAuthCollection();

  const user = await col.findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error("user_not_found");

  const yt = user.youtube || {};
  if (!yt.connected) throw new Error("youtube_not_connected");
  if (!yt.refresh_token) throw new Error("youtube_missing_refresh_token");

  let accessToken = yt.access_token;
  let expiryDate = yt.expiry_date; // ms epoch

  const now = Date.now();
  // se tiver expiry_date e estiver expirado (ou quase), já faz refresh aqui
  if (expiryDate && typeof expiryDate === "number" && expiryDate < now + 30_000) {
    console.log("[YT token] expiry_date expired/near, refreshing...");
    const refreshed = await refreshYouTubeAccessToken(yt.refresh_token);
    accessToken = refreshed.access_token;

    const newExpiry = Date.now() + Number(refreshed.expires_in || 3600) * 1000;

    await col.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "youtube.access_token": accessToken,
          "youtube.expiry_date": newExpiry,
          "youtube.token_type": refreshed.token_type || yt.token_type || "Bearer",
          "youtube.scope": refreshed.scope || yt.scope || null,
          "youtube.updatedAt": new Date().toISOString(),
        },
      }
    );
  }

  return { accessToken, refreshToken: yt.refresh_token };
}

// ===== helper: tenta export e se der invalidCredentials faz refresh 1x =====
async function exportWithRetry({ userId, playlistName, songs, privacyStatus, delayMs }) {
  const col = await getAuthCollection();

  // 1) pega token atual (pode estar expirado, mas tentamos)
  const { accessToken, refreshToken } = await getValidYouTubeAccessToken({ userId });

  try {
    return await exportPlaylist({
      accessToken,
      playlistName,
      songs,
      privacyStatus,
      delayMs,
    });
  } catch (err) {
    const status = err?.status;
    const reason = err?.reason;

    // 401 / 403 invalidCredentials -> refresh e tenta mais 1x
    const isInvalidCreds =
      status === 401 || (status === 403 && reason === "invalidCredentials");

    if (!isInvalidCreds) throw err;

    console.warn("[YT export] token invalid, refreshing and retrying once...", {
      status,
      reason,
    });

    const refreshed = await refreshYouTubeAccessToken(refreshToken);
    const newAccess = refreshed.access_token;
    const newExpiry = Date.now() + Number(refreshed.expires_in || 3600) * 1000;

    await col.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "youtube.access_token": newAccess,
          "youtube.expiry_date": newExpiry,
          "youtube.token_type": refreshed.token_type || "Bearer",
          "youtube.scope": refreshed.scope || null,
          "youtube.updatedAt": new Date().toISOString(),
        },
      }
    );

    return await exportPlaylist({
      accessToken: newAccess,
      playlistName,
      songs,
      privacyStatus,
      delayMs,
    });
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/youtube/auth/url  (PROTEGIDA)
router.get("/auth/url", authenticateJWT, async (req, res) => {
  try {
    requireEnv([
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_REDIRECT_URI",
      "YOUTUBE_STATE_SECRET",
    ]);

    const userId = req.user?.userId;
    if (!userId) return res.sendStatus(401);

    const returnTo = safeReturnTo(req.query.returnTo, "/");

    const state = createState({ userId, returnTo }, process.env.YOUTUBE_STATE_SECRET);

    const authUrl = buildAuthUrl({
      clientId: process.env.YOUTUBE_CLIENT_ID,
      redirectUri: process.env.YOUTUBE_REDIRECT_URI,
      state,
      scopes: [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ],
    });

    return res.json({ url: authUrl });
  } catch (err) {
    console.error("[YT auth/url] error:", err?.message, err?.missing || "");
    return res.status(500).json({
      error: "failed_to_create_url",
      message: err?.code === "MISSING_ENV" ? err.message : undefined,
    });
  }
});

// GET /api/youtube/auth/start   (PROTEGIDA)
router.get("/auth/start", authenticateJWT, async (req, res) => {
  try {
    requireEnv([
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_REDIRECT_URI",
      "YOUTUBE_STATE_SECRET",
    ]);

    const userId = req.user?.userId;
    if (!userId) return res.sendStatus(401);

    const returnTo = safeReturnTo(req.query.returnTo, "/");

    const state = createState({ userId, returnTo }, process.env.YOUTUBE_STATE_SECRET);

    const authUrl = buildAuthUrl({
      clientId: process.env.YOUTUBE_CLIENT_ID,
      redirectUri: process.env.YOUTUBE_REDIRECT_URI,
      state,
      scopes: [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ],
    });

    return res.redirect(authUrl);
  } catch (err) {
    console.error("[YT start] error:", err?.message, err?.missing || "");
    return res.status(500).send("error");
  }
});

// GET /api/youtube/auth/callback
router.get("/auth/callback", async (req, res) => {
  try {
    requireEnv([
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "YOUTUBE_REDIRECT_URI",
      "YOUTUBE_STATE_SECRET",
    ]);

    const { code, state, error } = req.query;

    const okUrl = process.env.YOUTUBE_FRONT_OK_URL || "https://live.eloygomes.com";
    const failUrl = process.env.YOUTUBE_FRONT_FAIL_URL || "https://live.eloygomes.com";

    if (error) {
      return res.redirect(
        `${failUrl}?yt=fail&reason=${encodeURIComponent(String(error))}`
      );
    }

    const parsed = verifyState(String(state || ""), process.env.YOUTUBE_STATE_SECRET);
    if (!parsed) {
      return res.redirect(`${failUrl}?yt=fail&reason=bad_state`);
    }

    if (!code) {
      return res.redirect(`${failUrl}?yt=fail&reason=no_code`);
    }

    const tokens = await exchangeCodeForTokens({
      code: String(code),
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri: process.env.YOUTUBE_REDIRECT_URI,
    });

    const col = await getAuthCollection();

    const update = {
      "youtube.connected": true,
      "youtube.access_token": tokens.access_token || null,
      "youtube.scope": tokens.scope || null,
      "youtube.token_type": tokens.token_type || null,
      // ✅ agora vem calculado no oauth.js (ms epoch) ou null
      "youtube.expiry_date": tokens.expiry_date || null,
      "youtube.updatedAt": new Date().toISOString(),
    };

    // refresh_token só vem na 1ª vez (ou quando força consent)
    if (tokens.refresh_token) {
      update["youtube.refresh_token"] = tokens.refresh_token;
    }

    await col.updateOne({ _id: new ObjectId(parsed.userId) }, { $set: update });

    const returnTo = safeReturnTo(parsed.returnTo, "/");
    return res.redirect(
      `${okUrl}?yt=ok&returnTo=${encodeURIComponent(returnTo)}`
    );
  } catch (err) {
    console.error("[YT callback] error:", err?.message, err?.missing || "");
    const failUrl = process.env.YOUTUBE_FRONT_FAIL_URL || "https://live.eloygomes.com";
    return res.redirect(`${failUrl}?yt=fail&reason=server_error`);
  }
});

// POST /api/youtube/export  (PROTEGIDA)
//
// body esperado:
// {
//   playlistName: "Minha playlist",
//   songs: [{ song:"Help", artist:"The Beatles" }, ...],
//   privacyStatus: "public" | "unlisted" | "private",
//   delayMs: 350
// }
router.post("/export", authenticateJWT, async (req, res) => {
  try {
    requireEnv([
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "YOUTUBE_REDIRECT_URI",
      "YOUTUBE_STATE_SECRET",
    ]);

    const userId = req.user?.userId;
    if (!userId) return res.sendStatus(401);

    const playlistName = String(req.body?.playlistName || "").trim();
    const songs = Array.isArray(req.body?.songs) ? req.body.songs : [];
    const privacyStatus = String(req.body?.privacyStatus || "public");
    const delayMs = Number(req.body?.delayMs ?? 350);

    if (!playlistName) {
      return res.status(400).json({ error: "missing_playlistName" });
    }
    if (!songs.length) {
      return res.status(400).json({ error: "missing_songs" });
    }

    const result = await exportWithRetry({
      userId,
      playlistName,
      songs,
      privacyStatus,
      delayMs,
    });

    return res.json({
      ok: true,
      provider: "youtube",
      playlistId: result.playlistId,
      added: result.added,
      notFound: result.notFound,
    });
  } catch (err) {
    const status = err?.status || 500;

    console.error("[YT export] error:", err?.message, {
      status,
      reason: err?.reason,
    });

    return res.status(status).json({
      ok: false,
      error: "youtube_export_failed",
      message: err?.message,
      status: err?.status,
      reason: err?.reason,
      // opcional: cuidado pra não vazar coisa demais em prod
      // data: err?.data,
    });
  }
});

module.exports = router;