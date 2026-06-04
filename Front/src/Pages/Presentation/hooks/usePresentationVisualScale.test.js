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
    expect(result.current.touchFontSizeRem).toBeCloseTo(0.9);
    expect(result.current.presentationFontScale).toBeCloseTo(0.9 / 0.82);
    expect(result.current.touchFontSizeLabel).toBe("110%");
    expect(result.current.liveCifraZoomScale).toBe(1.2);
    expect(result.current.liveCifraZoomLabel).toBe("120%");
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

    expect(result.current.liveCifraZoomLabel).toBe("170%");

    act(() => {
      result.current.adjustLiveCifraZoom(-1000);
    });

    expect(result.current.liveCifraZoomLabel).toBe("90%");
  });
});
