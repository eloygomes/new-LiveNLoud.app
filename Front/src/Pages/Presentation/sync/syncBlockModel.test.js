import { describe, expect, it } from "vitest";
import { processSongCifra } from "../processSongCifra";
import {
  getSyncBlocksFromHtmlBlocks,
  getSyncBlockIdFromHtml,
  normalizePlaybackSync,
  pruneSyncPointsForBlocks,
  reconcilePlaybackSyncToBlocks,
} from "./syncBlockModel";

describe("syncBlockModel", () => {
  it("adds stable sync ids to rendered presentation blocks without replacing existing html ids", () => {
    const result = processSongCifra("[Intro]\nC G\n\n[Verse]\nAm F");
    const secondResult = processSongCifra("[Intro]\nC G\n\n[Verse]\nAm F");
    const ids = result.htmlBlocks.map(getSyncBlockIdFromHtml).filter(Boolean);
    const secondIds = secondResult.htmlBlocks
      .map(getSyncBlockIdFromHtml)
      .filter(Boolean);

    expect(ids).toEqual(secondIds);
    expect(ids[0]).toMatch(/^syncblk_intro-0_/);
    expect(ids[1]).toMatch(/^syncblk_verse-3_/);
    expect(result.htmlBlocks[0]).toContain('id="section-Intro-0"');
    expect(result.htmlBlocks[0]).toContain('data-sync-block-id="syncblk_intro-0_');
  });

  it("extracts sync blocks from legacy string html blocks", () => {
    const htmlBlocks = processSongCifra("[Chorus]\nD A\nSing").htmlBlocks;
    const blocks = getSyncBlocksFromHtmlBlocks(htmlBlocks);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].syncBlockId).toMatch(/^syncblk_chorus-0_/);
    expect(blocks[0].label).toContain("Chorus");
  });

  it("normalizes and prunes sync points for blocks that still exist", () => {
    const blocks = [
      { syncBlockId: "syncblk_a_one" },
      { syncBlockId: "syncblk_b_two" },
    ];

    const result = pruneSyncPointsForBlocks(
      {
        provider: "youtube",
        videoId: "abc12345678",
        syncPoints: [
          { syncBlockId: "syncblk_b_two", time: 12.345 },
          { syncBlockId: "removed", time: 2 },
          { syncBlockId: "syncblk_a_one", time: 1 },
        ],
      },
      blocks,
    );

    expect(result.syncPoints).toEqual([
      { syncBlockId: "syncblk_a_one", time: 1 },
      { syncBlockId: "syncblk_b_two", time: 12.35 },
    ]);
  });

  it("keeps playback sync empty only when no useful data exists", () => {
    expect(normalizePlaybackSync({})).toBeNull();
    expect(normalizePlaybackSync({ videoId: "abc12345678" })).toEqual({
      provider: "youtube",
      videoId: "abc12345678",
      syncPoints: [],
    });
  });

  it("reconciles legacy random sync point ids by order when none match current blocks", () => {
    const result = reconcilePlaybackSyncToBlocks(
      {
        provider: "youtube",
        videoId: "abc12345678",
        syncPoints: [
          { syncBlockId: "syncblk_old_a", time: 8 },
          { syncBlockId: "syncblk_old_b", time: 20 },
        ],
      },
      [{ syncBlockId: "syncblk_current_a" }, { syncBlockId: "syncblk_current_b" }],
    );

    expect(result.syncPoints).toEqual([
      { syncBlockId: "syncblk_current_a", time: 8, needsReview: true },
      { syncBlockId: "syncblk_current_b", time: 20, needsReview: true },
    ]);
  });
});
