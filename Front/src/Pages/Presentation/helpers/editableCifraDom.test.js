import { describe, expect, it } from "vitest";
import { collectEditedPresentationBlocksFromNode } from "./editableCifraDom";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "./presentationConstants";

describe("editableCifraDom", () => {
  it("preserves blank line blocks when serializing edited presentation content", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="intro">
          <pre>[Intro]</pre>
          <pre>B/F# F#11/C# E/B</pre>
          <pre class="presentation-blank-line"></pre>
        </div>
      </div>
      <div class="presentation-render-content-block">
        <div class="verse">
          <pre>[Primeira Parte]</pre>
          <pre>B/F#</pre>
          <pre>Look at the stars</pre>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe(
      "[Intro]\nB/F# F#11/C# E/B\n\n[Primeira Parte]\nB/F#\nLook at the stars",
    );
  });

  it("does not persist automatic visual columns as manual column breaks", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0,block-1">
        <pre>[Intro]</pre>
        <pre>C G</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-2">
        <pre>[Verse]</pre>
        <pre>Am F</pre>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
      preserveColumnBreaks: true,
      sourceBlocks: [
        { blockKey: "block-0" },
        { blockKey: "block-1" },
        { blockKey: "block-2" },
      ],
    });

    expect(serialized).toBe("[Intro]\nC G\n[Verse]\nAm F");
    expect(serialized).not.toContain(PRESENTATION_COLUMN_BREAK_MARKER);
  });

  it("persists visual column boundaries when the horizontal editor is the source of truth", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0,block-1">
        <pre>[Intro]</pre>
        <pre>C G</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-2">
        <pre>[Verse]</pre>
        <pre>Am F</pre>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
      preserveColumnBreaks: true,
      persistVisualColumnBreaks: true,
      sourceBlocks: [
        { blockKey: "block-0" },
        { blockKey: "block-1" },
        { blockKey: "block-2" },
      ],
    });

    expect(serialized).toBe(
      `[Intro]\nC G\n${PRESENTATION_COLUMN_BREAK_MARKER}\n[Verse]\nAm F`,
    );
  });

  it("serializes terminal divs inserted by contenteditable edits", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="verse">
          <pre>[Intro]</pre>
          <div>C G edited in browser</div>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe("[Intro]\nC G edited in browser");
  });

  it("converts bracketed chord tokens created in the editor before saving", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="verse">
          <pre class="mt-1 presentation-lyrics">if I had loose mile</pre>
          <div>[C] [F7] [D/F#]</div>
          <div>I would [A] loose my soul</div>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe(
      "if I had loose mile\nC F7 D/F#\nI would A loose my soul",
    );
  });

  it("preserves rendered section labels while applying editor chord brackets elsewhere", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="intro">
          <pre class="mt-1 intro">[Intro]</pre>
          <pre class="mt-1 section">[A]</pre>
          <div>[D/F#]</div>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe("[Intro]\n[A]\nD/F#");
  });

  it("discards empty visual columns before saving horizontal layout breaks", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0">
        <pre>[Intro]</pre>
        <pre>C G</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-1">
        <pre class="presentation-blank-line">\u200b\u200c\u200d\ufeff</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-2">
        <pre>[Verse]</pre>
        <pre>Am F</pre>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
      preserveColumnBreaks: true,
      persistVisualColumnBreaks: true,
      sourceBlocks: [
        { blockKey: "block-0" },
        { blockKey: "block-1" },
        { blockKey: "block-2" },
      ],
    });

    expect(serialized).toBe(
      `[Intro]\nC G\n${PRESENTATION_COLUMN_BREAK_MARKER}\n[Verse]\nAm F`,
    );
  });

  it("preserves explicit column breaks from the source content", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0">
        <pre>[Intro]</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-2">
        <pre>[Verse]</pre>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
      preserveColumnBreaks: true,
      sourceBlocks: [
        { blockKey: "block-0" },
        { blockKey: "column-break-1", isColumnBreak: true },
        { blockKey: "block-2" },
      ],
    });

    expect(serialized).toBe(
      `[Intro]\n${PRESENTATION_COLUMN_BREAK_MARKER}\n[Verse]`,
    );
  });
});
