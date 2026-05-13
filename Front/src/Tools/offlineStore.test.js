import { describe, expect, it } from "vitest";
import {
  applyOfflineSongUpdate,
  buildOfflineMutation,
  canUseOfflineSession,
  clearSyncedMutations,
  enqueueOfflineMutation,
  isRecentOfflineSession,
  toggleSongOfflineState,
} from "./offlineStore";

const baseSongs = [
  { artist: "Artist A", song: "Song A", offlineEnabled: false, requiresSync: false },
  { artist: "Artist B", song: "Song B", offlineEnabled: true, requiresSync: false },
];

describe("offlineStore", () => {
  it("enables a song for offline use and marks it for sync", () => {
    const result = toggleSongOfflineState(
      baseSongs,
      { artist: "Artist A", song: "Song A" },
      true,
      "2026-05-13T10:00:00.000Z",
    );

    expect(result[0].offlineEnabled).toBe(true);
    expect(result[0].requiresSync).toBe(true);
    expect(result[0].lastOfflineSyncTime).toBe("2026-05-13T10:00:00.000Z");
  });

  it("applies offline song edits and keeps sync metadata", () => {
    const result = applyOfflineSongUpdate(
      baseSongs,
      { artist: "Artist B", song: "Song B", progressBar: 88, offlineEnabled: true },
      "2026-05-13T11:00:00.000Z",
    );

    expect(result[1].progressBar).toBe(88);
    expect(result[1].requiresSync).toBe(true);
    expect(result[1].updateIn).toBe("2026-05-13");
  });

  it("deduplicates queue mutations by song and action", () => {
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

    expect(result).toHaveLength(1);
    expect(result[0].payload.offlineEnabled).toBe(false);
  });

  it("removes synced queue items only", () => {
    const pending = buildOfflineMutation("UPSERT_SONG", {
      artist: "Artist A",
      song: "Song A",
    });
    const synced = {
      ...buildOfflineMutation("UPSERT_SONG", {
        artist: "Artist B",
        song: "Song B",
      }),
      status: "SYNCED",
    };

    expect(clearSyncedMutations([pending, synced])).toEqual([pending]);
  });

  it("allows offline session only with refresh token, fresh session and offline songs", () => {
    expect(
      canUseOfflineSession({
        refreshToken: "refresh-token",
        sessionTimestamp: new Date().toISOString(),
        songs: baseSongs,
      }),
    ).toBe(true);

    expect(
      canUseOfflineSession({
        refreshToken: "refresh-token",
        sessionTimestamp: "2025-01-01T00:00:00.000Z",
        songs: baseSongs,
      }),
    ).toBe(false);
  });

  it("treats only the last 24 hours as a recent offline session", () => {
    expect(isRecentOfflineSession(new Date().toISOString())).toBe(true);
    expect(isRecentOfflineSession("2026-05-10T00:00:00.000Z")).toBe(false);
  });
});
