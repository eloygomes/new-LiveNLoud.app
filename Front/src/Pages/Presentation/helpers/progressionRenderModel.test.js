import { describe, expect, it } from "vitest";
import { processSongCifra } from "../processSongCifra";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "./presentationConstants";
import { buildProgressionBlocks } from "./presentationUtils";
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
      ...Array.from({ length: 24 }, (_, index) =>
        makeBlock(index, `line ${index + 1}`),
      ),
      makeBlock(24, ""),
      makeBlock(25, "line 25"),
    ];

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    expect(model.activeColumns).toHaveLength(2);
    expect(model.activeColumns[0].groupKey).toBe("continuous-column-1");
    expect(model.activeColumns[0].blockKeys).toEqual(
      Array.from({ length: 24 }, (_, index) => `block-${index}`),
    );
    expect(model.activeColumns[1].blockKeys).toContain("block-25");
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

  it("keeps oversized explicit columns intact after save", () => {
    const visibleContentBlocks = [
      ...Array.from({ length: 30 }, (_, index) =>
        makeBlock(index, `left line ${index + 1}`),
      ),
      makeColumnBreak(30),
      makeBlock(31, "right"),
    ];

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    expect(model.activeColumns).toHaveLength(2);
    expect(model.activeColumns[0].blockKeys).toEqual(
      Array.from({ length: 30 }, (_, index) => `block-${index}`),
    );
    expect(model.activeColumns[1].blockKeys).toEqual(["block-31"]);
  });

  it("splits a single oversized pre block into continuation columns", () => {
    const visibleContentBlocks = [
      makeBlock(
        0,
        Array.from({ length: 30 }, (_, index) => `line ${index + 1}`).join("\n"),
      ),
    ];

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    expect(model.activeColumns).toHaveLength(2);
    expect(model.activeColumns[0].blockKeys).toEqual(["block-0"]);
    expect(model.activeColumns[1].blockKeys).toEqual(["block-0-fragment-2"]);
  });

  it("renders saved editor columns without restoring discarded empty columns", () => {
    const savedCifra = [
      "[Intro]",
      "C G",
      PRESENTATION_COLUMN_BREAK_MARKER,
      "[Verse]",
      "Am F",
    ].join("\n");
    const visibleContentBlocks = buildProgressionBlocks(
      processSongCifra(savedCifra).htmlBlocks,
      { dropBlankLines: true },
    );

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    expect(model.activeColumns).toHaveLength(2);
    expect(model.activeColumns[0].blocks[0].block).toContain("[Intro]");
    expect(model.activeColumns[1].blocks[0].block).toContain("[Verse]");
    expect(
      model.activeColumns.some((column) =>
        column.blocks.every(
          (block) => block.block.replace(/<[^>]+>/g, "").trim() === "",
        ),
      ),
    ).toBe(false);
  });

  it("keeps a moved tab inside the explicit saved column", () => {
    const savedCifra = [
      "[Intro]",
      "C G",
      PRESENTATION_COLUMN_BREAK_MARKER,
      "Parte 5 de 5",
      "[C]",
      "E|-------------------------------------|",
      "B|-0h1-----1-3---0---1--0h1-----1-3---0-|",
      "G|-----0---------0-2---------0----------|",
      "D|---0------0----2-----0----------------|",
      "A|---------------0----------------------|",
      "E|--------------------------------------|",
      PRESENTATION_COLUMN_BREAK_MARKER,
      "[Am]",
      "De tarde quero descansar",
    ].join("\n");
    const visibleContentBlocks = buildProgressionBlocks(
      processSongCifra(savedCifra).htmlBlocks,
      { dropBlankLines: true },
    );

    const model = buildProgressionRenderModel({
      visibleContentBlocks,
      shouldUseHorizontalColumnFlow: true,
    });

    const secondColumnHtml = model.activeColumns[1].blocks
      .map((block) => block.block)
      .join("\n");
    const thirdColumnHtml = model.activeColumns[2].blocks
      .map((block) => block.block)
      .join("\n");

    expect(model.activeColumns).toHaveLength(3);
    expect(secondColumnHtml).toContain("Parte 5 de 5");
    expect(secondColumnHtml).toContain("0h1");
    expect(thirdColumnHtml).not.toContain("0h1");
  });
});
