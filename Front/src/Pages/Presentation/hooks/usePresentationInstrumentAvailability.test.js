import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePresentationInstrumentAvailability } from "./usePresentationInstrumentAvailability";

describe("usePresentationInstrumentAvailability", () => {
  it("returns only registered instruments with presentation content", () => {
    const songDataFetched = {
      instruments: {
        keys: true,
        guitar01: true,
        bass: true,
      },
      keys: {
        songCifra: "C G\nKeys part",
      },
      guitar01: {
        songLyrics: "Legacy lyric cue",
      },
      bass: {
        songCifra: "",
      },
    };

    const { result } = renderHook(() =>
      usePresentationInstrumentAvailability({
        instrumentSelected: "keys",
        songDataFetched,
      }),
    );

    expect(result.current.availableInstrumentOptions.map(({ key }) => key)).toEqual([
      "keys",
    ]);
    expect(result.current.isCurrentInstrumentUnavailable).toBe(false);
  });

  it("marks the current instrument unavailable when it has no content", () => {
    const { result } = renderHook(() =>
      usePresentationInstrumentAvailability({
        instrumentSelected: "drums",
        songDataFetched: {
          instruments: {
            drums: true,
          },
          drums: {
            songCifra: "",
            songChords: "Legacy chords",
            songTabs: "Legacy tabs",
            songLyrics: "Legacy lyrics",
          },
        },
      }),
    );

    expect(result.current.availableInstrumentOptions).toEqual([]);
    expect(result.current.isCurrentInstrumentUnavailable).toBe(true);
  });
});
