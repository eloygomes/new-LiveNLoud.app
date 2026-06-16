import { describe, expect, it } from "vitest";
import {
  buildSavedPresentationLayouts,
  buildInstrumentPresentationLayouts,
  clampLiveCifraZoomPercent,
  clampPresentationBlockSpacingStep,
  getActivePresentationSongCifra,
  getLiveColumnDisplayState,
  getPresentationBlockSpacingPx,
  getLiveColumnTargetIndex,
  getPresentationContentDebugSummary,
  getPresentationLayoutSettingsSnapshot,
  getPresentationLayoutsDebugSummary,
  getProgressionColumnsDebugSummary,
  hasPersistablePresentationLayouts,
  normalizePresentationLayoutVariant,
  shouldDropBlankLinesForPresentationFlow,
  toPresentationLayoutPayload,
} from "./presentationLayoutHelpers";

describe("presentationLayoutHelpers", () => {
  it("uses presentationLayouts.default.songCifra as the default presentation content", () => {
    const instrumentData = {
      songCifra: "legacy full cifra",
      presentationLayouts: {
        default: {
          songCifra: "default layout cifra",
          twoColumns: true,
        },
        expanded: {
          songCifra: "expanded layout cifra",
        },
      },
    };

    const layouts = buildInstrumentPresentationLayouts(instrumentData);

    expect(getActivePresentationSongCifra(instrumentData, "default")).toBe(
      "default layout cifra",
    );
    expect(layouts.default.twoColumns).toBe(false);
  });

  it("uses presentationLayouts.expanded.songCifra when expanded mode is active", () => {
    const instrumentData = {
      songCifra: "legacy full cifra",
      presentationLayouts: {
        default: {
          songCifra: "default layout cifra",
        },
        expanded: {
          songCifra: "expanded layout cifra",
          twoColumns: false,
        },
      },
    };

    const layouts = buildInstrumentPresentationLayouts(instrumentData);

    expect(getActivePresentationSongCifra(instrumentData, "expanded")).toBe(
      "expanded layout cifra",
    );
    expect(layouts.expanded.twoColumns).toBe(true);
  });

  it("falls back to the original songCifra for legacy songs without presentationLayouts", () => {
    const instrumentData = {
      songCifra: "original legacy cifra",
    };

    expect(getActivePresentationSongCifra(instrumentData, "default")).toBe(
      "original legacy cifra",
    );
    expect(getActivePresentationSongCifra(instrumentData, "expanded")).toBe(
      "original legacy cifra",
    );
  });

  it("does not treat empty layout songCifra as valid content", () => {
    const instrumentData = {
      songCifra: "original full cifra",
      presentationLayouts: {
        default: {
          songCifra: "",
        },
        expanded: {
          songCifra: "Loading...",
        },
      },
    };

    expect(getActivePresentationSongCifra(instrumentData, "default")).toBe(
      "original full cifra",
    );
    expect(getActivePresentationSongCifra(instrumentData, "expanded")).toBe(
      "original full cifra",
    );
  });

  it("normalizes invalid layout settings without breaking fallback content", () => {
    const normalized = normalizePresentationLayoutVariant(
      {
        songCifra: "Loading...",
        fontSizeStep: 99,
        twoColumns: "yes",
        showProgressionMarkers: "true",
        progressionMarkOverrides: {
          "block-1": {
            position: 4,
            order: 12,
            width: 560,
            height: 320,
            title: "Verse",
            extra: "ignored",
          },
          "block-2": "invalid",
        },
      },
      {
        fallbackSongCifra: "legacy cifra",
        defaultTwoColumns: true,
      },
    );

    expect(normalized).toEqual({
      songCifra: "legacy cifra",
      fontSizeStep: 10,
      blockSpacingStep: 0,
      twoColumns: true,
      showProgressionMarkers: false,
      progressionBadgeSide: "right",
      progressionMarkOverrides: {
        "block-1": {
          position: 4,
          order: 12,
          width: 560,
          height: 320,
          title: "Verse",
        },
      },
    });
  });

  it("builds a settings snapshot with independent layout values", () => {
    const snapshot = JSON.parse(
      getPresentationLayoutSettingsSnapshot({
        default: {
          fontSizeStep: -1,
          blockSpacingStep: 2,
          twoColumns: false,
          showProgressionMarkers: true,
          progressionBadgeSide: "left",
          progressionMarkOverrides: {
            "block-1": { title: "Intro" },
          },
        },
        expanded: {
          fontSizeStep: 3,
          blockSpacingStep: -1,
          twoColumns: true,
          showProgressionMarkers: false,
          progressionBadgeSide: "right",
          progressionMarkOverrides: {
            "block-2": { position: 7 },
          },
        },
      }),
    );

    expect(snapshot).toEqual({
      default: {
        fontSizeStep: -1,
        blockSpacingStep: 2,
        twoColumns: false,
        showProgressionMarkers: true,
        progressionBadgeSide: "left",
        progressionMarkOverrides: {
          "block-1": { title: "Intro" },
        },
      },
      expanded: {
        fontSizeStep: 3,
        blockSpacingStep: -1,
        twoColumns: true,
        showProgressionMarkers: false,
        progressionBadgeSide: "right",
        progressionMarkOverrides: {
          "block-2": { position: 7 },
        },
      },
    });
  });

  it("preserves progression marks settings in persisted layout payloads", () => {
    const payload = toPresentationLayoutPayload({
      default: {
        songCifra: "default cifra",
        showProgressionMarkers: true,
        progressionBadgeSide: "left",
        progressionMarkOverrides: {
          "block-1": { title: "Intro", position: 1, order: 3 },
        },
      },
      expanded: {
        songCifra: "expanded cifra",
        showProgressionMarkers: true,
        progressionBadgeSide: "right",
        progressionMarkOverrides: {
          "block-2": { title: "Verse", position: 2, order: 7 },
        },
      },
    });

    expect(payload.default.showProgressionMarkers).toBe(true);
    expect(payload.expanded.showProgressionMarkers).toBe(true);
    expect(payload.default.progressionBadgeSide).toBe("left");
    expect(payload.expanded.progressionBadgeSide).toBe("right");
    expect(payload.default.progressionMarkOverrides).toEqual({
      "block-1": { title: "Intro", position: 1, order: 3 },
    });
    expect(payload.expanded.progressionMarkOverrides).toEqual({
      "block-2": { title: "Verse", position: 2, order: 7 },
    });
  });

  it("updates only the active layout content when saving", () => {
    const payload = buildSavedPresentationLayouts(
      {
        default: {
          songCifra: "default cifra",
          showProgressionMarkers: true,
          progressionBadgeSide: "left",
          progressionMarkOverrides: {
            "block-1": {
              title: "Intro",
              position: 1,
              order: 3,
              width: 640,
              height: 360,
            },
          },
        },
        expanded: {
          songCifra: "expanded cifra",
          showProgressionMarkers: true,
          progressionBadgeSide: "right",
          progressionMarkOverrides: {
            "block-2": {
              title: "Verse",
              position: 2,
              order: 7,
              width: 720,
              height: 480,
            },
          },
        },
      },
      "expanded",
      "edited expanded cifra",
    );

    expect(payload.default.songCifra).toBe("default cifra");
    expect(payload.expanded.songCifra).toBe("edited expanded cifra");
    expect(payload.default.showProgressionMarkers).toBe(true);
    expect(payload.expanded.showProgressionMarkers).toBe(true);
    expect(payload.default.progressionMarkOverrides["block-1"]).toEqual({
      title: "Intro",
      position: 1,
      order: 3,
      width: 640,
      height: 360,
    });
    expect(payload.expanded.progressionMarkOverrides["block-2"]).toEqual({
      title: "Verse",
      position: 2,
      order: 7,
      width: 720,
      height: 480,
    });
  });

  it("builds compact debug summaries without exposing full cifra content", () => {
    const contentSummary = getPresentationContentDebugSummary(
      "Intro line\n\nVerse line",
    );
    const layoutSummary = getPresentationLayoutsDebugSummary({
      expanded: {
        songCifra: "Expanded first line\nExpanded second line",
        showProgressionMarkers: true,
        progressionMarkOverrides: {
          "block-2": {
            title: "Verse",
            position: 2,
            order: 7,
            width: 720,
            height: 480,
          },
        },
      },
    });
    const columnsSummary = getProgressionColumnsDebugSummary([
      {
        groupKey: "progression-2",
        visualColumnIndex: 2,
        visualColumnLabel: "B",
        displayPosition: 2,
        displayTitle: "Verse",
        blockKeys: ["block-2"],
        blocks: [{ blockKey: "block-2" }],
        isProgressionEligible: true,
        width: 720,
        height: 480,
      },
    ]);

    expect(contentSummary).toMatchObject({
      length: 22,
      lines: 3,
      nonEmptyLines: 2,
      firstLine: "Intro line",
    });
    expect(layoutSummary.expanded).toMatchObject({
      showProgressionMarkers: true,
      overrideCount: 1,
    });
    expect(layoutSummary.expanded.content.firstLine).toBe(
      "Expanded first line",
    );
    expect(layoutSummary.expanded.overrides).toEqual([
      {
        blockKey: "block-2",
        title: "Verse",
        position: 2,
        order: 7,
        width: 720,
        height: 480,
      },
    ]);
    expect(columnsSummary).toEqual([
      {
        index: 0,
        groupKey: "progression-2",
        baseGroupKey: undefined,
        visualColumnOverrideKey: undefined,
        visualColumnIndex: 2,
        visualColumnLabel: "B",
        displayPosition: 2,
        displayTitle: "Verse",
        blockKeys: ["block-2"],
        blockCount: 1,
        isProgressionEligible: true,
        isOverflowContinuation: false,
        width: 720,
        height: 480,
      },
    ]);
    expect(contentSummary.hash).toEqual(expect.any(String));
  });

  it("detects when layouts are safe to persist in localStorage", () => {
    expect(hasPersistablePresentationLayouts()).toBe(false);
    expect(
      hasPersistablePresentationLayouts({
        default: { songCifra: "Loading..." },
        expanded: { songCifra: "" },
      }),
    ).toBe(false);
    expect(
      hasPersistablePresentationLayouts({
        expanded: {
          songCifra: "real cifra",
        },
      }),
    ).toBe(true);
    expect(
      hasPersistablePresentationLayouts({
        expanded: {
          progressionMarkOverrides: {
            "block-1": { position: 1 },
          },
        },
      }),
    ).toBe(true);
  });

  it("normalizes block spacing settings", () => {
    expect(clampPresentationBlockSpacingStep(-9)).toBe(-4);
    expect(clampPresentationBlockSpacingStep(99)).toBe(99);
    expect(getPresentationBlockSpacingPx(-9)).toBe(0);
    expect(getPresentationBlockSpacingPx(0)).toBe(32);
    expect(getPresentationBlockSpacingPx(3)).toBe(56);
  });

  it("preserves blank blocks for horizontal presentation flow", () => {
    expect(
      shouldDropBlankLinesForPresentationFlow({
        shouldUseHorizontalColumnFlow: true,
      }),
    ).toBe(false);
    expect(
      shouldDropBlankLinesForPresentationFlow({
        shouldUseHorizontalColumnFlow: false,
      }),
    ).toBe(false);
  });

  it("clamps live cifra zoom to supported percentages", () => {
    expect(clampLiveCifraZoomPercent(-20)).toBe(0);
    expect(clampLiveCifraZoomPercent(40)).toBe(40);
    expect(clampLiveCifraZoomPercent(124)).toBe(120);
    expect(clampLiveCifraZoomPercent(126)).toBe(130);
    expect(clampLiveCifraZoomPercent(250)).toBe(200);
    expect(clampLiveCifraZoomPercent("invalid")).toBe(120);
  });

  it("marks only the active live column as fully visible", () => {
    expect(
      getLiveColumnDisplayState({
        columnKey: "column-b",
        activeColumnKey: "column-b",
        columnIndex: 1,
      }),
    ).toEqual({
      isActive: true,
      className: "presentation-live-column-active",
    });
    expect(
      getLiveColumnDisplayState({
        columnKey: "column-a",
        activeColumnKey: "column-b",
        columnIndex: 0,
      }),
    ).toEqual({
      isActive: false,
      className: "presentation-live-column-muted",
    });
    expect(
      getLiveColumnDisplayState({
        columnKey: "column-a",
        activeColumnKey: "",
        columnIndex: 0,
      }).isActive,
    ).toBe(true);
  });

  it("calculates bounded live navigation targets", () => {
    expect(
      getLiveColumnTargetIndex({
        currentIndex: 0,
        direction: -1,
        columnCount: 3,
      }),
    ).toBe(0);
    expect(
      getLiveColumnTargetIndex({
        currentIndex: 0,
        direction: 1,
        columnCount: 3,
      }),
    ).toBe(1);
    expect(
      getLiveColumnTargetIndex({
        currentIndex: 2,
        direction: 1,
        columnCount: 3,
      }),
    ).toBe(2);
    expect(
      getLiveColumnTargetIndex({
        currentIndex: 1,
        direction: 0,
        columnCount: 3,
      }),
    ).toBe(1);
    expect(getLiveColumnTargetIndex({ columnCount: 0 })).toBe(-1);
  });
});
