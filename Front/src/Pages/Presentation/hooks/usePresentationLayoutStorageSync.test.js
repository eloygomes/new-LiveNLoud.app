import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildInstrumentPresentationLayouts } from "../presentationLayoutHelpers";
import {
  getAutomaticPresentationLayoutMode,
  usePresentationLayoutStorageSync,
} from "./usePresentationLayoutStorageSync";

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
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("selects the automatic layout from the screen orientation", () => {
    expect(
      getAutomaticPresentationLayoutMode({ innerWidth: 900, innerHeight: 1200 }),
    ).toBe("default");
    expect(
      getAutomaticPresentationLayoutMode({ innerWidth: 1600, innerHeight: 900 }),
    ).toBe("expanded");
  });

  it("hydrates expanded/default mode from localStorage", () => {
    window.localStorage.setItem("mode-key", "expanded");
    const setIsExpandedCifra = vi.fn();
    const setIsLayoutModeManual = vi.fn();

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
        setIsLayoutModeManual,
        setSongDataFetched: vi.fn(),
        songDataFetched: { keys: baseInstrumentData },
      }),
    );

    expect(setIsExpandedCifra).toHaveBeenCalledWith(true);
    expect(setIsLayoutModeManual).toHaveBeenCalledWith(true);
  });

  it("reacts to orientation changes while the layout is automatic", () => {
    Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });
    const setIsExpandedCifra = vi.fn();

    renderHook(() =>
      usePresentationLayoutStorageSync({
        currentInstrumentData: baseInstrumentData,
        instrumentPresentationLayouts:
          buildInstrumentPresentationLayouts(baseInstrumentData),
        instrumentSelected: "keys",
        isExpandedCifra: true,
        isLayoutModeManual: false,
        isRouteSongLoading: false,
        presentationLayoutIdentity: "artist::song::keys",
        presentationLayoutModeStorageKey: "mode-key",
        presentationLayoutSettingsSnapshot: "{}",
        presentationLayoutStorageKey: "layout-key",
        setIsExpandedCifra,
        setIsLayoutModeManual: vi.fn(),
        setSongDataFetched: vi.fn(),
        songDataFetched: { keys: baseInstrumentData },
      }),
    );

    Object.defineProperty(window, "innerWidth", { value: 900, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1600, configurable: true });
    act(() => window.dispatchEvent(new Event("resize")));

    expect(setIsExpandedCifra).toHaveBeenLastCalledWith(false);
    expect(window.localStorage.getItem("mode-key")).toBeNull();
  });

  it("persists the layout after the user chooses it manually", () => {
    const baseProps = {
      currentInstrumentData: baseInstrumentData,
      instrumentPresentationLayouts:
        buildInstrumentPresentationLayouts(baseInstrumentData),
      instrumentSelected: "keys",
      isRouteSongLoading: false,
      presentationLayoutIdentity: "artist::song::keys",
      presentationLayoutModeStorageKey: "mode-key",
      presentationLayoutSettingsSnapshot: "{}",
      presentationLayoutStorageKey: "layout-key",
      setIsExpandedCifra: vi.fn(),
      setIsLayoutModeManual: vi.fn(),
      setSongDataFetched: vi.fn(),
      songDataFetched: { keys: baseInstrumentData },
    };
    const { rerender } = renderHook(
      ({ isExpandedCifra, isLayoutModeManual }) =>
        usePresentationLayoutStorageSync({
          ...baseProps,
          isExpandedCifra,
          isLayoutModeManual,
        }),
      {
        initialProps: {
          isExpandedCifra: false,
          isLayoutModeManual: false,
        },
      },
    );

    rerender({ isExpandedCifra: true, isLayoutModeManual: true });

    expect(window.localStorage.getItem("mode-key")).toBe("expanded");
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
