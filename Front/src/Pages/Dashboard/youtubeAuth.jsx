// src/Pages/Dashboard/youtubeAuth.jsx
const API_BASE = "https://api.live.eloygomes.com";

// Single source of truth for JWT key lookup (login + export)
export function pickJwtToken() {
  const keys = ["accessToken", "access_token", "jwt", "token"]; // include legacy `token`
  for (const k of keys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v && String(v).trim()) {
      // debug (do not log full token)
      console.log("[YT AUTH] pickJwtToken hit", {
        key: k,
        length: String(v).length,
        preview: String(v).slice(0, 12) + "…",
        source: localStorage.getItem(k) ? "localStorage" : "sessionStorage",
      });
      return String(v).trim();
    }
  }
  return null;
}

/**
 * Starts Google OAuth flow for YouTube.
 * Accepts either:
 *   - startYouTubeLogin('/dashboard')
 *   - startYouTubeLogin({ returnTo: '/dashboard' })
 */
export async function startYouTubeLogin(arg = "/dashboard") {
  const returnTo =
    typeof arg === "string" ? arg : arg?.returnTo || "/dashboard";

  console.log("[YT AUTH] startYouTubeLogin", {
    returnTo,
    href: window.location.href,
  });

  const token = pickJwtToken();

  console.log("[YT AUTH] token present?", {
    ok: !!token,
    length: token ? token.length : 0,
    preview: token ? token.slice(0, 12) + "…" : "",
  });

  if (!token)
    throw new Error("Sem token/JWT no storage (token/accessToken/jwt)");

  const resp = await fetch(
    `${API_BASE}/api/youtube/auth/url?returnTo=${encodeURIComponent(returnTo)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  console.log("[YT AUTH] /api/youtube/auth/url response", {
    ok: resp.ok,
    status: resp.status,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`[YT AUTH] ${resp.status} ${txt}`);
  }

  const { url } = await resp.json();

  console.log("[YT AUTH] redirecting to Google", { url });

  window.location.assign(url);
}

/**
 * Popup-based OAuth flow (keeps the current page in place).
 * Returns a promise that resolves when the popup reports success.
 */
export async function startYouTubeLoginPopup(arg = "/dashboard") {
  const returnTo =
    typeof arg === "string" ? arg : arg?.returnTo || "/dashboard";

  console.log("[YT AUTH] startYouTubeLoginPopup", {
    returnTo,
    href: window.location.href,
  });

  const token = pickJwtToken();
  console.log("[YT AUTH] popup token present?", {
    ok: !!token,
    length: token ? token.length : 0,
    preview: token ? token.slice(0, 12) + "…" : "",
  });
  if (!token)
    throw new Error("Sem token/JWT no storage (token/accessToken/jwt)");

  const resp = await fetch(
    `${API_BASE}/api/youtube/auth/url?returnTo=${encodeURIComponent(returnTo)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  console.log("[YT AUTH] popup /api/youtube/auth/url response", {
    ok: resp.ok,
    status: resp.status,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`[YT AUTH POPUP] ${resp.status} ${txt}`);
  }

  const { url } = await resp.json();
  console.log("[YT AUTH] opening popup", { url });

  const w = 520;
  const h = 680;
  const left = Math.max(
    0,
    Math.floor(window.screenX + (window.outerWidth - w) / 2),
  );
  const top = Math.max(
    0,
    Math.floor(window.screenY + (window.outerHeight - h) / 2),
  );

  const popup = window.open(
    url,
    "yt_oauth_popup",
    `popup=yes,width=${w},height=${h},left=${left},top=${top}`,
  );

  if (!popup) {
    throw new Error(
      "Popup bloqueado. Libere popups para este site e tente novamente.",
    );
  }

  // Wait for the popup to report completion via postMessage.
  // Do NOT poll `popup.closed` while the popup is on Google domains; browsers may block
  // cross-origin window access under COOP/CORP, generating noisy console errors.
  return await new Promise((resolve, reject) => {
    const timeoutMs = 5 * 60 * 1000;

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout no OAuth do YouTube"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      try {
        popup.close();
      } catch {
        // ignore
      }
    }

    function onMessage(ev) {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "YT_OAUTH_OK") {
        console.log("[YT AUTH] popup reported success", data);
        cleanup();
        resolve(true);
        return;
      }

      if (data.type === "YT_OAUTH_ERROR") {
        console.log("[YT AUTH] popup reported error", data);
        cleanup();
        reject(new Error(data.message || "OAuth erro"));
      }
    }

    window.addEventListener("message", onMessage);
  });
}
