import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePresentationRenderModel } from "./usePresentationRenderModel";

describe("usePresentationRenderModel", () => {
  it("transposes content and builds visible render columns", () => {
    const { result } = renderHook(() =>
      usePresentationRenderModel({
        contentSelected: "[Verse]\n[C]Hello [G]world",
        hideTabs: false,
        isExpandedCifra: true,
        isTwoColumns: true,
        progressionMarkOverrides: {},
        transposeSteps: 2,
      }),
    );

    expect(result.current.shouldUseTwoColumns).toBe(true);
    expect(result.current.shouldUseHorizontalColumnFlow).toBe(true);
    expect(result.current.shouldUseExpandedVerticalFlow).toBe(false);
    expect(result.current.displayKey).toBe("D");
    expect(result.current.visibleContentBlocks.length).toBeGreaterThan(0);
    expect(result.current.activeProgressionRenderColumns.length).toBeGreaterThan(0);
  });

  it("returns empty blocks for non-parsable content", () => {
    const { result } = renderHook(() =>
      usePresentationRenderModel({
        contentSelected: "Loading...",
        hideTabs: false,
        isExpandedCifra: false,
        isTwoColumns: false,
        progressionMarkOverrides: {},
        transposeSteps: 0,
      }),
    );

    expect(result.current.shouldUseHorizontalColumnFlow).toBe(false);
    expect(result.current.shouldUseExpandedVerticalFlow).toBe(false);
    expect(result.current.visibleContentBlocks).toEqual([]);
    expect(result.current.activeProgressionRenderColumns).toEqual([]);
  });
});
