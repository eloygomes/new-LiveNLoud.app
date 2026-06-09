import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  applyOfflineSongUpdate,
  buildOfflineMutation,
  canUseOfflineSession,
  clearSyncedMutations,
  enqueueOfflineMutation,
  normalizeOfflineSongs,
  toggleSongOfflineState,
  type OfflineMutation,
  type OfflineSong,
} from "./offlineStore";

// Get list of music

const API_BASE_URL = "https://api.live.eloygomes.com/api";
export const API_SOCKET_BASE_URL = "https://api.live.eloygomes.com";
const AUTH_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_EMAIL_KEY = "userEmail";
const SESSION_TIMESTAMP_KEY = "sessionTimestamp";
const OFFLINE_MODE_KEY = "offline:isOfflineMode";
const OFFLINE_SYNC_QUEUE_KEY = "offline:syncQueue";
const API_TIMEOUT_MS = 12000;
const ANDROID_WRITE_TIMEOUT_MS = 35000;
const RUNTIME_TAG = `[${Platform.OS}]`;
const USERDATA_CACHE_PREFIX = "cachedUserdata";

type Props = {
  email: string;
  artist: string;
  song: string;
};

type SignUpPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
};
const DEFAULT_SETLISTS = [
  "guitar01",
  "guitar02",
  "bass",
  "keys",
  "drums",
  "voice",
];

export type UserProfile = {
  email: string;
  username?: string;
  usernameDisplay?: string;
  fullName?: string;
  acceptedInvitations?: FriendEntry[];
};

export type FriendEntry = {
  invitationId?: string;
  counterpartEmail: string;
  counterpartUsername?: string;
  counterpartFullName?: string;
  acceptedAt?: string;
};

export type Invitation = {
  _id: string;
  senderEmail: string;
  senderUsername?: string;
  senderFullName?: string;
  receiverEmail: string;
  receiverUsername?: string;
  receiverFullName?: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationEntry = {
  _id: string;
  userEmail: string;
  type: string;
  title: string;
  message: string;
  read?: boolean;
  meta?: {
    eventId?: string;
    invitationId?: string;
    status?: string;
    action?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
};

export type CalendarUser = {
  email: string;
  username?: string;
  fullName?: string;
};

export type CalendarEvent = {
  _id: string;
  title: string;
  description?: string;
  startsAt: string;
  ownerEmail: string;
  ownerUsername?: string;
  invitedUsers?: CalendarUser[];
  pendingInvitedUsers?: CalendarUser[];
  invitedUsersText?: string;
  allowGuestEdit?: boolean;
  inviteStatus?: "owner" | "accepted" | "pending";
  createdAt?: string;
  updatedAt?: string;
};

export type UserLog = {
  _id: string;
  userEmail: string;
  action: string;
  message: string;
  createdAt?: string;
  meta?: Record<string, unknown>;
};

export type UserSearchResult = {
  email: string;
  username?: string;
  usernameDisplay?: string;
  fullName?: string;
};

export type CalendarEventPayload = {
  title: string;
  description?: string;
  startsAt: string;
  invitedUsersText?: string;
  allowGuestEdit?: boolean;
};

function debugLog(scope: string, ...args: unknown[]) {
  console.log(`${RUNTIME_TAG} [${scope}]`, ...args);
}

function debugWarn(scope: string, ...args: unknown[]) {
  console.warn(`${RUNTIME_TAG} [${scope}]`, ...args);
}

function debugError(scope: string, ...args: unknown[]) {
  console.error(`${RUNTIME_TAG} [${scope}]`, ...args);
}

export function getRuntimeDebugInfo() {
  return {
    platform: Platform.OS,
    runtimeTag: RUNTIME_TAG,
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function userdataCacheKey(email: string) {
  return `${USERDATA_CACHE_PREFIX}:${email.trim().toLowerCase()}`;
}

async function readCachedUserdata(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const cached = await AsyncStorage.getItem(userdataCacheKey(normalizedEmail));
    if (!cached) {
      debugWarn("userdataCache", "miss", normalizedEmail);
      return [];
    }

    const parsed = JSON.parse(cached);
    const userdata = normalizeOfflineSongs(Array.isArray(parsed) ? parsed : []);
    debugLog("userdataCache", "hit", {
      email: normalizedEmail,
      count: userdata.length,
    });
    return userdata;
  } catch (error) {
    debugWarn("userdataCache", "read failed", error);
    return [];
  }
}

async function writeCachedUserdata(email: string, userdata: unknown[]) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const normalizedSongs = normalizeOfflineSongs(
      Array.isArray(userdata) ? (userdata as OfflineSong[]) : [],
    );
    await AsyncStorage.setItem(
      userdataCacheKey(normalizedEmail),
      JSON.stringify(normalizedSongs),
    );
    debugLog("userdataCache", "stored", {
      email: normalizedEmail,
      count: normalizedSongs.length,
    });
  } catch (error) {
    debugWarn("userdataCache", "write failed", error);
  }
}

async function readOfflineSyncQueue() {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineMutation[]) : [];
  } catch (error) {
    debugWarn("offlineQueue", "read failed", error);
    return [];
  }
}

async function writeOfflineSyncQueue(queue: OfflineMutation[]) {
  await AsyncStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
}

async function setOfflineModeEnabled(enabled: boolean) {
  await AsyncStorage.setItem(OFFLINE_MODE_KEY, enabled ? "true" : "false");
}

export async function isOfflineModeEnabled() {
  return (await AsyncStorage.getItem(OFFLINE_MODE_KEY)) === "true";
}

export async function getOfflineStatus() {
  const [email, songs, queue, offlineMode] = await Promise.all([
    getStoredUserEmail(),
    getStoredUserEmail().then((value) => (value ? readCachedUserdata(value) : [])),
    readOfflineSyncQueue(),
    isOfflineModeEnabled(),
  ]);

  return {
    email,
    offlineMode,
    pendingChanges: queue.filter((entry) => entry.status !== "SYNCED").length,
    offlineEnabledSongs: normalizeOfflineSongs(songs as OfflineSong[]).filter(
      (song) => song.offlineEnabled,
    ),
  };
}

async function enqueueMutation(mutation: OfflineMutation) {
  const queue = await readOfflineSyncQueue();
  const nextQueue = enqueueOfflineMutation(queue, mutation);
  await writeOfflineSyncQueue(nextQueue);
}

async function findCachedSongData({
  email,
  artist,
  song,
}: Props) {
  const normalizedArtist = artist.trim().toLowerCase();
  const normalizedSong = song.trim().toLowerCase();
  const cachedSongs = await readCachedUserdata(email);

  return cachedSongs.find((entry: any) => {
    return (
      String(entry?.artist || "").trim().toLowerCase() === normalizedArtist &&
      String(entry?.song || "").trim().toLowerCase() === normalizedSong
    );
  });
}

const emptyInstrument = {
  active: "",
  capo: "",
  lastPlay: "",
  link: "",
  progress: "",
  songCifra: "",
  tuning: "",
};

function createDefaultUserdata(email: string, username: string, fullName: string) {
  const today = new Date().toISOString().split("T")[0];

  return {
    id: 1,
    song: "",
    artist: "",
    progressBar: 0,
    instruments: {
      guitar01: false,
      guitar02: false,
      bass: false,
      keys: false,
      drums: false,
      voice: false,
    },
    guitar01: { ...emptyInstrument },
    guitar02: { ...emptyInstrument },
    bass: { ...emptyInstrument },
    keys: { ...emptyInstrument },
    drums: { ...emptyInstrument },
    voice: { ...emptyInstrument },
    embedVideos: [],
    setlist: [...DEFAULT_SETLISTS],
    addedIn: today,
    updateIn: today,
    email,
    username,
    fullName,
  };
}

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function getStoredToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

async function getStoredRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  debugLog("auth", "refresh token request");
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }, Platform.OS === "android" ? ANDROID_WRITE_TIMEOUT_MS : API_TIMEOUT_MS);
  const data = await readJsonOrThrow(response);

  if (!data?.accessToken) {
    throw new Error("Access token refresh failed.");
  }

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  return data.accessToken as string;
}

async function authFetch(path: string, init: RequestInit = {}, retry = true) {
  const token = await getStoredToken();
  const method = String(init.method || "GET").toUpperCase();
  const timeoutMs =
    Platform.OS === "android" && !["GET", "HEAD"].includes(method)
      ? ANDROID_WRITE_TIMEOUT_MS
      : API_TIMEOUT_MS;
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  debugLog("authFetch", "request", {
    path,
    method,
    hasToken: Boolean(token),
    timeoutMs,
  });

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  }, timeoutMs);
  debugLog("authFetch", "status", { path, status: response.status });

  if (retry && [401, 403].includes(response.status) && !path.startsWith("/auth/")) {
    debugWarn("authFetch", "retrying with refresh token", {
      path,
      status: response.status,
    });
    const nextToken = await refreshAccessToken();
    const retryResponse = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...headers,
        Authorization: `Bearer ${nextToken}`,
      },
    }, timeoutMs);
    debugLog("authFetch", "retry status", {
      path,
      status: retryResponse.status,
    });
    return retryResponse;
  }

  return response;
}

async function authJson<T>(path: string, init: RequestInit = {}) {
  const response = await authFetch(path, init);
  return readJsonOrThrow(response) as Promise<T>;
}

export async function persistAuthSession(
  accessToken: string,
  email: string,
  refreshToken?: string
) {
  const timestamp = new Date().toISOString();
  const entries: [string, string][] = [
    [AUTH_TOKEN_KEY, accessToken],
    [USER_EMAIL_KEY, email],
    [SESSION_TIMESTAMP_KEY, timestamp],
    [OFFLINE_MODE_KEY, "false"],
  ];

  if (refreshToken) {
    entries.push([REFRESH_TOKEN_KEY, refreshToken]);
  }

  await AsyncStorage.multiSet(entries);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([
    AUTH_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_EMAIL_KEY,
    SESSION_TIMESTAMP_KEY,
    OFFLINE_MODE_KEY,
  ]);
}

export async function getStoredUserEmail() {
  return AsyncStorage.getItem(USER_EMAIL_KEY);
}

export async function getCurrentUserEmail() {
  const storedEmail = await getStoredUserEmail();
  if (storedEmail?.trim()) {
    const normalizedEmail = storedEmail.trim().toLowerCase();
    debugLog("session", "email from storage", normalizedEmail);
    return normalizedEmail;
  }

  debugWarn("session", "email missing in storage, requesting /me");
  const profile = await fetchCurrentUserProfile().catch(() => null);
  const normalizedEmail = profile?.email?.trim().toLowerCase() || "";
  debugLog("session", "email from /me", normalizedEmail || "no-email");
  return normalizedEmail;
}

const selectedSetlistsKey = (email?: string | null) => {
  const normalizedEmail = email?.trim().toLowerCase();
  return normalizedEmail
    ? `mySelectedSetlists:${normalizedEmail}`
    : "mySelectedSetlists";
};

export function loadSelectedSetlists(email?: string | null) {
  return AsyncStorage.getItem(selectedSetlistsKey(email))
    .then((value) => {
      if (!value) return [];
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    })
    .catch(() => []);
}

export function saveSelectedSetlists(setlists: string[], email?: string | null) {
  return AsyncStorage.setItem(
    selectedSetlistsKey(email),
    JSON.stringify(setlists ?? []),
  );
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
    }),
  });

  const data = await readJsonOrThrow(response);
  const accessToken = data?.accessToken;

  if (!accessToken) {
    throw new Error("Resposta de login invalida.");
  }

  await persistAuthSession(accessToken, normalizedEmail, data?.refreshToken);
  return data;
}

export async function tryOfflineLogin(email?: string) {
  const normalizedEmail = email?.trim().toLowerCase() || (await getStoredUserEmail()) || "";
  const [refreshToken, sessionTimestamp, songs] = await Promise.all([
    getStoredRefreshToken(),
    AsyncStorage.getItem(SESSION_TIMESTAMP_KEY),
    normalizedEmail ? readCachedUserdata(normalizedEmail) : Promise.resolve([]),
  ]);

  const allowed = canUseOfflineSession({
    refreshToken,
    sessionTimestamp,
    songs: songs as OfflineSong[],
  });

  if (!allowed || !normalizedEmail) {
    return false;
  }

  await AsyncStorage.multiSet([
    [USER_EMAIL_KEY, normalizedEmail],
    [OFFLINE_MODE_KEY, "true"],
  ]);
  return true;
}

export async function fetchCurrentUserProfile() {
  const profile = await authJson<UserProfile>("/me");

  if (profile?.email) {
    await AsyncStorage.setItem(USER_EMAIL_KEY, profile.email.trim().toLowerCase());
  }

  return profile;
}

export async function searchUsers(query: string) {
  const data = await authJson<UserSearchResult[]>(
    `/users/search?q=${encodeURIComponent(query)}`
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchNotifications() {
  const data = await authJson<NotificationEntry[]>("/notifications");
  return Array.isArray(data) ? data : [];
}

export async function markNotificationAsRead(notificationId: string) {
  return authJson<NotificationEntry>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PUT" }
  );
}

export async function markAllNotificationsAsRead() {
  return authJson<{ message: string }>("/notifications/read-all", {
    method: "PUT",
  });
}

export async function fetchInvitations() {
  const data = await authJson<Invitation[]>("/invitations");
  return Array.isArray(data) ? data : [];
}

export async function createInvitation({
  identifier,
  message = "",
}: {
  identifier: string;
  message?: string;
}) {
  return authJson<Invitation>("/invitations", {
    method: "POST",
    body: JSON.stringify({
      email: identifier.trim().toLowerCase(),
      message,
    }),
  });
}

export async function respondToInvitation(
  invitationId: string,
  status: "accepted" | "declined"
) {
  return authJson<Invitation>(
    `/invitations/${encodeURIComponent(invitationId)}/respond`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    }
  );
}

export async function revokeFriendship(counterpartEmail: string) {
  return authJson<{ message: string }>(
    `/friends/${encodeURIComponent(counterpartEmail.trim().toLowerCase())}`,
    { method: "DELETE" }
  );
}

export async function fetchUserLogs() {
  const data = await authJson<UserLog[]>("/logs");
  return Array.isArray(data) ? data : [];
}

export async function fetchCalendarEvents() {
  const data = await authJson<CalendarEvent[]>("/calendar/events");
  return Array.isArray(data) ? data : [];
}

export async function fetchCalendarEvent(eventId: string) {
  return authJson<CalendarEvent>(`/calendar/events/${encodeURIComponent(eventId)}`);
}

export async function createCalendarEvent(payload: CalendarEventPayload) {
  return authJson<CalendarEvent>("/calendar/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCalendarEvent(
  eventId: string,
  payload: CalendarEventPayload
) {
  return authJson<CalendarEvent>(`/calendar/events/${encodeURIComponent(eventId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCalendarEvent(eventId: string) {
  return authJson<{ message: string }>(
    `/calendar/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" }
  );
}

export async function respondToCalendarEvent(
  eventId: string,
  status: "accepted" | "declined"
) {
  return authJson<{ event: CalendarEvent; status: string }>(
    `/calendar/events/${encodeURIComponent(eventId)}/respond`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    }
  );
}

export async function signUp({
  fullName,
  username,
  email,
  password,
}: SignUpPayload) {
  const normalizedEmail = email.trim().toLowerCase();

  const authResponse = await fetchWithTimeout(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
      fullName: fullName.trim(),
      username: username.trim(),
    }),
  });

  const authData = await readJsonOrThrow(authResponse);

  const userdata = createDefaultUserdata(
    normalizedEmail,
    username.trim(),
    fullName.trim()
  );

  const userResponse = await fetchWithTimeout(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      databaseComing: "liveNloud_",
      collectionComing: "data",
      userdata,
    }),
  });

  const userData = await readJsonOrThrow(userResponse);
  return { authData, userData };
}

export async function requestPasswordReset(email: string) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });

  return readJsonOrThrow(response);
}

export async function resetPassword({
  email,
  token,
  newPassword,
}: ResetPasswordPayload) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      newPassword,
    }),
  });

  return readJsonOrThrow(response);
}

export async function updateUserSetlists(setlists: string[]) {
  const email = await getStoredUserEmail();

  if (!email) {
    throw new Error("Usuário não autenticado.");
  }

  try {
    const response = await authFetch("/updateSetlists", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        setlists,
      }),
    });

    await setOfflineModeEnabled(false);
    return await readJsonOrThrow(response);
  } catch (error) {
    await enqueueMutation(
      buildOfflineMutation("UPDATE_SETLISTS", {
        email,
        setlists,
      }),
    );
    await setOfflineModeEnabled(true);
    return {
      message: "Setlists saved locally and queued for sync.",
      availableSetlists: setlists,
      queued: true,
    };
  }
}

export async function downloadUserDataMobile() {
  const email = await getCurrentUserEmail();
  if (!email) {
    throw new Error("User email not found.");
  }

  const response = await authFetch(
    `/downloadUserData/${encodeURIComponent(email)}`,
    { method: "GET", headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
  }

  return response.text();
}

export async function deleteAllUserSongsMobile() {
  const email = await getCurrentUserEmail();
  if (!email) {
    throw new Error("User email not found.");
  }

  return authJson<{ message: string; modifiedCount?: number; remainingSongs?: unknown[] }>(
    "/deleteAllUserSongs",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function deleteUserAccountMobile(password: string) {
  const email = await getCurrentUserEmail();
  if (!email) {
    throw new Error("User email not found.");
  }

  return authJson<{ message: string; deletedCount?: number }>(
    "/deleteUserAccount",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

export const getListOfMusic = async ({ email }: Props) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const url = `/alldata/${encodeURIComponent(normalizedEmail)}`;
    debugLog("getListOfMusic", "request", {
      url,
      email: normalizedEmail,
    });
    const response = await authFetch(url);
    debugLog("getListOfMusic", "status", response.status);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    const userdata = normalizeOfflineSongs(
      Array.isArray(data?.userdata) ? data.userdata : [],
    );
    debugLog("getListOfMusic", "count", userdata.length);
    await writeCachedUserdata(normalizedEmail, userdata);
    await setOfflineModeEnabled(false);
    return userdata;
  } catch (error) {
    debugWarn("getListOfMusic", "request failed, checking cache", error);
    const cachedUserdata = await readCachedUserdata(email);
    debugWarn("getListOfMusic", "using cached fallback", cachedUserdata.length);
    await setOfflineModeEnabled(cachedUserdata.length > 0);
    return cachedUserdata;
  }
};

export const getAllUserData = async ({ email }: Props) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const url = `/alldata/${encodeURIComponent(normalizedEmail)}`;
    debugLog("getAllUserData", "request", {
      url,
      email: normalizedEmail,
    });
    const response = await authFetch(url);
    debugLog("getAllUserData", "status", response.status);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const userdata = normalizeOfflineSongs(
      Array.isArray(data?.userdata) ? data.userdata : [],
    );
    debugLog("getAllUserData", "count", userdata.length);
    await writeCachedUserdata(normalizedEmail, userdata);
    await setOfflineModeEnabled(false);

    return userdata;
  } catch (error) {
    debugWarn("getAllUserData", "request failed, checking cache", error);
    const cachedUserdata = await readCachedUserdata(email);
    debugWarn("getAllUserData", "using cached fallback", cachedUserdata.length);
    await setOfflineModeEnabled(cachedUserdata.length > 0);
    return cachedUserdata;
  }
};

export const getSpecificSongData = async ({ email, artist, song }: Props) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (Platform.OS === "android") {
      const cachedSong = await findCachedSongData({
        email: normalizedEmail,
        artist,
        song,
      });

      if (cachedSong) {
        debugWarn("getSpecificSongData", "android cache-first hit", {
          artist,
          song,
        });
        return cachedSong;
      }
    }

    debugLog("getSpecificSongData", "request", {
      email: normalizedEmail,
      artist,
      song,
    });
    const response = await authFetch("/allsongdata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail, artist, song }),
    });
    debugLog("getSpecificSongData", "status", response.status);

    if (!response.ok) {
      const { message } = await response.json();
      throw new Error(message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    debugLog("getSpecificSongData", "loaded", {
      hasData: Boolean(data),
      keys: data ? Object.keys(data) : [],
    });
    return data;
  } catch (error) {
    debugWarn("getSpecificSongData", "request failed, checking cache", error);
    const cachedSong = await findCachedSongData({ email, artist, song });

    if (cachedSong) {
      debugWarn("getSpecificSongData", "using cached fallback", {
        artist,
        song,
      });
      await setOfflineModeEnabled(true);
      return cachedSong;
    }

    throw error; // repassa para quem chamou, se quiser tratar lá
  }
};

export async function setSongOfflineEnabled({
  email,
  artist,
  song,
  offlineEnabled,
}: {
  email: string;
  artist: string;
  song: string;
  offlineEnabled: boolean;
}) {
  const cachedSongs = await readCachedUserdata(email);
  const nextSongs = toggleSongOfflineState(
    cachedSongs as OfflineSong[],
    { artist, song },
    offlineEnabled,
  );

  await writeCachedUserdata(email, nextSongs);
  await enqueueMutation(
    buildOfflineMutation("TOGGLE_OFFLINE", {
      email,
      artist,
      song,
      offlineEnabled,
    }),
  );

  return nextSongs;
}

export async function saveSongOfflineEdit({
  email,
  songData,
}: {
  email: string;
  songData: OfflineSong;
}) {
  const cachedSongs = await readCachedUserdata(email);
  const nextSongs = applyOfflineSongUpdate(
    cachedSongs as OfflineSong[],
    songData,
  );

  await writeCachedUserdata(email, nextSongs);
  await enqueueMutation(
    buildOfflineMutation("UPSERT_SONG", {
      email,
      song: songData.song,
      artist: songData.artist,
      userdata: songData,
    }),
  );

  return nextSongs;
}

export async function syncOfflineQueue() {
  const queue = await readOfflineSyncQueue();
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
      await writeOfflineSyncQueue(nextQueue);

      if (mutation.action === "UPDATE_SETLISTS") {
        const email = String(mutation.payload.email || "");
        const setlists = Array.isArray(mutation.payload.setlists)
          ? mutation.payload.setlists
          : [];
        const response = await authFetch("/updateSetlists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, setlists }),
        });
        await readJsonOrThrow(response);
      } else {
        const response = await authFetch("/newsong", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            databaseComing: "liveNloud_",
            collectionComing: "data",
            userdata: mutation.payload.userdata || mutation.payload,
          }),
        });
        await readJsonOrThrow(response);
      }

      nextQueue = nextQueue.map((entry) =>
        entry.id === mutation.id ? { ...entry, status: "SYNCED" } : entry,
      );
      synced += 1;
    } catch (error) {
      debugWarn("offlineQueue", "sync failed", error);
      nextQueue = nextQueue.map((entry) =>
        entry.id === mutation.id
          ? { ...entry, status: "FAILED", retries: entry.retries + 1 }
          : entry,
      );
    }

    await writeOfflineSyncQueue(nextQueue);
  }

  await writeOfflineSyncQueue(clearSyncedMutations(nextQueue));
  if (synced > 0) {
    await setOfflineModeEnabled(false);
  }
  return { synced };
}
