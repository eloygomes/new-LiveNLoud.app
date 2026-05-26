import { describe, expect, it } from "vitest";
import {
  buildInstrumentPresentationLayouts,
  getActivePresentationSongCifra,
  getPresentationLayoutSettingsSnapshot,
  normalizePresentationLayoutVariant,
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
      fontSizeStep: 4,
      twoColumns: true,
      showProgressionMarkers: false,
      progressionBadgeSide: "right",
      progressionMarkOverrides: {
        "block-1": {
          position: 4,
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
          twoColumns: false,
          showProgressionMarkers: true,
          progressionBadgeSide: "left",
          progressionMarkOverrides: {
            "block-1": { title: "Intro" },
          },
        },
        expanded: {
          fontSizeStep: 3,
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
        twoColumns: false,
        showProgressionMarkers: true,
        progressionBadgeSide: "left",
        progressionMarkOverrides: {
          "block-1": { title: "Intro" },
        },
      },
      expanded: {
        fontSizeStep: 3,
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
          "block-1": { title: "Intro", position: 1 },
        },
      },
      expanded: {
        songCifra: "expanded cifra",
        showProgressionMarkers: true,
        progressionBadgeSide: "right",
        progressionMarkOverrides: {
          "block-2": { title: "Verse", position: 2 },
        },
      },
    });

    expect(payload.default.showProgressionMarkers).toBe(true);
    expect(payload.expanded.showProgressionMarkers).toBe(true);
    expect(payload.default.progressionBadgeSide).toBe("left");
    expect(payload.expanded.progressionBadgeSide).toBe("right");
    expect(payload.default.progressionMarkOverrides).toEqual({
      "block-1": { title: "Intro", position: 1 },
    });
    expect(payload.expanded.progressionMarkOverrides).toEqual({
      "block-2": { title: "Verse", position: 2 },
    });
  });
});
