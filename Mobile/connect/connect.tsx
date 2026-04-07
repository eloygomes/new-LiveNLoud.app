import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import axios from "axios";

// Get list of music

const API_BASE_URL = "https://api.live.eloygomes.com/api";
export const API_SOCKET_BASE_URL = "https://api.live.eloygomes.com";
const AUTH_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_EMAIL_KEY = "userEmail";
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
    const userdata = Array.isArray(parsed) ? parsed : [];
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
    await AsyncStorage.setItem(
      userdataCacheKey(normalizedEmail),
      JSON.stringify(Array.isArray(userdata) ? userdata : []),
    );
    debugLog("userdataCache", "stored", {
      email: normalizedEmail,
      count: Array.isArray(userdata) ? userdata.length : 0,
    });
  } catch (error) {
    debugWarn("userdataCache", "write failed", error);
  }
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

function requestBodyToAxiosData(body?: BodyInit | null) {
  if (!body) return undefined;
  if (typeof body !== "string") return body;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function isWriteRequest(init: RequestInit = {}) {
  const method = String(init.method || "GET").toUpperCase();
  return !["GET", "HEAD"].includes(method);
}

async function authAxiosJson<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getStoredToken();
  const method = String(init.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  debugLog("authAxios", "request", {
    path,
    method,
    hasToken: Boolean(token),
    timeoutMs: ANDROID_WRITE_TIMEOUT_MS,
  });

  const response = await axios({
    url: `${API_BASE_URL}${path}`,
    method,
    headers,
    data: requestBodyToAxiosData(init.body),
    timeout: ANDROID_WRITE_TIMEOUT_MS,
    validateStatus: () => true,
  });

  debugLog("authAxios", "status", { path, status: response.status });

  if (retry && [401, 403].includes(response.status) && !path.startsWith("/auth/")) {
    debugWarn("authAxios", "retrying with refresh token", {
      path,
      status: response.status,
    });
    const nextToken = await refreshAccessToken();
    const retryResponse = await axios({
      url: `${API_BASE_URL}${path}`,
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${nextToken}`,
      },
      data: requestBodyToAxiosData(init.body),
      timeout: ANDROID_WRITE_TIMEOUT_MS,
      validateStatus: () => true,
    });

    debugLog("authAxios", "retry status", {
      path,
      status: retryResponse.status,
    });

    if (retryResponse.status >= 400) {
      const message =
        retryResponse.data?.message ||
        retryResponse.data?.error ||
        `HTTP ${retryResponse.status}`;
      throw new Error(message);
    }

    return retryResponse.data as T;
  }

  if (response.status >= 400) {
    const message =
      response.data?.message || response.data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.data as T;
}

async function authJson<T>(path: string, init: RequestInit = {}) {
  if (Platform.OS === "android" && isWriteRequest(init)) {
    return authAxiosJson<T>(path, init);
  }

  const response = await authFetch(path, init);
  return readJsonOrThrow(response) as Promise<T>;
}

export async function persistAuthSession(
  accessToken: string,
  email: string,
  refreshToken?: string
) {
  const entries: [string, string][] = [
    [AUTH_TOKEN_KEY, accessToken],
    [USER_EMAIL_KEY, email],
  ];

  if (refreshToken) {
    entries.push([REFRESH_TOKEN_KEY, refreshToken]);
  }

  await AsyncStorage.multiSet(entries);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_EMAIL_KEY]);
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
    }),
  });

  await readJsonOrThrow(authResponse);

  const userdata = createDefaultUserdata(
    normalizedEmail,
    username.trim(),
    fullName.trim()
  );

  const userResponse = await fetchWithTimeout(`${API_BASE_URL}/newsong`, {
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

  return readJsonOrThrow(userResponse);
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

  const response = await fetchWithTimeout(`${API_BASE_URL}/updateSetlists`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      setlists,
    }),
  });

  return readJsonOrThrow(response);
}

export const getListOfMusic = async ({ email }: Props) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const url = `${API_BASE_URL}/alldata/${encodeURIComponent(normalizedEmail)}`;
    debugLog("getListOfMusic", "request", {
      url,
      email: normalizedEmail,
    });
    const response = await fetchWithTimeout(url);
    debugLog("getListOfMusic", "status", response.status);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    const userdata = Array.isArray(data?.userdata) ? data.userdata : [];
    debugLog("getListOfMusic", "count", userdata.length);
    await writeCachedUserdata(normalizedEmail, userdata);
    return userdata;
  } catch (error) {
    debugWarn("getListOfMusic", "request failed, checking cache", error);
    const cachedUserdata = await readCachedUserdata(email);
    debugWarn("getListOfMusic", "using cached fallback", cachedUserdata.length);
    return cachedUserdata;
  }
};

export const getAllUserData = async ({ email }: Props) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const url = `${API_BASE_URL}/alldata/${encodeURIComponent(normalizedEmail)}`;
    debugLog("getAllUserData", "request", {
      url,
      email: normalizedEmail,
    });
    const response = await fetchWithTimeout(url);
    debugLog("getAllUserData", "status", response.status);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const userdata = Array.isArray(data?.userdata) ? data.userdata : [];
    debugLog("getAllUserData", "count", userdata.length);
    await writeCachedUserdata(normalizedEmail, userdata);

    return userdata;
  } catch (error) {
    debugWarn("getAllUserData", "request failed, checking cache", error);
    const cachedUserdata = await readCachedUserdata(email);
    debugWarn("getAllUserData", "using cached fallback", cachedUserdata.length);
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/allsongdata`, {
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
      return cachedSong;
    }

    throw error; // repassa para quem chamou, se quiser tratar lá
  }
};
