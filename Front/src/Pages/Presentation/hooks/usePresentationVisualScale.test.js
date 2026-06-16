import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePresentationVisualScale } from "./usePresentationVisualScale";

describe("usePresentationVisualScale", () => {
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
    expect(result.current.liveCifraZoomScale).toBe(1.2);
    expect(result.current.liveCifraZoomLabel).toBe("120%");
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
});
