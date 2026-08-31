import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getDefaultLiveCifraZoomPercent,
  getLiveBlockSpacingPx,
  usePresentationVisualScale,
} from "./usePresentationVisualScale";

describe("usePresentationVisualScale", () => {
  beforeEach(() => window.localStorage.clear());

  it("derives spacing, font and live zoom labels", () => {
    const { result } = renderHook(() =>
      usePresentationVisualScale({
        blockSpacingStep: 2,
        touchFontSizeStep: 1,
      }),
    );

    expect(result.current.blockSpacingPx).toBeGreaterThan(0);
    expect(result.current.blockSpacingLabel).toMatch(/px$/);
    expect(result.current.touchFontSizeRem).toBeCloseTo(0.82 * 1.1);
    expect(result.current.presentationFontScale).toBeCloseTo(1.1);
    expect(result.current.touchFontSizeLabel).toBe("110%");
    expect(result.current.liveCifraZoomScale).toBe(1.4);
    expect(result.current.liveCifraZoomLabel).toBe("140%");
  });

  it("uses more of the available desktop viewport without changing the document", () => {
    expect(
      getDefaultLiveCifraZoomPercent({
        windowRef: { innerWidth: 1920, innerHeight: 1080 },
      }),
    ).toBe(180);
    expect(
      getDefaultLiveCifraZoomPercent({
        windowRef: { innerWidth: 1366, innerHeight: 768 },
      }),
    ).toBe(160);
    expect(
      getDefaultLiveCifraZoomPercent({
        windowRef: { innerWidth: 1024, innerHeight: 700 },
      }),
    ).toBe(140);
    expect(
      getDefaultLiveCifraZoomPercent({
        isTouchLayout: true,
        windowRef: { innerWidth: 1920, innerHeight: 1080 },
      }),
    ).toBe(100);
  });

  it("increases live column spacing in proportion to the effective zoom", () => {
    expect(
      getLiveBlockSpacingPx({
        baseSpacingPx: 32,
        liveZoomScale: 1,
        viewportWidth: 1680,
      }),
    ).toBe(32);
    expect(
      getLiveBlockSpacingPx({
        baseSpacingPx: 32,
        liveZoomScale: 1.8,
        viewportWidth: 1680,
      }),
    ).toBe(527);
  });

  it("uses 60 percent visual scale as the touch live 100 percent baseline", () => {
    const { result } = renderHook(() =>
      usePresentationVisualScale({
        blockSpacingStep: 0,
        isTouchLayout: true,
        touchFontSizeStep: 0,
      }),
    );

    expect(result.current.liveCifraZoomLabel).toBe("100%");
    expect(result.current.liveCifraZoomScale).toBeCloseTo(0.6);

    act(() => {
      result.current.adjustLiveCifraZoom(10);
    });

    expect(result.current.liveCifraZoomLabel).toBe("110%");
    expect(result.current.liveCifraZoomScale).toBeCloseTo(0.66);
  });

  it("clamps live zoom adjustments", () => {
    const { result } = renderHook(() =>
      usePresentationVisualScale({
        blockSpacingStep: 0,
        touchFontSizeStep: 0,
      }),
    );

    act(() => {
      result.current.adjustLiveCifraZoom(1000);
    });

    expect(result.current.liveCifraZoomLabel).toBe("200%");

    act(() => {
      result.current.adjustLiveCifraZoom(-1000);
    });

    expect(result.current.liveCifraZoomLabel).toBe("0%");
  });

  it("restores zoom, spacing and tabs independently for each song", () => {
    const { result, rerender } = renderHook(
      ({ storageKey }) =>
        usePresentationVisualScale({
          blockSpacingStep: 0,
          liveSettingsStorageKey: storageKey,
          touchFontSizeStep: 0,
        }),
      { initialProps: { storageKey: "live-settings::song-a" } },
    );

    act(() => {
      result.current.adjustLiveCifraZoom(-10);
      result.current.adjustLiveBlockSpacing(2);
      result.current.toggleLiveTabs();
    });

    const songASettings = JSON.parse(
      window.localStorage.getItem("live-settings::song-a"),
    );
    expect(songASettings).toMatchObject({
      zoomPercent: 130,
      spacingStep: 2,
      tabsVisible: false,
    });

    rerender({ storageKey: "live-settings::song-b" });
    expect(result.current.liveCifraZoomLabel).toBe("140%");
    expect(result.current.liveTabsVisible).toBe(true);

    rerender({ storageKey: "live-settings::song-a" });
    expect(result.current.liveCifraZoomLabel).toBe("130%");
    expect(result.current.liveTabsVisible).toBe(false);
  });
});
