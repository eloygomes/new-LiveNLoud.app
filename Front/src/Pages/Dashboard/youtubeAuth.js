// src/Pages/Dashboard/youtubeAuth.js

function assertGisLoaded() {
  if (
    !window.google ||
    !window.google.accounts ||
    !window.google.accounts.oauth2
  ) {
    throw new Error(
      "Google Identity Services não carregou. Confira se você adicionou o script https://accounts.google.com/gsi/client no index.html."
    );
  }
}

function getEnv(name) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function startYouTubeTokenFlow({
  scope = "https://www.googleapis.com/auth/youtube",
} = {}) {
  assertGisLoaded();

  const clientId = getEnv("VITE_YOUTUBE_CLIENT_ID");

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      prompt: "consent",
      callback: (resp) => {
        if (!resp || resp.error) {
          reject(
            new Error(
              resp?.error_description ||
                resp?.error ||
                "Falha ao autenticar no Google"
            )
          );
          return;
        }

        const accessToken = resp.access_token;
        const expiresAt = Date.now() + (resp.expires_in || 3600) * 1000;

        localStorage.setItem("youtube_access_token", accessToken);
        localStorage.setItem("youtube_expires_at", String(expiresAt));

        resolve({ access_token: accessToken, expires_at: expiresAt });
      },
    });

    try {
      tokenClient.requestAccessToken();
    } catch (e) {
      reject(e);
    }
  });
}

export function getYouTubeAccessToken() {
  const token = localStorage.getItem("youtube_access_token");
  const expiresAt = Number(localStorage.getItem("youtube_expires_at") || "0");
  if (!token) return null;
  if (Date.now() > expiresAt - 30_000) return null; // 30s de folga
  return token;
}
