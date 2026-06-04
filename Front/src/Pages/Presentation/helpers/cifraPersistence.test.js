import { describe, expect, it } from "vitest";
import {
  buildCifraSavePayload,
  mergeSavedCifraState,
  persistPresentationLayoutsToStorage,
  restoreOriginalLayoutsInSongData,
} from "./cifraPersistence";

describe("cifraPersistence", () => {
  it("builds a save payload with persisted layouts for the active variant", () => {
    const payload = buildCifraSavePayload({
      activeLayoutVariant: "expanded",
      currentInstrumentData: {
        songCifra: "default cifra",
        presentationLayouts: {
          default: { songCifra: "default cifra" },
          expanded: { songCifra: "old expanded" },
        },
      },
      instrumentSelected: "keys",
      nextDraftCifra: "new expanded cifra",
      songDataFetched: {
        artist: "Artist",
        keys: {},
      },
    });

    expect(payload.persistedLayouts.default.songCifra).toBe("default cifra");
    expect(payload.persistedLayouts.expanded.songCifra).toBe(
      "new expanded cifra",
    );
    expect(payload.nextSongData.keys.songCifra).toBe("default cifra");
    expect(payload.nextSongData.updateIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("merges server save results while preserving the local persisted layout", () => {
    const persistedLayouts = {
      default: { songCifra: "local default" },
      expanded: { songCifra: "local expanded" },
    };

    const merged = mergeSavedCifraState({
      previousSongData: {
        id: "song-1",
        keys: { songCifra: "previous" },
      },
      saveResult: {
        song: {
          serverOnly: true,
          keys: { serverField: "from-server", songCifra: "server cifra" },
        },
      },
      nextSongData: {
        updateIn: "2026-06-02",
      },
      instrumentSelected: "keys",
      updatedBlock: {
        localField: "from-local",
      },
      persistedLayouts,
    });

    expect(merged.serverOnly).toBe(true);
    expect(merged.keys.serverField).toBe("from-server");
    expect(merged.keys.localField).toBe("from-local");
    expect(merged.keys.songCifra).toBe("local default");
    expect(merged.keys.presentationLayouts).toBe(persistedLayouts);
  });

  it("restores original layouts and persists them to localStorage", () => {
    const originalLayouts = {
      default: { songCifra: "original default" },
      expanded: { songCifra: "original expanded" },
    };
    const restored = restoreOriginalLayoutsInSongData({
      previousSongData: {
        keys: {
          songCifra: "edited",
          presentationLayouts: {
            default: { songCifra: "edited" },
          },
        },
      },
      instrumentSelected: "keys",
      originalLayouts,
    });

    expect(restored.keys.songCifra).toBe("original default");
    expect(restored.keys.presentationLayouts).toBe(originalLayouts);

    persistPresentationLayoutsToStorage({
      storageKey: "presentation-layouts::test",
      layouts: originalLayouts,
    });

    expect(
      JSON.parse(window.localStorage.getItem("presentation-layouts::test")),
    ).toEqual(originalLayouts);
  });
});
