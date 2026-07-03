import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePresentationLayoutUpdater } from "./usePresentationLayoutUpdater";

function runStateUpdate(setSongDataFetched, initialSongData) {
  const updater = setSongDataFetched.mock.calls.at(-1)?.[0];
  return typeof updater === "function" ? updater(initialSongData) : updater;
}

describe("usePresentationLayoutUpdater", () => {
  it("updates the active layout and marks layout content as edited", () => {
    const setHasEditedLayoutContent = vi.fn();
    const setSongDataFetched = vi.fn();
    const initialSongData = {
      keys: {
        songCifra: "original",
        presentationLayouts: {
          default: {
            songCifra: "original",
            fontSizeStep: 0,
            showProgressionMarkers: false,
          },
          expanded: {
            songCifra: "expanded",
          },
        },
      },
    };

    const { result } = renderHook(() =>
      usePresentationLayoutUpdater({
        activeLayoutVariant: "default",
        instrumentSelected: "keys",
        presentationLayoutIdentity: "artist::song::keys",
        setHasEditedLayoutContent,
        setSongDataFetched,
      }),
    );

    act(() => {
      result.current.setActiveShowProgressionMarkers(true);
    });

    const nextSongData = runStateUpdate(setSongDataFetched, initialSongData);

    expect(setHasEditedLayoutContent).toHaveBeenCalledWith(true);
    expect(nextSongData.keys.presentationLayouts.default.showProgressionMarkers).toBe(
      true,
    );
    expect(nextSongData.keys.songCifra).toBe("original");
    expect(nextSongData.updateIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("clamps font size and block spacing adjustments", () => {
    const setSongDataFetched = vi.fn();
    const initialSongData = {
      keys: {
        songCifra: "original",
        presentationLayouts: {
          default: {
            songCifra: "original",
            fontSizeStep: 4,
            blockSpacingStep: -4,
          },
        },
      },
    };

    const { result } = renderHook(() =>
      usePresentationLayoutUpdater({
        activeLayoutVariant: "default",
        instrumentSelected: "keys",
        presentationLayoutIdentity: "artist::song::keys",
        setHasEditedLayoutContent: vi.fn(),
        setSongDataFetched,
      }),
    );

    act(() => {
      result.current.adjustActiveFontSizeStep(10);
    });

    expect(
      runStateUpdate(setSongDataFetched, initialSongData).keys.presentationLayouts
        .default.fontSizeStep,
    ).toBe(10);

    act(() => {
      result.current.adjustActiveBlockSpacingStep(-10);
    });

    expect(
      runStateUpdate(setSongDataFetched, initialSongData).keys.presentationLayouts
        .default.blockSpacingStep,
    ).toBe(-4);
  });

  it("preserves pending edited cifra content before applying a layout update", () => {
    const setSongDataFetched = vi.fn();
    const getPendingCifraContent = vi.fn(() => "edited visible cifra");
    const initialSongData = {
      keys: {
        songCifra: "original",
        presentationLayouts: {
          default: {
            songCifra: "original",
            fontSizeStep: 0,
            showProgressionMarkers: false,
          },
        },
      },
    };

    const { result } = renderHook(() =>
      usePresentationLayoutUpdater({
        activeLayoutVariant: "default",
        getPendingCifraContent,
        instrumentSelected: "keys",
        presentationLayoutIdentity: "artist::song::keys",
        setHasEditedLayoutContent: vi.fn(),
        setSongDataFetched,
      }),
    );

    act(() => {
      result.current.setActiveShowProgressionMarkers(true);
    });

    const nextSongData = runStateUpdate(setSongDataFetched, initialSongData);

    expect(getPendingCifraContent).toHaveBeenCalledTimes(1);
    expect(nextSongData.keys.presentationLayouts.default.songCifra).toBe(
      "edited visible cifra",
    );
    expect(nextSongData.keys.songCifra).toBe("edited visible cifra");
    expect(nextSongData.keys.presentationLayouts.default.showProgressionMarkers).toBe(
      true,
    );
  });
});
