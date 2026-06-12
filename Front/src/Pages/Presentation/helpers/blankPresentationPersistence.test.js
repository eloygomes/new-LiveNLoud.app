import { describe, expect, it, vi } from "vitest";
import {
  buildBlankPresentationLayouts,
  buildBlankPresentationSaveRequest,
  normalizeBlankPresentationInstrument,
  saveBlankPresentationCifra,
} from "./blankPresentationPersistence";

describe("blankPresentationPersistence", () => {
  it("creates default and expanded layouts with the same new cifra", () => {
    const layouts = buildBlankPresentationLayouts({
      cifra: "tom:\nC\nNew song",
      showProgressionMarkers: true,
    });

    expect(layouts.default.songCifra).toBe("tom:\nC\nNew song");
    expect(layouts.expanded.songCifra).toBe("tom:\nC\nNew song");
    expect(layouts.default.twoColumns).toBe(false);
    expect(layouts.expanded.twoColumns).toBe(true);
    expect(layouts.default.showProgressionMarkers).toBe(true);
    expect(layouts.expanded.showProgressionMarkers).toBe(true);
  });

  it("builds the same kind of instrument payload used by New Song", () => {
    const request = buildBlankPresentationSaveRequest({
      artist: " Pink Floyd ",
      song: " Time ",
      instrument: "keyboard",
      cifra: "F#m\nParte 1",
    });

    expect(request.artistName).toBe("Pink Floyd");
    expect(request.songName).toBe("Time");
    expect(request.instrumentName).toBe("keys");
    expect(request.instrumentFields.active).toBe(true);
    expect(request.instrumentFields.link).toBe("");
    expect(request.instrumentFields.songCifra).toBe("F#m\nParte 1");
    expect(request.instrumentFields.presentationLayouts.default.songCifra).toBe(
      "F#m\nParte 1",
    );
    expect(request.instrumentFields.presentationLayouts.expanded.songCifra).toBe(
      "F#m\nParte 1",
    );
  });

  it("saves through the injected create song function", async () => {
    const createSong = vi.fn().mockResolvedValue({ message: "saved" });

    const result = await saveBlankPresentationCifra({
      artist: "Artist",
      song: "Song",
      instrument: "voice",
      cifra: "A\nSong",
      createSong,
    });

    expect(createSong).toHaveBeenCalledTimes(1);
    expect(createSong).toHaveBeenCalledWith(
      expect.objectContaining({
        artistName: "Artist",
        songName: "Song",
        instrumentName: "voice",
      }),
    );
    expect(result.layouts.default.songCifra).toBe("A\nSong");
  });

  it("does not allow saving an empty cifra", async () => {
    await expect(
      saveBlankPresentationCifra({
        artist: "Artist",
        song: "Song",
        instrument: "guitar01",
        cifra: "   ",
        createSong: vi.fn(),
      }),
    ).rejects.toThrow("Adicione a cifra antes de salvar.");
  });

  it("falls back to guitar01 for unknown instruments", () => {
    expect(normalizeBlankPresentationInstrument("triangle")).toBe("guitar01");
  });
});
