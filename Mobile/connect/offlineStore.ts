export type OfflineInstrumentKey =
  | "guitar01"
  | "guitar02"
  | "bass"
  | "keys"
  | "drums"
  | "voice";

export type OfflineSong = {
  id?: string | number;
  artist?: string;
  song?: string;
  setlist?: string[];
  offlineEnabled?: boolean;
  lastOfflineSyncTime?: string | null;
  requiresSync?: boolean;
  [key: string]: unknown;
};

export type OfflineQueueAction =
  | "UPSERT_SONG"
  | "TOGGLE_OFFLINE"
  | "UPDATE_SETLISTS";

export type OfflineMutation = {
  id: string;
  timestamp: string;
  action: OfflineQueueAction;
  payload: Record<string, unknown>;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retries: number;
};

export type OfflineSessionSnapshot = {
  refreshToken?: string | null;
  sessionTimestamp?: string | null;
  songs?: OfflineSong[];
};

const MAX_OFFLINE_SESSION_AGE_DAYS = 30;

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function createMutationId() {
  return `offline-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function normalizeOfflineSong(song: OfflineSong): OfflineSong {
  return {
    ...song,
    offlineEnabled: Boolean(song?.offlineEnabled),
    lastOfflineSyncTime:
      typeof song?.lastOfflineSyncTime === "string" && song.lastOfflineSyncTime.trim()
        ? song.lastOfflineSyncTime
        : null,
    requiresSync: Boolean(song?.requiresSync),
  };
}

export function normalizeOfflineSongs(songs: OfflineSong[] = []) {
  return songs.map((song) => normalizeOfflineSong(song));
}

export function findSongIndex(
  songs: OfflineSong[] = [],
  target: Pick<OfflineSong, "artist" | "song">,
) {
  const targetArtist = normalizeText(target.artist);
  const targetSong = normalizeText(target.song);

  return songs.findIndex(
    (entry) =>
      normalizeText(entry.artist) === targetArtist &&
      normalizeText(entry.song) === targetSong,
  );
}

export function toggleSongOfflineState(
  songs: OfflineSong[] = [],
  target: Pick<OfflineSong, "artist" | "song">,
  offlineEnabled: boolean,
  timestamp = new Date().toISOString(),
) {
  const nextSongs = normalizeOfflineSongs(songs);
  const targetIndex = findSongIndex(nextSongs, target);

  if (targetIndex < 0) {
    throw new Error("Song not found in offline cache.");
  }

  nextSongs[targetIndex] = {
    ...nextSongs[targetIndex],
    offlineEnabled,
    requiresSync: true,
    lastOfflineSyncTime: offlineEnabled
      ? nextSongs[targetIndex].lastOfflineSyncTime || timestamp
      : nextSongs[targetIndex].lastOfflineSyncTime || null,
  };

  return nextSongs;
}

export function applyOfflineSongUpdate(
  songs: OfflineSong[] = [],
  updatedSong: OfflineSong,
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

export function buildOfflineMutation(
  action: OfflineQueueAction,
  payload: Record<string, unknown>,
  retries = 0,
): OfflineMutation {
  return {
    id: createMutationId(),
    timestamp: new Date().toISOString(),
    action,
    payload,
    status: "PENDING",
    retries,
  };
}

export function enqueueOfflineMutation(
  queue: OfflineMutation[] = [],
  mutation: OfflineMutation,
) {
  const comparableSong = normalizeText(mutation.payload.song);
  const comparableArtist = normalizeText(mutation.payload.artist);
  const comparableSetlists = JSON.stringify(mutation.payload.setlists || []);

  const deduped = queue.filter((entry) => {
    if (entry.action !== mutation.action) {
      return true;
    }

    if (mutation.action === "UPDATE_SETLISTS") {
      return JSON.stringify(entry.payload.setlists || []) !== comparableSetlists;
    }

    return !(
      normalizeText(entry.payload.song) === comparableSong &&
      normalizeText(entry.payload.artist) === comparableArtist
    );
  });

  return [...deduped, mutation];
}

export function markMutationStatus(
  queue: OfflineMutation[] = [],
  mutationId: string,
  status: OfflineMutation["status"],
) {
  return queue.map((entry) =>
    entry.id === mutationId
      ? {
          ...entry,
          status,
          retries: status === "FAILED" ? entry.retries + 1 : entry.retries,
        }
      : entry,
  );
}

export function clearSyncedMutations(queue: OfflineMutation[] = []) {
  return queue.filter((entry) => entry.status !== "SYNCED");
}

export function countOfflineEnabledSongs(songs: OfflineSong[] = []) {
  return normalizeOfflineSongs(songs).filter((song) => song.offlineEnabled).length;
}

export function canUseOfflineSession(snapshot: OfflineSessionSnapshot) {
  if (!snapshot?.refreshToken || !snapshot?.sessionTimestamp) {
    return false;
  }

  const sessionDate = new Date(snapshot.sessionTimestamp);
  if (Number.isNaN(sessionDate.getTime())) {
    return false;
  }

  const diffMs = Date.now() - sessionDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > MAX_OFFLINE_SESSION_AGE_DAYS) {
    return false;
  }

  return countOfflineEnabledSongs(snapshot.songs || []) > 0;
}
