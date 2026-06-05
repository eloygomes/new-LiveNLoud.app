// youtube/youtube.oauth.js
const crypto = require("crypto");

// ======================
// helpers
// ======================
function base64url(input) {
  const buf = Buffer.isBuffer(input)
    ? input
    : Buffer.from(String(input), "utf8");

  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// ======================
// STATE
// ======================
function signState(payloadObj, stateSecret) {
  const payload = base64url(JSON.stringify(payloadObj));
  const sigHex = crypto
    .createHmac("sha256", stateSecret)
    .update(payload)
    .digest("hex");

  return `${payload}.${sigHex}`;
}

// 👉 ESTA é a função que o routes usa
function createState({ userId, returnTo }, stateSecret, ttlMs = 10 * 60 * 1000) {
  const exp = Date.now() + ttlMs;
  return signState({ userId, returnTo, exp }, stateSecret);
}

function verifyState(state, stateSecret) {
  if (!state || typeof state !== "string" || !state.includes(".")) return null;

  const [payload, sigHex] = state.split(".");
  if (!payload || !sigHex) return null;

  const expectedHex = crypto
    .createHmac("sha256", stateSecret)
    .update(payload)
    .digest("hex");

  // ✅ compara bytes reais do hex (melhor prática)
  let a, b;
  try {
    a = Buffer.from(sigHex, "hex");
    b = Buffer.from(expectedHex, "hex");
  } catch {
    return null;
  }

  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  // base64url -> base64
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const jsonStr = Buffer.from(b64 + pad, "base64").toString("utf8");

  let json;
  try {
    json = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  if (json?.exp && Date.now() > json.exp) return null;
  return json;
}

// ======================
// OAuth
// ======================
function buildAuthUrl({ clientId, redirectUri, scopes, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: (scopes || []).join(" "),
    state,
    // opcional, mas ajuda em algumas contas/apps:
    include_granted_scopes: "true",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens({
  code,
  clientId,
  clientSecret,
  redirectUri,
}) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg =
      data?.error_description ||
      data?.error ||
      "OAuth token exchange failed";
    const err = new Error(`[YT OAuth] ${resp.status}: ${msg}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  // ✅ normaliza expiry_date (ms) a partir de expires_in (segundos)
  const expiresInSec = Number(data?.expires_in || 0);
  const expiry_date =
    expiresInSec > 0 ? Date.now() + expiresInSec * 1000 : null;

  return {
    ...data,
    expiry_date,
  };
}

module.exports = {
  signState,
  createState,
  verifyState,
  buildAuthUrl,
  exchangeCodeForTokens,
};