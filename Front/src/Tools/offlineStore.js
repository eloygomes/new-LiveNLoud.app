export const OFFLINE_MAX_SESSION_DAYS = 30;
export const OFFLINE_AUTO_LOGIN_HOURS = 24;

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function createMutationId() {
  return `offline-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function normalizeOfflineSong(song = {}) {
  return {
    ...song,
    offlineEnabled: Boolean(song.offlineEnabled),
    requiresSync: Boolean(song.requiresSync),
    lastOfflineSyncTime:
      typeof song.lastOfflineSyncTime === "string" && song.lastOfflineSyncTime.trim()
        ? song.lastOfflineSyncTime
        : null,
  };
}

export function normalizeOfflineSongs(songs = []) {
  return (Array.isArray(songs) ? songs : []).map((song) =>
    normalizeOfflineSong(song),
  );
}

export function findSongIndex(songs = [], target = {}) {
  const targetArtist = normalizeText(target.artist);
  const targetSong = normalizeText(target.song);

  return songs.findIndex(
    (entry) =>
      normalizeText(entry.artist) === targetArtist &&
      normalizeText(entry.song) === targetSong,
  );
}

export function toggleSongOfflineState(
  songs = [],
  target = {},
  offlineEnabled,
  timestamp = new Date().toISOString(),
) {
  const nextSongs = normalizeOfflineSongs(songs);
  const targetIndex = findSongIndex(nextSongs, target);

  if (targetIndex < 0) {
    throw new Error("Song not found in offline cache.");
  }

  nextSongs[targetIndex] = {
    ...nextSongs[targetIndex],
    offlineEnabled: Boolean(offlineEnabled),
    requiresSync: true,
    lastOfflineSyncTime: offlineEnabled
      ? nextSongs[targetIndex].lastOfflineSyncTime || timestamp
      : nextSongs[targetIndex].lastOfflineSyncTime || null,
  };

  return nextSongs;
}

export function applyOfflineSongUpdate(
  songs = [],
  updatedSong = {},
  timestamp = new Date().toISOString(),
) {
  const nextSongs = normalizeOfflineSongs(songs);
  const targetIndex = findSongIndex(nextSongs, updatedSong);

  if (targetIndex < 0) {
    throw new Error("Song not found in offline cache.");
  }

  nextSongs[targetIndex] = normalizeOfflineSong({
    ...nextSongs[targetIndex],
    ...updatedSong,
    requiresSync: true,
    updateIn: timestamp.split("T")[0],
  });

  return nextSongs;
}

export function buildOfflineMutation(action, payload, retries = 0) {
  return {
    id: createMutationId(),
    timestamp: new Date().toISOString(),
    action,
    payload,
    status: "PENDING",
    retries,
  };
}

export function enqueueOfflineMutation(queue = [], mutation) {
  const comparableSong = normalizeText(mutation?.payload?.song);
  const comparableArtist = normalizeText(mutation?.payload?.artist);
  const comparableSetlists = JSON.stringify(mutation?.payload?.setlists || []);

  const deduped = queue.filter((entry) => {
    if (entry.action !== mutation.action) {
      return true;
    }

    if (mutation.action === "UPDATE_SETLISTS") {
      return JSON.stringify(entry.payload?.setlists || []) !== comparableSetlists;
    }

    return !(
      normalizeText(entry.payload?.song) === comparableSong &&
      normalizeText(entry.payload?.artist) === comparableArtist
    );
  });

  return [...deduped, mutation];
}

export function clearSyncedMutations(queue = []) {
  return queue.filter((entry) => entry.status !== "SYNCED");
}

export function countOfflineEnabledSongs(songs = []) {
  return normalizeOfflineSongs(songs).filter((song) => song.offlineEnabled).length;
}

export function canUseOfflineSession({
  refreshToken,
  sessionTimestamp,
  songs = [],
} = {}) {
  if (!refreshToken || !sessionTimestamp) {
    return false;
  }

  const sessionDate = new Date(sessionTimestamp);
  if (Number.isNaN(sessionDate.getTime())) {
    return false;
  }

  const diffDays = (Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > OFFLINE_MAX_SESSION_DAYS) {
    return false;
  }

  return countOfflineEnabledSongs(songs) > 0;
}

export function isRecentOfflineSession(sessionTimestamp, maxHours = OFFLINE_AUTO_LOGIN_HOURS) {
  if (!sessionTimestamp) {
    return false;
  }

  const sessionDate = new Date(sessionTimestamp);
  if (Number.isNaN(sessionDate.getTime())) {
    return false;
  }

  const diffHours = (Date.now() - sessionDate.getTime()) / (1000 * 60 * 60);
  return diffHours <= maxHours;
}
