import {
  applyOfflineSongUpdate,
  buildOfflineMutation,
  canUseOfflineSession,
  clearSyncedMutations,
  enqueueOfflineMutation,
  isRecentOfflineSession,
  normalizeOfflineSongs,
  toggleSongOfflineState,
} from "./offlineStore";
import {
  setLocalStorageItemSafe,
  setLocalStorageJsonSafe,
} from "./storageSafe";

// Controllers.js

/* =========================
   Config & HTTP client
   ========================= */

const RAW_API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").trim();

function resolveApiBase() {
  if (RAW_API_BASE) {
    if (/^https?:\/\//i.test(RAW_API_BASE)) {
      return RAW_API_BASE.replace(/\/+$/, "");
    }

    if (typeof window !== "undefined") {
      return new URL(RAW_API_BASE, window.location.origin).toString().replace(
        /\/+$/,
        "",
      );
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

const API_BASE = resolveApiBase();
const SESSION_TIMESTAMP_KEY = "auth:sessionTimestamp";
const OFFLINE_MODE_KEY = "offline:isOfflineMode";
const OFFLINE_SYNC_QUEUE_KEY = "offline:syncQueue";
const OFFLINE_SONGS_KEY = "offline:songs";
const OFFLINE_CONTENT_ENABLED_KEY = "offline:contentEnabled";
const OFFLINE_REAUTH_REQUIRED_KEY = "offline:reauthRequired";

function buildUrl(path, params) {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function parseResponseBody(response, responseType) {
  if (responseType === "blob") return response.blob();
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createHttpError(response, data) {
  const message = data?.message || data?.error || `HTTP ${response.status}`;
  const error = new Error(message);
  error.response = { status: response.status, data };
  return error;
}

async function request(path, options = {}, retry = true) {
  const {
    method = "GET",
    data,
    body,
    headers = {},
    params,
    responseType,
    skipAuth = false,
  } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && !(data instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const t =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!skipAuth && t && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${t}`);
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    body:
      body ??
      (data instanceof FormData
        ? data
        : data !== undefined
          ? JSON.stringify(data)
          : undefined),
  });
  const responseData = await parseResponseBody(response, responseType);

  if (
    retry &&
    [401, 403].includes(response.status) &&
    !String(path).includes("/api/auth/")
  ) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const nextAccessToken = await refreshPromise;
      requestHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
      return request(path, { ...options, headers: requestHeaders }, false);
    } catch (refreshError) {
      logoutUser();
      throw refreshError;
    }
  }

  if (!response.ok) {
    throw createHttpError(response, responseData);
  }

  return {
    data: responseData,
    status: response.status,
    headers: response.headers,
  };
}

let refreshPromise = null;

function getJwtExpiryMs(token) {
  if (!token) return 0;

  try {
    const [, payload] = token.split(".");
    if (!payload) return 0;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
    );
    const decoded = JSON.parse(json);

    return decoded?.exp ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function refreshAccessToken() {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const { data } = await request(
    "/api/auth/refresh",
    {
      method: "POST",
      data: { refreshToken },
      skipAuth: true,
    },
    false,
  );

  if (!data?.accessToken) {
    throw new Error("Access token refresh failed.");
  }

  if (typeof window !== "undefined") {
    setLocalStorageItemSafe("token", data.accessToken);
  }

  return data.accessToken;
}

export async function ensureAuthenticatedSession() {
  if (typeof window === "undefined") return false;

  if (!navigator.onLine) {
    const storedEmail = getUserEmail() || "";

    if (isOfflineModeEnabled() && canOfflineLoginForEmail(storedEmail)) {
      setOfflineModeEnabled(true);
      setOfflineReauthRequired(false);
      return true;
    }

    return tryOfflineLogin(storedEmail);
  }

  if (navigator.onLine && isOfflineModeEnabled()) {
    return false;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return tryOfflineLogin();
  }

  const expiresAt = getJwtExpiryMs(token);
  const refreshWindowMs = 60 * 1000;

  if (!expiresAt || expiresAt - Date.now() > refreshWindowMs) {
    return true;
  }

  try {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    await refreshPromise;
    setOfflineReauthRequired(false);
    return true;
  } catch {
    if (!navigator.onLine) {
      return tryOfflineLogin();
    }
    logoutUser();
    return false;
  }
}

const fetchApi = {
  get: (url, config = {}) => request(url, { ...config, method: "GET" }),
  post: (url, data, config = {}) =>
    request(url, { ...config, method: "POST", data }),
  put: (url, data, config = {}) =>
    request(url, { ...config, method: "PUT", data }),
  delete: (url, config = {}) => request(url, { ...config, method: "DELETE" }),
};

// Alias para compatibilidade (alguns trechos usam `api`)
export const api = fetchApi;
export { API_BASE };

/* =========================
   Helpers
   ========================= */

const INSTRUMENT_MAP = { keyboard: "keys", key: "keys" };
const ALLOWED_INSTRUMENTS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];

function normalizeInstrument(i) {
  const norm = (INSTRUMENT_MAP[i] || i || "").toLowerCase();
  return ALLOWED_INSTRUMENTS.includes(norm) ? norm : null;
}

const getUserEmail = () =>
  (typeof window !== "undefined" && localStorage.getItem("userEmail")) || null;

function songMatchesTarget(song = {}, artist = "", title = "") {
  return (
    String(song.artist || "")
      .trim()
      .toLowerCase() ===
      String(artist || "")
        .trim()
        .toLowerCase() &&
    String(song.song || "")
      .trim()
      .toLowerCase() ===
      String(title || "")
        .trim()
        .toLowerCase()
  );
}

function findCachedSong(artist = "", title = "") {
  return readCachedOfflineSongs().find((song) =>
    songMatchesTarget(song, artist, title),
  );
}

const syncStoredUserProfile = (profile = {}) => {
  if (typeof window === "undefined") return;

  if (profile.email) setLocalStorageItemSafe("userEmail", profile.email);
  if (profile.usernameDisplay || profile.username) {
    setLocalStorageItemSafe(
      "username",
      profile.usernameDisplay || profile.username,
    );
  }
};

function readCachedOfflineSongs() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_SONGS_KEY) || "[]");
    return normalizeOfflineSongs(parsed);
  } catch {
    return [];
  }
}

function writeCachedOfflineSongs(songs = []) {
  if (typeof window === "undefined") return;
  setLocalStorageJsonSafe(OFFLINE_SONGS_KEY, normalizeOfflineSongs(songs));
}

function readOfflineSyncQueue() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(OFFLINE_SYNC_QUEUE_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOfflineSyncQueue(queue = []) {
  if (typeof window === "undefined") return;
  setLocalStorageJsonSafe(OFFLINE_SYNC_QUEUE_KEY, queue);
}

function pruneLocalOnlyOfflineMutations(queue = []) {
  return (Array.isArray(queue) ? queue : []).filter(
    (entry) => entry?.action !== "TOGGLE_OFFLINE",
  );
}

function setOfflineModeEnabled(enabled) {
  if (typeof window === "undefined") return;
  setLocalStorageItemSafe(OFFLINE_MODE_KEY, enabled ? "true" : "false");
}

function setOfflineContentEnabled(enabled) {
  if (typeof window === "undefined") return;
  setLocalStorageItemSafe(
    OFFLINE_CONTENT_ENABLED_KEY,
    enabled ? "true" : "false",
  );
}

function isOfflineContentEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OFFLINE_CONTENT_ENABLED_KEY) === "true";
}

function setOfflineReauthRequired(required) {
  if (typeof window === "undefined") return;
  setLocalStorageItemSafe(
    OFFLINE_REAUTH_REQUIRED_KEY,
    required ? "true" : "false",
  );
}

export function markOfflineReauthRequired(required = true) {
  setOfflineReauthRequired(required);
}

export function isOfflineReauthRequired() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OFFLINE_REAUTH_REQUIRED_KEY) === "true";
}

export function isOfflineModeEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OFFLINE_MODE_KEY) === "true";
}

export function getOfflineStatus() {
  const songs = readCachedOfflineSongs();
  const queue = readOfflineSyncQueue();

  return {
    offlineMode: isOfflineModeEnabled(),
    contentEnabled: isOfflineContentEnabled(),
    reauthRequired: isOfflineReauthRequired(),
    pendingChanges: queue.filter((entry) => entry.status !== "SYNCED").length,
    offlineEnabledSongs: songs.filter((song) => song.offlineEnabled),
  };
}

export function canOfflineLoginForEmail(userEmail = "") {
  if (typeof window === "undefined") return false;

  const normalizedEmail = String(userEmail || "")
    .trim()
    .toLowerCase();
  const storedEmail = String(getUserEmail() || "")
    .trim()
    .toLowerCase();
  const accessToken = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const sessionTimestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
  const songs = readCachedOfflineSongs();

  if (!isOfflineContentEnabled()) {
    return false;
  }

  if (normalizedEmail && storedEmail && normalizedEmail !== storedEmail) {
    return false;
  }

  if (!isRecentOfflineSession(sessionTimestamp)) {
    return false;
  }

  if (!songs.length) {
    return false;
  }

  if (refreshToken) {
    return canUseOfflineSession({
      refreshToken,
      sessionTimestamp,
      songs,
    });
  }

  return Boolean(accessToken);
}

function enqueueMutation(mutation) {
  const nextQueue = enqueueOfflineMutation(readOfflineSyncQueue(), mutation);
  writeOfflineSyncQueue(nextQueue);
}

function mergeSongIntoCache(updatedSong = {}) {
  const cachedSongs = readCachedOfflineSongs();

  try {
    const nextSongs = applyOfflineSongUpdate(cachedSongs, updatedSong);
    writeCachedOfflineSongs(nextSongs);
    return nextSongs;
  } catch {
    const nextSongs = normalizeOfflineSongs([...cachedSongs, updatedSong]);
    writeCachedOfflineSongs(nextSongs);
    return nextSongs;
  }
}

function mergeOfflineSongSnapshot(incomingSong = {}, cachedSong = null) {
  if (!cachedSong) {
    return incomingSong;
  }

  return {
    ...cachedSong,
    ...incomingSong,
    offlineEnabled: Boolean(cachedSong.offlineEnabled),
    requiresSync: Boolean(cachedSong.requiresSync),
    lastOfflineSyncTime:
      cachedSong.lastOfflineSyncTime ||
      incomingSong.lastOfflineSyncTime ||
      null,
  };
}

function hasPresentationPayload(song = {}) {
  return ["guitar01", "guitar02", "bass", "keys", "drums", "voice"].some(
    (instrumentKey) => {
      const instrumentData = song?.[instrumentKey];
      if (!instrumentData || typeof instrumentData !== "object") {
        return false;
      }

      return ["songCifra", "songChords", "songTabs", "songLyrics"].some(
        (field) =>
          typeof instrumentData[field] === "string" &&
          instrumentData[field].trim() !== "",
      );
    },
  );
}

async function backfillOfflineSongDetails(email, songs = []) {
  const offlineSongs = normalizeOfflineSongs(songs).filter(
    (song) => song.offlineEnabled && song.artist && song.song,
  );

  if (!offlineSongs.length) {
    return;
  }

  const detailedSongsResults = await Promise.allSettled(
    offlineSongs.map(async (song) => {
      const { data } = await fetchApi.post("/api/allsongdata", {
        email,
        artist: song.artist,
        song: song.song,
      });

      return { ...song, ...data };
    }),
  );

  const mergedDetailedSongs = offlineSongs.map((song, index) =>
    detailedSongsResults[index]?.status === "fulfilled"
      ? detailedSongsResults[index].value
      : song,
  );

  const cachedSongs = readCachedOfflineSongs();
  const nextSongs = cachedSongs.map((cachedSong) => {
    const updatedSong = mergedDetailedSongs.find(
      (entry) =>
        String(entry.artist || "")
          .trim()
          .toLowerCase() ===
          String(cachedSong.artist || "")
            .trim()
            .toLowerCase() &&
        String(entry.song || "")
          .trim()
          .toLowerCase() ===
          String(cachedSong.song || "")
            .trim()
            .toLowerCase(),
    );

    return updatedSong
      ? mergeOfflineSongSnapshot(updatedSong, cachedSong)
      : cachedSong;
  });

  writeCachedOfflineSongs(nextSongs);
}

/** Normaliza link como no backend (host sem www, minúsculo, sem barra final). */
export function normalizeLink(u) {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, ""); // remove barra final
    return `${host}${path}`;
  } catch {
    return String(u)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

/* =========================
   Endpoints já existentes
   ========================= */

export const requestData = async (email) => {
  try {
    const { data } = await fetchApi.get(`/api/alldata/${email}`);
    writeCachedOfflineSongs(data?.userdata || []);
    setOfflineModeEnabled(false);
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error fetching song data:", error);
    const cachedSongs = readCachedOfflineSongs();
    if (cachedSongs.length) {
      setOfflineModeEnabled(true);
      return JSON.stringify({ userdata: cachedSongs });
    }
  }
};

export const fetchAllSongData = async (email, artist, song) => {
  const url = "/api/allsongdata";
  try {
    const { data } = await fetchApi.post(url, { email, artist, song });
    const cachedSongs = readCachedOfflineSongs();
    const targetIndex = cachedSongs.findIndex((entry) =>
      songMatchesTarget(entry, artist, song),
    );
    if (targetIndex >= 0) {
      cachedSongs[targetIndex] = { ...cachedSongs[targetIndex], ...data };
      writeCachedOfflineSongs(cachedSongs);
    }
    setOfflineModeEnabled(false);
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching song data from ${API_BASE + url}`, error);
    const cachedSong = findCachedSong(artist, song);
    if (cachedSong) {
      setOfflineModeEnabled(true);
      return JSON.stringify(cachedSong);
    }
    throw error;
  }
};

export const deleteOneSong = async (artist, song) => {
  const url = "/api/deleteonesong";
  try {
    const { data } = await fetchApi.post(url, {
      email: getUserEmail(),
      artist,
      song,
    });
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching song data from ${API_BASE + url}`, error);
    throw error;
  }
};

export const allDataFromOneSong = async (artist, song) => {
  const url = "/api/allsongdata";
  try {
    const { data } = await fetchApi.post(url, {
      email: getUserEmail(),
      artist,
      song,
    });
    const cachedSongs = readCachedOfflineSongs();
    const targetIndex = cachedSongs.findIndex((entry) =>
      songMatchesTarget(entry, artist, song),
    );
    if (targetIndex >= 0) {
      cachedSongs[targetIndex] = { ...cachedSongs[targetIndex], ...data };
      writeCachedOfflineSongs(cachedSongs);
    }
    setOfflineModeEnabled(false);
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching song data from ${API_BASE + url}`, error);
    const cachedSong = findCachedSong(artist, song);
    if (cachedSong) {
      setOfflineModeEnabled(true);
      return JSON.stringify(cachedSong);
    }
    throw error;
  }
};

export const updateSongData = async (updatedData) => {
  const email = getUserEmail();
  const artist =
    typeof window !== "undefined" ? localStorage.getItem("artist") : "";
  const song =
    typeof window !== "undefined" ? localStorage.getItem("song") : "";

  const payload = {
    userdata: {
      email,
      artist,
      song,
      ...updatedData,
    },
    databaseComing: "liveNloud_",
    collectionComing: "data",
  };

  try {
    const { data } = await fetchApi.post("/api/newsong", payload);
    mergeSongIntoCache({
      ...updatedData,
      artist,
      song,
    });
    setOfflineModeEnabled(false);
    return data;
  } catch (error) {
    console.error("Error updating song data:", error);
    mergeSongIntoCache({
      ...updatedData,
      artist,
      song,
    });
    enqueueMutation(
      buildOfflineMutation("UPSERT_SONG", {
        email,
        artist,
        song,
        userdata: payload.userdata,
      }),
    );
    setOfflineModeEnabled(true);
    return { queued: true };
  }
};

export const updateSongEntry = async (updatedSong = {}) => {
  const email = getUserEmail();
  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }
  if (!updatedSong.artist || !updatedSong.song) {
    throw new Error("updatedSong precisa conter artist e song.");
  }

  try {
    const { data } = await fetchApi.put("/api/song/updateExact", {
      email,
      updatedSong,
    });
    mergeSongIntoCache(updatedSong);
    setOfflineModeEnabled(false);
    return data;
  } catch (error) {
    console.error("Error updating exact song record:", error);
    mergeSongIntoCache(updatedSong);
    enqueueMutation(
      buildOfflineMutation("UPSERT_SONG", {
        email,
        artist: updatedSong.artist,
        song: updatedSong.song,
        userdata: updatedSong,
      }),
    );
    setOfflineModeEnabled(true);
    return { queued: true };
  }
};

export const updateUserName = async (newName) => {
  const payload = {
    email: getUserEmail(),
    newUsername: newName,
  };

  try {
    const { data } = await fetchApi.put("/api/updateUsername", payload);
    return data;
  } catch (error) {
    console.error("Error updating song data:", error);
    throw error;
  }
};

export const updateLastPlayed = async (song, artist, instrument) => {
  const email =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  if (!email) {
    console.warn("updateLastPlayed: sem email no localStorage.");
    return null;
  }

  const normalizedInstrument = normalizeInstrument(instrument);
  if (!normalizedInstrument) {
    throw new Error(
      `Instrumento inválido: "${instrument}". Use um de: ${ALLOWED_INSTRUMENTS.join(
        ", ",
      )}.`,
    );
  }

  const payload = { email, song, artist, instrument: normalizedInstrument };

  try {
    const { data } = await fetchApi.put("/api/lastPlay", payload);
    return data;
  } catch (error) {
    console.error("[updateLastPlayed:PUT]", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

export const updateInstrumentNotes = async ({
  artist,
  song,
  instrument,
  notes,
}) => {
  const email = getUserEmail();
  const normalizedInstrument = normalizeInstrument(instrument);

  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }
  if (!artist || !song || !normalizedInstrument) {
    throw new Error("artist, song e instrument são obrigatórios.");
  }

  const { data } = await fetchApi.put("/api/song/instrumentNotes", {
    email,
    artist,
    song,
    instrument: normalizedInstrument,
    notes: String(notes || ""),
  });

  return data;
};

export async function uploadGuitarProFile({ email, artist, song, file }) {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("artist", artist);
  formData.append("song", song);
  formData.append("file", file);

  const { data } = await fetchApi.post("/api/guitarpro/upload", formData, {
    headers: {},
  });
  return data;
}

export async function getGuitarProFiles({ email, artist, song }) {
  const { data } = await fetchApi.get("/api/guitarpro/files", {
    params: { email, artist, song },
  });
  return data;
}

export async function deleteGuitarProFile({ email, artist, song, fileId }) {
  const { data } = await fetchApi.delete("/api/guitarpro/delete", {
    data: { email, artist, song, fileId },
  });
  return data;
}

export async function downloadGuitarProFile({ email, artist, song, fileId }) {
  const { data } = await fetchApi.get("/api/guitarpro/file", {
    params: { email, artist, song, fileId },
    responseType: "blob",
  });
  return data;
}

export const downloadUserData = async () => {
  const email = getUserEmail();
  if (!email) return;

  try {
    const resp = await fetchApi.get(`/api/downloadUserData/${email}`, {
      responseType: "blob",
    });

    const blob = new Blob([resp.data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "userdata.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading user data:", error);
  }
};

export const deleteAllUserSongs = async () => {
  const url = "/api/deleteAllUserSongs";

  try {
    const { data } = await fetchApi.post(url, { email: getUserEmail() });
    return data;
  } catch (error) {
    console.error(
      `Error deleting songs:`,
      error.response?.data?.message || error.message,
    );
    throw error;
  }
};

export const deleteUserAccountOnDb = async (password) => {
  const url = "/api/deleteUserAccount";

  try {
    const { data } = await fetchApi.post(url, {
      email: getUserEmail(),
      password,
    });
    return data;
  } catch (error) {
    console.error(
      `Erro ao deletar a conta do usuário:`,
      error.response?.data?.message || error.message,
    );
    throw error;
  }
};

export const deleteUserAccount = async ({
  password,
  email = getUserEmail(),
}) => {
  const url = "/api/deleteUserAccount";

  try {
    const { data } = await fetchApi.post(url, { email, password });
    return data;
  } catch (error) {
    console.error(
      `Erro ao deletar a conta do usuário:`,
      error.response?.data?.message || error.message,
    );
    throw error;
  }
};

export async function getAllUserSetlists() {
  const email = getUserEmail();
  if (!email) return [];

  try {
    const res = await fetch(`${API_BASE}/api/alldata/${email}`);
    const data = await res.json();

    const allTags = new Set();
    if (Array.isArray(data.userdata)) {
      data.userdata.forEach((songEntry) => {
        if (Array.isArray(songEntry.setlist)) {
          songEntry.setlist.forEach((tag) => allTags.add(tag));
        }
      });
    }

    return Array.from(allTags);
  } catch (error) {
    console.error("Erro ao carregar setlists:", error);
    return [];
  }
}

export async function login(userEmail, userPassword) {
  try {
    const { data } = await fetchApi.post("/api/auth/login", {
      email: userEmail,
      password: userPassword,
    });

    const { accessToken, refreshToken } = data;

    setLocalStorageItemSafe("token", accessToken);
    setLocalStorageItemSafe("userEmail", userEmail);
    setLocalStorageItemSafe(SESSION_TIMESTAMP_KEY, new Date().toISOString());
    setLocalStorageItemSafe(OFFLINE_MODE_KEY, "false");
    setLocalStorageItemSafe(OFFLINE_REAUTH_REQUIRED_KEY, "false");
    if (refreshToken) {
      setLocalStorageItemSafe("refreshToken", refreshToken);
    }

    const persistedQueue = pruneLocalOnlyOfflineMutations(
      readOfflineSyncQueue(),
    );
    writeOfflineSyncQueue(persistedQueue);

    if (persistedQueue.length) {
      await syncOfflineQueue();
    }

    return accessToken;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
}

export async function signupAuthUser({ email, password, fullName, username }) {
  const { data } = await fetchApi.post("/api/auth/signup", {
    email,
    password,
    fullName,
    username,
  });

  return data;
}

export async function createInitialUserRecord(userdata) {
  const { data } = await fetchApi.post("/api/signup", {
    databaseComing: "liveNloud_",
    collectionComing: "data",
    userdata,
  });

  return data;
}

export async function requestYouTubeAuthUrl({ returnTo = "/dashboard", token }) {
  if (!token) {
    throw new Error("Sem token/JWT no storage (token/accessToken/jwt)");
  }

  const { data } = await fetchApi.get("/api/youtube/auth/url", {
    params: { returnTo },
    headers: { Authorization: `Bearer ${token}` },
  });

  return data?.url || "";
}

export async function tryOfflineLogin(userEmail = "") {
  if (typeof window === "undefined") return false;

  if (navigator.onLine) {
    return false;
  }

  const normalizedEmail =
    String(userEmail || "")
      .trim()
      .toLowerCase() ||
    getUserEmail() ||
    "";
  const allowed = canOfflineLoginForEmail(normalizedEmail);

  if (!allowed || !normalizedEmail) {
    return false;
  }

  setLocalStorageItemSafe("userEmail", normalizedEmail);
  setLocalStorageItemSafe(OFFLINE_MODE_KEY, "true");
  setLocalStorageItemSafe(OFFLINE_REAUTH_REQUIRED_KEY, "false");
  return true;
}

export async function setOfflineContentAvailability(enabled) {
  if (typeof window === "undefined") {
    return { enabled: false, songsDownloaded: 0 };
  }

  const normalizedEnabled = Boolean(enabled);

  if (!normalizedEnabled) {
    const currentSongs = readCachedOfflineSongs();
    const nextSongs = currentSongs.map((song) => ({
      ...song,
      offlineEnabled: false,
      requiresSync: false,
    }));

    writeCachedOfflineSongs(nextSongs);
    writeOfflineSyncQueue(
      pruneLocalOnlyOfflineMutations(readOfflineSyncQueue()),
    );
    setOfflineContentEnabled(false);
    setOfflineModeEnabled(false);
    setOfflineReauthRequired(false);
    return { enabled: false, songsDownloaded: 0 };
  }

  const email = getUserEmail();
  if (!email) {
    throw new Error("User not authenticated.");
  }

  let responseData = null;
  try {
    const { data } = await fetchApi.get(
      `/api/alldata/${encodeURIComponent(email)}`,
    );
    responseData = data;
    setOfflineModeEnabled(false);
  } catch (error) {
    responseData = { userdata: readCachedOfflineSongs() };
    if (!responseData.userdata.length) {
      throw new Error(
        "Unable to download offline content without a connection.",
      );
    }
    setOfflineModeEnabled(true);
  }

  const baseSongs = normalizeOfflineSongs(responseData?.userdata || []);
  const detailedSongsResults = await Promise.allSettled(
    baseSongs.map(async (song) => {
      if (!song?.artist || !song?.song) {
        return song;
      }

      try {
        const { data } = await fetchApi.post("/api/allsongdata", {
          email,
          artist: song.artist,
          song: song.song,
        });
        return { ...song, ...data };
      } catch {
        return song;
      }
    }),
  );

  const songs = detailedSongsResults.map((result, index) => {
    const detailedSong =
      result.status === "fulfilled" ? result.value : baseSongs[index];

    return {
      ...detailedSong,
      offlineEnabled: true,
      requiresSync: false,
      lastOfflineSyncTime: new Date().toISOString(),
    };
  });

  writeCachedOfflineSongs(songs);
  writeOfflineSyncQueue(pruneLocalOnlyOfflineMutations(readOfflineSyncQueue()));
  setOfflineContentEnabled(true);
  setOfflineReauthRequired(false);
  return { enabled: true, songsDownloaded: songs.length };
}

export async function fetchCurrentUserProfile() {
  const { data } = await fetchApi.get("/api/me");
  syncStoredUserProfile(data);
  return data;
}

export async function searchUsers(query) {
  const { data } = await fetchApi.get("/api/users/search", {
    params: { q: query },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchNotifications() {
  const { data } = await fetchApi.get("/api/notifications");
  return Array.isArray(data) ? data : [];
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await fetchApi.put(
    `/api/notifications/${notificationId}/read`,
  );
  return data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await fetchApi.put("/api/notifications/read-all");
  return data;
}

export async function fetchInvitations() {
  const { data } = await fetchApi.get("/api/invitations");
  return Array.isArray(data) ? data : [];
}

export async function fetchUserLogs() {
  const { data } = await fetchApi.get("/api/logs");
  return Array.isArray(data) ? data : [];
}

export async function createInvitation({ identifier, message = "" }) {
  const { data } = await fetchApi.post("/api/invitations", {
    email: identifier,
    message,
  });
  return data;
}

export async function respondToInvitation(invitationId, status) {
  const { data } = await fetchApi.put(
    `/api/invitations/${invitationId}/respond`,
    {
      status,
    },
  );
  return data;
}

export async function revokeFriendship(counterpartEmail) {
  const { data } = await fetchApi.delete(
    `/api/friends/${encodeURIComponent(counterpartEmail)}`,
  );
  return data;
}

export async function fetchCalendarEvents() {
  const { data } = await fetchApi.get("/api/calendar/events");
  return Array.isArray(data) ? data : [];
}

export async function fetchCalendarEvent(eventId) {
  const { data } = await fetchApi.get(`/api/calendar/events/${eventId}`);
  return data;
}

export async function createCalendarEvent(payload) {
  const { data } = await fetchApi.post("/api/calendar/events", payload);
  return data;
}

export async function updateCalendarEvent(eventId, payload) {
  const { data } = await fetchApi.put(
    `/api/calendar/events/${eventId}`,
    payload,
  );
  return data;
}

export async function deleteCalendarEvent(eventId) {
  const { data } = await fetchApi.delete(`/api/calendar/events/${eventId}`);
  return data;
}

export async function respondToCalendarEvent(eventId, status) {
  const { data } = await fetchApi.put(
    `/api/calendar/events/${eventId}/respond`,
    {
      status,
    },
  );
  return data;
}

export async function shareSetlists({ recipientEmail, setlistNames = [] }) {
  const { data } = await fetchApi.post("/api/setlist-shares", {
    recipientEmail,
    setlistNames,
  });
  return data;
}

export async function fetchSetlistShare(shareId) {
  const { data } = await fetchApi.get(
    `/api/setlist-shares/${encodeURIComponent(shareId)}`,
  );
  return data;
}

export async function respondToSetlistShare(shareId, status) {
  const { data } = await fetchApi.put(
    `/api/setlist-shares/${encodeURIComponent(shareId)}/respond`,
    { status },
  );
  return data;
}

/* =========================
   Avatar helpers
   ========================= */

export async function getProfileImageObjectURL(cacheKey = "0") {
  const email = getUserEmail();
  if (!email) return null;

  const url = `${API_BASE}/api/profileImage/${encodeURIComponent(
    email,
  )}?_v=${encodeURIComponent(cacheKey)}`;

  try {
    const resp = await fetchApi.get(url, {
      responseType: "blob",
      headers: { "Cache-Control": "no-cache" },
    });

    if (resp.status === 200) {
      return URL.createObjectURL(resp.data);
    }
    return null;
  } catch (err) {
    if (err?.response?.status === 404) return null; // sem imagem
    console.error("Erro ao buscar a imagem de perfil:", err);
    return null;
  }
}

export function revokeObjectURLSafe(objectUrl) {
  try {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  } catch {
    // intentionally empty: safe to ignore errors here
  }
}

/* =========================
   Setlists helpers
   ========================= */

export const SETLISTS_LS_KEY = "mySelectedSetlists";

export function loadSelectedSetlists() {
  try {
    const saved = localStorage.getItem(SETLISTS_LS_KEY);
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSelectedSetlists(arr) {
  setLocalStorageJsonSafe(SETLISTS_LS_KEY, arr || []);
}

export const DASHBOARD_VISIBLE_SONGS_LS_KEY = "dashboardVisibleSongs";

function normalizeDashboardVisibleSong(song) {
  const artist = String(song?.artist || "").trim();
  const songName = String(song?.song || "").trim();

  if (!artist || !songName) return null;

  return {
    artist,
    song: songName,
    instruments: song?.instruments || {},
    setlist: Array.isArray(song?.setlist) ? song.setlist : [],
  };
}

export function saveDashboardVisibleSongs(songs) {
  try {
    const visibleSongs = Array.isArray(songs)
      ? songs.map(normalizeDashboardVisibleSong).filter(Boolean)
      : [];

    setLocalStorageJsonSafe(DASHBOARD_VISIBLE_SONGS_LS_KEY, visibleSongs);
  } catch {
    // intentionally empty: safe to ignore errors here
  }
}

export function loadDashboardVisibleSongs() {
  try {
    const saved = localStorage.getItem(DASHBOARD_VISIBLE_SONGS_LS_KEY);
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeDashboardVisibleSong).filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchDistinctSetlists() {
  const email = getUserEmail();
  if (!email) return [];

  try {
    const resp = await fetch(
      `${API_BASE}/api/alldata/${encodeURIComponent(email)}`,
    );
    const data = await resp.json();

    const tags = new Set();
    if (Array.isArray(data?.userdata)) {
      data.userdata.forEach((song) => {
        (song.setlist || []).forEach((t) => tags.add(t));
      });
    }
    return Array.from(tags).sort();
  } catch (error) {
    console.error("Erro ao buscar setlists:", error);
    return [];
  }
}

/**
 * Atualiza, no backend, a lista de setlists disponíveis para o usuário atual.
 * A API real ainda será criada; ajuste a rota (`/api/updateSetlists`) quando pronta.
 */
export async function updateUserSetlists(nextSetlists = []) {
  const email = getUserEmail();
  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }

  const payload = {
    email,
    setlists: Array.isArray(nextSetlists) ? nextSetlists : [],
  };

  try {
    const { data } = await fetchApi.put("/api/updateSetlists", payload);
    setOfflineModeEnabled(false);
    return data;
  } catch (error) {
    console.error("[updateUserSetlists] Erro ao atualizar setlists:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    enqueueMutation(buildOfflineMutation("UPDATE_SETLISTS", payload));
    setOfflineModeEnabled(true);
    return {
      message: "Setlists saved locally and queued for sync.",
      availableSetlists: payload.setlists,
      queued: true,
    };
  }
}

/* =========================
   Songs helpers
   ========================= */

export async function fetchUserSongs() {
  const email = getUserEmail();
  if (!email) {
    return { songs: [], fullName: "", username: "" };
  }

  try {
    const resp = await fetch(
      `${API_BASE}/api/alldata/${encodeURIComponent(email)}`,
    );
    const data = await resp.json();
    const cachedSongs = readCachedOfflineSongs();
    const songs = normalizeOfflineSongs(data.userdata || [])
      .map((song) => {
        const cachedSong = cachedSongs.find(
          (entry) =>
            String(entry.artist || "")
              .trim()
              .toLowerCase() ===
              String(song.artist || "")
                .trim()
                .toLowerCase() &&
            String(entry.song || "")
              .trim()
              .toLowerCase() ===
              String(song.song || "")
                .trim()
                .toLowerCase(),
        );

        return mergeOfflineSongSnapshot(song, cachedSong);
      })
      .filter(
        (item) =>
          item.song?.trim() !== "" &&
          item.artist?.trim() !== "" &&
          item.progressBar !== undefined,
      );
    writeCachedOfflineSongs(songs);
    setOfflineModeEnabled(false);

    if (
      isOfflineContentEnabled() &&
      songs.some((song) => song.offlineEnabled && !hasPresentationPayload(song))
    ) {
      void backfillOfflineSongDetails(email, songs);
    }

    const first = Array.isArray(data.userdata) ? (data.userdata[0] ?? {}) : {};
    return {
      songs,
      fullName: first.fullName || "",
      username: first.username || "",
    };
  } catch (error) {
    console.error("Erro ao buscar músicas:", error);
    const songs = readCachedOfflineSongs().filter(
      (item) =>
        item.song?.trim() !== "" &&
        item.artist?.trim() !== "" &&
        item.progressBar !== undefined,
    );
    setOfflineModeEnabled(songs.length > 0);
    return {
      songs,
      fullName: localStorage.getItem("fullName") || "",
      username: localStorage.getItem("username") || "",
    };
  }
}

export function setSongOfflineEnabled({ artist, song, offlineEnabled }) {
  const cachedSongs = readCachedOfflineSongs();
  const nextSongs = toggleSongOfflineState(
    cachedSongs,
    { artist, song },
    offlineEnabled,
  );

  writeCachedOfflineSongs(nextSongs);
  setOfflineModeEnabled(true);
  return nextSongs;
}

export async function syncOfflineQueue() {
  const queue = pruneLocalOnlyOfflineMutations(readOfflineSyncQueue());
  writeOfflineSyncQueue(queue);
  if (!queue.length) {
    return { synced: 0 };
  }

  let nextQueue = [...queue];
  let synced = 0;

  for (const mutation of queue) {
    try {
      nextQueue = nextQueue.map((entry) =>
        entry.id === mutation.id ? { ...entry, status: "SYNCING" } : entry,
      );
      writeOfflineSyncQueue(nextQueue);

      if (mutation.action === "UPDATE_SETLISTS") {
        await fetchApi.put("/api/updateSetlists", mutation.payload);
      } else {
        const cachedSong = readCachedOfflineSongs().find(
          (entry) =>
            String(entry.artist || "")
              .trim()
              .toLowerCase() ===
              String(mutation.payload?.artist || "")
                .trim()
                .toLowerCase() &&
            String(entry.song || "")
              .trim()
              .toLowerCase() ===
              String(mutation.payload?.song || "")
                .trim()
                .toLowerCase(),
        );

        await fetchApi.post("/api/newsong", {
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: mutation.payload.userdata || cachedSong || mutation.payload,
        });
      }

      nextQueue = nextQueue.map((entry) =>
        entry.id === mutation.id ? { ...entry, status: "SYNCED" } : entry,
      );
      synced += 1;
    } catch (error) {
      nextQueue = nextQueue.map((entry) =>
        entry.id === mutation.id
          ? { ...entry, status: "FAILED", retries: (entry.retries || 0) + 1 }
          : entry,
      );
    }

    writeOfflineSyncQueue(nextQueue);
  }

  writeOfflineSyncQueue(clearSyncedMutations(nextQueue));
  if (synced > 0) {
    setOfflineModeEnabled(false);
    setOfflineReauthRequired(false);
  }
  return { synced };
}

/* =========================
   Create New Song (user DB)
   ========================= */

export async function createNewSongOnServer({
  songName,
  artistName,
  instrumentName,
  geralPercentage = 0,
  setlist = [],
  instrumentFields = {},
  embedLink = [],
  capo = "",
  tom = "",
  tuning = "",
}) {
  const email =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }
  if (!songName || !artistName) {
    throw new Error("songName e artistName são obrigatórios.");
  }

  const flags = {
    guitar01: instrumentName === "guitar01",
    guitar02: instrumentName === "guitar02",
    bass: instrumentName === "bass",
    keys: instrumentName === "keys",
    drums: instrumentName === "drums",
    voice: instrumentName === "voice",
  };

  const buildInitialPresentationLayouts = (songCifra = "") => ({
    default: {
      songCifra,
      fontSizeStep: 0,
      twoColumns: false,
      showProgressionMarkers: false,
      progressionMarkOverrides: {},
    },
    expanded: {
      songCifra,
      fontSizeStep: 0,
      twoColumns: true,
      showProgressionMarkers: false,
      progressionMarkOverrides: {},
    },
  });

  const block = (name) => {
    if (!flags[name]) {
      return {
        active: "",
        capo: "",
        lastPlay: "",
        link: "",
        progress: "",
        songCifra: "",
        songTabs: "",
        songChords: "",
        songLyrics: "",
        tuning: "",
      };
    }

    const songCifraValue = instrumentFields.songCifra ?? "";
    return {
      active: instrumentFields.active ?? true,
      capo: instrumentFields.capo ?? "",
      lastPlay: instrumentFields.lastPlay ?? "",
      link: instrumentFields.link ?? "",
      progress: instrumentFields.progress ?? "",
      songCifra: songCifraValue,
      songTabs: instrumentFields.songTabs ?? "",
      songChords: instrumentFields.songChords ?? "",
      songLyrics: instrumentFields.songLyrics ?? "",
      tuning: instrumentFields.tuning ?? "",
      presentationLayouts:
        instrumentFields.presentationLayouts ||
        (String(songCifraValue || "").trim()
          ? buildInitialPresentationLayouts(songCifraValue)
          : undefined),
    };
  };

  const userdata = {
    song: songName,
    artist: artistName,
    progressBar: geralPercentage || 0,
    capo,
    tom,
    tuning,
    setlist,
    instruments: { ...flags },
    guitar01: block("guitar01"),
    guitar02: block("guitar02"),
    bass: block("bass"),
    keys: block("keys"),
    drums: block("drums"),
    voice: block("voice"),
    embedVideos: embedLink || [],
    addedIn: new Date().toISOString().split("T")[0],
    updateIn: new Date().toISOString().split("T")[0],
    email,
    username: "",
    fullName: "",
  };

  const payload = {
    databaseComing: "liveNloud_",
    collectionComing: "data",
    userdata,
  };

  const resp = await fetchApi.post("/api/newsong", payload);
  return resp.data;
}

/* =========================
   Upload Avatar
   ========================= */

export async function uploadProfileImage(file, opts = {}) {
  const { email: emailOverride, onProgress } = opts;
  const email =
    emailOverride ||
    (typeof window !== "undefined" ? localStorage.getItem("userEmail") : null);

  if (!email) {
    throw new Error("Usuário não autenticado (sem userEmail no localStorage).");
  }
  if (!file) {
    throw new Error("Nenhum arquivo para upload.");
  }

  const formData = new FormData();
  formData.append("profileImage", file);
  formData.append("email", email);

  const response = await fetchApi.post("/api/uploadProfileImage", formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });
  if (typeof onProgress === "function") onProgress(100);
  return response;
}

/* =========================
   Cifra: rotas
   ========================= */

/** Checa se a cifra já existe no banco geral (usa link normalizado). */
export async function checkCifraExists({ instrumentName, link, artist, song }) {
  const linkNorm = normalizeLink(link);
  console.log("[checkCifraExists] →", { instrumentName, link, linkNorm });

  try {
    const res = await fetchApi.get("/api/generalCifra", {
      params: { instrument: instrumentName, link, artist, song },
    });
    console.log("[checkCifraExists] ✔ encontrado:", res.data);
    return { exists: true, data: res.data };
  } catch (err) {
    if (err?.response?.status === 404) {
      console.log("[checkCifraExists] ✖ 404 (não encontrado)");
      return { exists: false };
    }
    console.error("[checkCifraExists] ⚠ erro:", {
      status: err?.response?.status,
      data: err?.response?.data,
      msg: err?.message,
    });
    throw err;
  }
}

/** Dispara o scraper e envia também `linkNorm` (com logs). */
export async function scrapeCifra({
  artist,
  song,
  email,
  instrumentName,
  progress,
  link,
}) {
  const linkNorm = normalizeLink(link);
  const payload = {
    artist,
    song,
    email,
    instrument: instrumentName,
    instrument_progressbar: progress,
    link,
    linkNorm,
  };

  console.log("[scrapeCifra] → payload", payload);

  const res = await fetchApi.post("/api/scrape", payload);

  console.log("[scrapeCifra] ← resposta", {
    status: res.status,
    data: res.data,
  });

  return res.data;
}

/** Cria/atualiza no banco geral manualmente (se precisar). */
export async function saveToGeneralCifra({
  song,
  artist,
  instrumentName, // "guitar01" | "guitar02" | ...
  link,
  songCifra = "",
  capo = "",
  tuning = "",
  embedVideos = [],
  setlist = [],
  email, // opcional: usa localStorage se ausente
}) {
  if (!song || !artist) {
    throw new Error("song e artist são obrigatórios.");
  }

  const instr = normalizeInstrument(instrumentName);
  if (!instr) {
    throw new Error(
      `Instrumento inválido: "${instrumentName}". Use um de: ${ALLOWED_INSTRUMENTS.join(
        ", ",
      )}.`,
    );
  }

  const userEmail =
    email ||
    (typeof window !== "undefined" ? localStorage.getItem("userEmail") : "") ||
    "";

  const instruments = {
    guitar01: false,
    guitar02: false,
    bass: false,
    keys: false,
    drums: false,
    voice: false,
    [instr]: true,
  };

  const activeInstrumentDoc = {
    link: link || "",
    songCifra: songCifra || "",
    capo: capo || "",
    tuning: tuning || "",
  };

  const payload = {
    song,
    artist,
    instruments,
    [instr]: activeInstrumentDoc,
    embedVideos: Array.isArray(embedVideos) ? embedVideos : [],
    setlist: Array.isArray(setlist) ? setlist : [],
    email: userEmail,
  };

  try {
    const { data } = await fetchApi.post("/api/generalCifra", payload);
    return data; // 201 criado | 200 atualizado
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err.message;
    console.error("[saveToGeneralCifra]", status, msg, err?.response?.data);
    throw err;
  }
}

// ✅ 1) Exportar um alias compatível com o que o componente espera
export { updateUserName as updateUsername };

// ✅ 2) Implementar updatePassword e exportar
/**
 * Atualiza a senha do usuário.
 * Ajuste a URL conforme o seu backend:
 *   - comum:  /api/updatePassword
 *   - ou:     /api/auth/updatePassword
 */
export async function updatePassword({ email, currentPassword, newPassword }) {
  if (!email) {
    // lê do localStorage se não vier por parâmetro
    email =
      (typeof window !== "undefined" && localStorage.getItem("userEmail")) ||
      null;
  }
  if (!email) throw new Error("Email do usuário não encontrado.");

  const payload = { email, currentPassword, newPassword };

  // 👉 Se sua rota for /api/updatePassword, troque abaixo:
  const url = "/api/auth/updatePassword";

  const { data } = await fetchApi.put(url, payload);
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await fetchApi.post("/api/auth/request-password-reset", {
    email,
  });
  return data;
}

export async function resetPassword({ email, token, newPassword }) {
  const { data } = await fetchApi.post("/api/auth/reset-password", {
    email,
    token,
    newPassword,
  });
  return data;
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("username");
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  localStorage.removeItem(OFFLINE_MODE_KEY);
  localStorage.removeItem(OFFLINE_SYNC_QUEUE_KEY);
  localStorage.removeItem(OFFLINE_SONGS_KEY);
}
