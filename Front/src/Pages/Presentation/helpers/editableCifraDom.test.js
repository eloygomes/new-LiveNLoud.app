import { describe, expect, it } from "vitest";
import { collectEditedPresentationBlocksFromNode } from "./editableCifraDom";

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
});
