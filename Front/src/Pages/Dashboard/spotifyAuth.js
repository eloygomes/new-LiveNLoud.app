const CODE_VERIFIER_KEY = "spotify_code_verifier";
const STATE_KEY = "spotify_auth_state";
const REDIRECT_URI_KEY = "spotify_redirect_uri";
const ORIGIN_KEY = "spotify_auth_origin";

// Fallback padrão para DEV/prod (desde que o Redirect URI esteja cadastrado no Spotify)
const DEFAULT_CALLBACK_PATH = "/auth/spotify/callback";

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

function randomString(length = 64) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join("");
}

export async function startSpotifyLogin() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  if (!clientId) throw new Error("VITE_SPOTIFY_CLIENT_ID não definido.");

  // Use o host atual (localhost/127/IP) para evitar mismatch de storage entre origens.
  // IMPORTANTE: esse Redirect URI precisa estar cadastrado no Spotify Developer Dashboard.
  const redirectUriFromEnv = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const redirectUri =
    redirectUriFromEnv && String(redirectUriFromEnv).trim().length > 0
      ? redirectUriFromEnv
      : `${window.location.origin}${DEFAULT_CALLBACK_PATH}`;

  // PKCE
  const verifier = randomString(64);
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);

  // State (protege contra callback inesperado e ajuda a detectar fluxos quebrados)
  const state = randomString(16);
  sessionStorage.setItem(STATE_KEY, state);

  // Guarda a origem para detectar quando o usuário iniciou o fluxo em um host e voltou em outro
  sessionStorage.setItem(ORIGIN_KEY, window.location.origin);

  // Guarda o redirectUri usado no /authorize para garantir que o /token use o MESMO
  sessionStorage.setItem(REDIRECT_URI_KEY, redirectUri);

  const challenge = base64UrlEncode(await sha256(verifier));

  const scope = [
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-private",
  ].join(" ");

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("state", state);

  window.location.assign(authUrl.toString());
}

export async function exchangeCodeForToken(code, returnedState) {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  const storedState = sessionStorage.getItem(STATE_KEY);
  const storedOrigin = sessionStorage.getItem(ORIGIN_KEY);
  const currentOrigin = window.location.origin;

  if (!storedState || !returnedState || storedState !== returnedState) {
    throw new Error(
      `state inválido. Provavelmente você iniciou o login em um host e voltou em outro.\n` +
        `Origem atual: ${currentOrigin}\n` +
        `Origem do login: ${storedOrigin || "(não encontrada)"}\n` +
        `Dica: use sempre o mesmo host (localhost OU 127.0.0.1 OU IP). Não misture.`
    );
  }

  if (storedOrigin && storedOrigin !== currentOrigin) {
    throw new Error(
      `host diferente detectado.\n` +
        `Origem atual: ${currentOrigin}\n` +
        `Origem do login: ${storedOrigin}\n` +
        `Dica: refaça o login abrindo a app no MESMO host do Redirect URI.`
    );
  }

  // O /token precisa receber o MESMO redirect_uri usado no /authorize.
  // 1) tenta pegar do sessionStorage (salvo em startSpotifyLogin)
  // 2) se existir no .env, usa
  // 3) fallback para a origem atual
  const redirectUriFromEnv = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const redirectUri =
    sessionStorage.getItem(REDIRECT_URI_KEY) ||
    (redirectUriFromEnv && String(redirectUriFromEnv).trim().length > 0
      ? redirectUriFromEnv
      : `${window.location.origin}${DEFAULT_CALLBACK_PATH}`);

  if (!redirectUri) {
    throw new Error(
      "redirect_uri não encontrado. Inicie o login novamente (sem abrir o /callback direto)."
    );
  }

  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  if (!verifier) {
    throw new Error(
      "code_verifier não encontrado (sessionStorage). Inicie o login novamente sem recarregar a URL /callback."
    );
  }

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("code_verifier", verifier);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        "Falha ao trocar code por token."
    );
  }

  // limpeza
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(REDIRECT_URI_KEY);
  sessionStorage.removeItem(ORIGIN_KEY);

  return data; // { access_token, refresh_token, expires_in, ... }
}
