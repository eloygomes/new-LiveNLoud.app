import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allDataFromOneSong } from "./Controllers";

describe("Controllers", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    localStorage.clear();
    localStorage.setItem("userEmail", "user@test.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("falls back to cached song data when /api/v1/allsongdata fails", async () => {
    const cachedSong = {
      artist: "Artist A",
      song: "Song A",
      offlineEnabled: false,
      guitar01: { songCifra: "Cifra cacheada" },
    };

    localStorage.setItem("offline:songs", JSON.stringify([cachedSong]));

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () =>
          JSON.stringify({
            message: "Música não encontrada para este usuário.",
          }),
      })),
    );

    const result = await allDataFromOneSong("Artist A", "Song A");
    const parsedResult = JSON.parse(result);

    expect(parsedResult.artist).toBe(cachedSong.artist);
    expect(parsedResult.song).toBe(cachedSong.song);
    expect(parsedResult.guitar01).toEqual(cachedSong.guitar01);
    expect(localStorage.getItem("offline:isOfflineMode")).toBe("true");
  });
});
