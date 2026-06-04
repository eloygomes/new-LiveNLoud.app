import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildInstrumentPresentationLayouts } from "../presentationLayoutHelpers";
import { usePresentationLayoutStorageSync } from "./usePresentationLayoutStorageSync";

const baseInstrumentData = {
  songCifra: "server cifra",
  presentationLayouts: {
    default: {
      songCifra: "server cifra",
      fontSizeStep: 0,
    },
    expanded: {
      songCifra: "server expanded",
      fontSizeStep: 0,
    },
  },
};

describe("usePresentationLayoutStorageSync", () => {
  it("hydrates expanded/default mode from localStorage", () => {
    window.localStorage.setItem("mode-key", "expanded");
    const setIsExpandedCifra = vi.fn();

    renderHook(() =>
      usePresentationLayoutStorageSync({
        currentInstrumentData: baseInstrumentData,
        instrumentPresentationLayouts:
          buildInstrumentPresentationLayouts(baseInstrumentData),
        instrumentSelected: "keys",
        isExpandedCifra: false,
        isRouteSongLoading: false,
        presentationLayoutIdentity: "artist::song::keys",
        presentationLayoutModeStorageKey: "mode-key",
        presentationLayoutSettingsSnapshot: "{}",
        presentationLayoutStorageKey: "layout-key",
        setIsExpandedCifra,
        setSongDataFetched: vi.fn(),
        songDataFetched: { keys: baseInstrumentData },
      }),
    );

    expect(setIsExpandedCifra).toHaveBeenCalledWith(true);
  });

  it("hydrates stored layouts into song data", () => {
    window.localStorage.setItem(
      "layout-key",
      JSON.stringify({
        default: {
          songCifra: "stored default",
          fontSizeStep: 2,
        },
        expanded: {
          songCifra: "stored expanded",
          fontSizeStep: 3,
        },
      }),
    );
    const setSongDataFetched = vi.fn();

    renderHook(() =>
      usePresentationLayoutStorageSync({
        currentInstrumentData: baseInstrumentData,
        instrumentPresentationLayouts:
          buildInstrumentPresentationLayouts(baseInstrumentData),
        instrumentSelected: "keys",
        isExpandedCifra: false,
        isRouteSongLoading: false,
        presentationLayoutIdentity: "artist::song::keys",
        presentationLayoutModeStorageKey: "mode-key",
        presentationLayoutSettingsSnapshot: "{}",
        presentationLayoutStorageKey: "layout-key",
        setIsExpandedCifra: vi.fn(),
        setSongDataFetched,
        songDataFetched: { keys: baseInstrumentData },
      }),
    );

    const updater = setSongDataFetched.mock.calls[0][0];
    const hydrated = updater({ keys: baseInstrumentData });

    expect(hydrated.keys.songCifra).toBe("stored default");
    expect(hydrated.keys.presentationLayouts.default.fontSizeStep).toBe(2);
    expect(hydrated.keys.presentationLayouts.expanded.fontSizeStep).toBe(3);
  });
});
