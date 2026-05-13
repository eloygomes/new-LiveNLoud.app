import test from "node:test";
import assert from "node:assert/strict";

import {
  applyOfflineSongUpdate,
  buildOfflineMutation,
  canUseOfflineSession,
  clearSyncedMutations,
  enqueueOfflineMutation,
  toggleSongOfflineState,
} from "../offlineStore";

const baseSongs = [
  { artist: "Artist A", song: "Song A", offlineEnabled: false, requiresSync: false },
  { artist: "Artist B", song: "Song B", offlineEnabled: true, requiresSync: false },
];

test("toggleSongOfflineState enables a song and marks it for sync", () => {
  const result = toggleSongOfflineState(baseSongs, {
    artist: "Artist A",
    song: "Song A",
  }, true, "2026-05-13T10:00:00.000Z");

  assert.equal(result[0].offlineEnabled, true);
  assert.equal(result[0].requiresSync, true);
  assert.equal(result[0].lastOfflineSyncTime, "2026-05-13T10:00:00.000Z");
});

test("applyOfflineSongUpdate merges local changes and keeps offline metadata normalized", () => {
  const result = applyOfflineSongUpdate(baseSongs, {
    artist: "Artist B",
    song: "Song B",
    progressBar: 77,
    offlineEnabled: true,
  }, "2026-05-13T11:00:00.000Z");

  assert.equal(result[1].progressBar, 77);
  assert.equal(result[1].offlineEnabled, true);
  assert.equal(result[1].requiresSync, true);
  assert.equal(result[1].updateIn, "2026-05-13");
});

test("enqueueOfflineMutation deduplicates by song and keeps the latest mutation", () => {
  const first = buildOfflineMutation("TOGGLE_OFFLINE", {
    artist: "Artist A",
    song: "Song A",
    offlineEnabled: true,
  });
  const second = buildOfflineMutation("TOGGLE_OFFLINE", {
    artist: "Artist A",
    song: "Song A",
    offlineEnabled: false,
  });

  const result = enqueueOfflineMutation([first], second);

  assert.equal(result.length, 1);
  assert.equal(result[0].payload.offlineEnabled, false);
});

test("clearSyncedMutations removes only synced items", () => {
  const pending = buildOfflineMutation("UPSERT_SONG", {
    artist: "Artist A",
    song: "Song A",
  });
  const synced = { ...buildOfflineMutation("UPSERT_SONG", { artist: "Artist B", song: "Song B" }), status: "SYNCED" as const };

  const result = clearSyncedMutations([pending, synced]);

  assert.deepEqual(result, [pending]);
});

test("canUseOfflineSession requires fresh session, refresh token and offline songs", () => {
  const valid = canUseOfflineSession({
    refreshToken: "refresh-token",
    sessionTimestamp: new Date().toISOString(),
    songs: baseSongs,
  });
  const invalid = canUseOfflineSession({
    refreshToken: "refresh-token",
    sessionTimestamp: "2025-01-01T00:00:00.000Z",
    songs: baseSongs,
  });

  assert.equal(valid, true);
  assert.equal(invalid, false);
});
