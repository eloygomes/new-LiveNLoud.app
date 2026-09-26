import { describe, expect, it } from "vitest";
import {
  getActiveSyncPoint,
  getLoopBounds,
  getNextSyncPoint,
  getPreviousSyncPoint,
  getSortedSyncPoints,
  getSyncProgress,
} from "./syncEngine";

describe("syncEngine", () => {
  const points = [
    { syncBlockId: "syncblk_chorus", time: 42 },
    { syncBlockId: "syncblk_intro", time: 0 },
    { syncBlockId: "syncblk_verse", time: 18 },
  ];

  it("sorts sync points by timestamp", () => {
    expect(getSortedSyncPoints(points).map((point) => point.syncBlockId)).toEqual([
      "syncblk_intro",
      "syncblk_verse",
      "syncblk_chorus",
    ]);
  });

  it("finds the active point using the user offset", () => {
    expect(
      getActiveSyncPoint({ currentTime: 17.2, offset: 1, syncPoints: points }),
    ).toEqual({ syncBlockId: "syncblk_verse", time: 18 });
  });

  it("does not activate a point before the first timestamp", () => {
    expect(
      getActiveSyncPoint({ currentTime: 10, syncPoints: points.slice(0, 1) }),
    ).toBeNull();
  });

  it("returns the next point for navigation and interpolation", () => {
    expect(
      getNextSyncPoint({ syncBlockId: "syncblk_verse" }, points),
    ).toEqual({ syncBlockId: "syncblk_chorus", time: 42 });
  });

  it("returns the previous point for practice navigation", () => {
    expect(
      getPreviousSyncPoint({ syncBlockId: "syncblk_chorus" }, points),
    ).toEqual({ syncBlockId: "syncblk_verse", time: 18 });
  });

  it("calculates bounded interpolation progress", () => {
    expect(
      getSyncProgress({
        currentTime: 30,
        activePoint: { syncBlockId: "syncblk_verse", time: 18 },
        nextPoint: { syncBlockId: "syncblk_chorus", time: 42 },
      }),
    ).toBe(0.5);
  });

  it("uses the next point or video duration as loop end", () => {
    expect(
      getLoopBounds({
        activePoint: { syncBlockId: "syncblk_verse", time: 18 },
        duration: 120,
        syncPoints: points,
      }),
    ).toEqual({ start: 18, end: 42 });

    expect(
      getLoopBounds({
        activePoint: { syncBlockId: "syncblk_chorus", time: 42 },
        duration: 120,
        syncPoints: points,
      }),
    ).toEqual({ start: 42, end: 120 });
  });
});
