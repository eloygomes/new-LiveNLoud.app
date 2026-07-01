import { describe, expect, it } from "vitest";
import {
  collectEditedPresentationBlocksFromNode,
  moveToAdjacentEditableBlock,
} from "./editableCifraDom";
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

  it("preserves bracketed chord tokens created in the editor before saving", () => {
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
      "if I had loose mile\n[C] [F7] [D/F#]\nI would [A] loose my soul",
    );
  });

  it("normalizes bracketed chord tokens with inner spaces before saving", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="verse">
          <div>[ E7 ]</div>
          <div>Did you think I'd crumble?</div>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe("[E7]\nDid you think I'd crumble?");
  });

  it("keeps manually bracketed chord tokens separated from following lyrics", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="verse">
          <div>[Bm]Down to the water</div>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe("[Bm]\nDown to the water");
  });

  it("keeps adjacent manually bracketed chord tokens as separate chords", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <div class="verse">
          <div>[D][Dsus4][D][Dsus2]</div>
          <div>([Dsus4][D][Dsus2][D][Dsus2])</div>
        </div>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toBe(
      "[D] [Dsus4] [D] [Dsus2]\n([Dsus4] [D] [Dsus2] [D] [Dsus2])",
    );
  });

  it("preserves spacing between rendered chord spans when serializing edited content", () => {
    const contentNode = document.createElement("div");
    contentNode.innerHTML = `
      <div class="presentation-render-content-block">
        <pre class="presentation-chords">
          <span class="notespresentation" data-chord="B5">B5</span>   <span class="notespresentation" data-chord="C5">C5</span>     <span class="notespresentation" data-chord="B5">B5</span>   <span class="notespresentation" data-chord="C5">C5</span>
        </pre>
        <pre class="presentation-lyrics">Big cheese make me</pre>
      </div>
    `;

    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(serialized).toContain("[B5]   [C5]     [B5]   [C5]");
    expect(serialized).not.toContain("[B5][C5][B5][C5]");
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

    expect(serialized).toBe("[Intro]\n[A]\n[D/F#]");
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

  it("creates a new right-side block when shift enter is used on the last block", () => {
    const contentNode = document.createElement("div");
    contentNode.className = "presentation-content-flow";
    contentNode.innerHTML = `
      <div class="presentation-column">
        <div class="presentation-render-block">
          <div class="presentation-column-header">A</div>
          <div class="presentation-column-body">
            <div class="presentation-render-content-block" data-block-keys="block-0" data-original-block-index="0">
              <pre>First line</pre>
              <pre>Second line</pre>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(contentNode);

    const secondLine = contentNode.querySelectorAll("pre")[1].firstChild;
    const range = document.createRange();
    range.setStart(secondLine, 0);
    range.collapse(true);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    const handled = moveToAdjacentEditableBlock({
      key: "Enter",
      shiftKey: true,
      altKey: false,
      metaKey: false,
      ctrlKey: false,
      isComposing: false,
      currentTarget: contentNode,
      preventDefault: () => {},
    });

    const blocks = contentNode.querySelectorAll(
      ".presentation-render-content-block",
    );
    expect(handled).toBe(true);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].textContent).toContain("First line");
    expect(blocks[1].textContent).toContain("Second line");
    expect(
      Array.from(blocks[1].childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE,
      ),
    ).toBe(false);

    document.body.removeChild(contentNode);
  });

  it("preserves chord-line spacing when moving content to the next block", () => {
    const contentNode = document.createElement("div");
    contentNode.className = "presentation-content-flow";
    contentNode.innerHTML = `
      <div class="presentation-column">
        <div class="presentation-render-block">
          <div class="presentation-column-body">
            <div class="presentation-render-content-block" data-block-keys="block-0" data-original-block-index="0">
              <pre class="presentation-chords"><span class="notespresentation" data-chord="E">E</span>          <span class="notespresentation" data-chord="D">D</span>          <span class="notespresentation" data-chord="A">A</span>    <span class="notespresentation" data-chord="Asus4">Asus4</span> <span class="notespresentation" data-chord="A">A</span></pre>
              <pre class="presentation-lyrics">Jesus doesn't want me for a sunbeam</pre>
            </div>
          </div>
        </div>
      </div>
      <div class="presentation-column">
        <div class="presentation-render-block">
          <div class="presentation-column-body">
            <div class="presentation-render-content-block" data-block-keys="block-1" data-original-block-index="1">
              <pre>[Chorus]</pre>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(contentNode);

    const chordLine = contentNode.querySelector(".presentation-chords");
    const range = document.createRange();
    range.setStart(chordLine, 0);
    range.collapse(true);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    const handled = moveToAdjacentEditableBlock({
      key: "Enter",
      shiftKey: true,
      altKey: false,
      metaKey: false,
      ctrlKey: false,
      isComposing: false,
      currentTarget: contentNode,
      preventDefault: () => {},
    });

    const blocks = contentNode.querySelectorAll(
      ".presentation-render-content-block",
    );
    const serialized = collectEditedPresentationBlocksFromNode({
      contentNode,
      fallbackCifra: "",
    });

    expect(handled).toBe(true);
    expect(blocks[1].textContent).toContain("E          D          A");
    expect(serialized).toContain("[E]          [D]          [A]    [Asus4] [A]");
    expect(serialized).not.toContain("[E][D][Asus4][A]");

    document.body.removeChild(contentNode);
  });
});
