import { describe, expect, it } from "vitest";
import { buildProgressionRenderModel } from "./progressionRenderModel";

const makeBlock = (index, text) => ({
  block: `<pre>${text}</pre>`,
  blockKey: `block-${index}`,
  index,
  isProgressionEligible: text.trim() !== "",
  progressionIndex: text.trim() === "" ? null : index + 1,
});

const makeColumnBreak = (index) => ({
  block: '<div class="presentation-column-break" data-column-break="true"></div>',
  blockKey: `column-break-${index}`,
  index,
  isColumnBreak: true,
  isProgressionEligible: false,
  progressionIndex: null,
});

describe("progressionRenderModel", () => {
  it("packs horizontal expanded content into continuous columns without empty columns", () => {
    const visibleContentBlocks = [
      ...Array.from({ length: 32 }, (_, index) =>
        makeBlock(index, `line ${index + 1}`),
      ),
      makeBlock(32, ""),
      makeBlock(33, "line 33"),
    ];

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    expect(model.activeColumns).toHaveLength(2);
    expect(model.activeColumns[0].groupKey).toBe("continuous-column-1");
    expect(model.activeColumns[0].blockKeys).toEqual(
      Array.from({ length: 32 }, (_, index) => `block-${index}`),
    );
    expect(model.activeColumns[1].blockKeys).toContain("block-33");
    expect(
      model.activeColumns.some((column) =>
        column.blocks.every(
          (block) => block.block.replace(/<[^>]+>/g, "").trim() === "",
        ),
      ),
    ).toBe(false);
  });

  it("preserves explicit horizontal column breaks", () => {
    const visibleContentBlocks = [
      makeBlock(0, "left"),
      makeColumnBreak(1),
      makeBlock(2, "right"),
    ];

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    expect(model.activeColumns).toHaveLength(2);
    expect(model.activeColumns[0].blockKeys).toEqual(["block-0"]);
    expect(model.activeColumns[1].blockKeys).toEqual(["block-2"]);
  });
});
