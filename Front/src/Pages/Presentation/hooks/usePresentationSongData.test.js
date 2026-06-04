import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePresentationSongData } from "./usePresentationSongData";

const makeSongData = () => ({
  keys: {
    songCifra: "legacy cifra",
    songLyrics: "lyrics only",
    songChords: "C G",
    songTabs: "tab line",
    presentationLayouts: {
      default: {
        songCifra: "default cifra",
        fontSizeStep: 1,
        blockSpacingStep: 2,
        showProgressionMarkers: true,
        progressionMarkOverrides: {
          "block-1": { title: "Verse" },
        },
      },
      expanded: {
        songCifra: "expanded cifra",
        fontSizeStep: 3,
        blockSpacingStep: -1,
        showProgressionMarkers: false,
      },
    },
  },
});

describe("usePresentationSongData", () => {
  it("selects default layout data and normalizes the cifra", () => {
    const normalizeCifra = vi.fn((value) => `normalized:${value}`);

    const { result } = renderHook(() =>
      usePresentationSongData({
        instrumentSelected: "keys",
        isExpandedCifra: false,
        normalizeCifra,
        selectContenttoShow: "default",
        songDataFetched: makeSongData(),
      }),
    );

    expect(result.current.activeLayoutVariant).toBe("default");
    expect(result.current.activeLayoutLabel).toBe("Default layout");
    expect(result.current.songCifraData).toBe("default cifra");
    expect(result.current.editableSongCifra).toBe("normalized:default cifra");
    expect(result.current.contentSelected).toBe("normalized:default cifra");
    expect(result.current.touchFontSizeStep).toBe(1);
    expect(result.current.blockSpacingStep).toBe(2);
    expect(result.current.showProgressionMarkers).toBe(true);
    expect(result.current.progressionMarkOverrides).toEqual({
      "block-1": { title: "Verse" },
    });
  });

  it("selects expanded layout data and honors explicit content tabs", () => {
    const { result } = renderHook(() =>
      usePresentationSongData({
        instrumentSelected: "keys",
        isExpandedCifra: true,
        normalizeCifra: (value) => value,
        selectContenttoShow: "tabs",
        songDataFetched: makeSongData(),
      }),
    );

    expect(result.current.activeLayoutVariant).toBe("expanded");
    expect(result.current.activeLayoutLabel).toBe("Expanded layout");
    expect(result.current.songCifraData).toBe("expanded cifra");
    expect(result.current.contentSelected).toBe("tab line");
    expect(result.current.isTwoColumns).toBe(true);
    expect(result.current.touchFontSizeStep).toBe(3);
    expect(result.current.blockSpacingStep).toBe(-1);
    expect(result.current.showProgressionMarkers).toBe(false);
  });
});
