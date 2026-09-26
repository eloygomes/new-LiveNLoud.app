import { useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PresentationColumns from "../components/PresentationColumns";
import {
  collectEditedPresentationBlocksFromNode,
  moveToAdjacentEditableBlock,
} from "../helpers/editableCifraDom";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "../helpers/presentationConstants";
import { usePresentationEditableColumns } from "./usePresentationEditableColumns";

const columns = ["First", "Second", "Before After"].map((text, index) => ({
  groupKey: `column-${index}`,
  blockKeys: [`block-${index}`],
  blocks: [{ block: `<pre>${text}</pre>`, index }],
  isProgressionEligible: true,
}));

function Editor({ isEditing = true, sessionKey = "song-expanded" }) {
  const { editableColumns, createNextBlock } = usePresentationEditableColumns({
    columns, isEditing, sessionKey,
  });
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="presentation-content-flow" onKeyDown={(event) => {
        if (isEditing && moveToAdjacentEditableBlock(event, { createNextBlock })) {
          setDraft(collectEditedPresentationBlocksFromNode({
            contentNode: event.currentTarget,
            preserveColumnBreaks: true,
            persistVisualColumnBreaks: true,
          }));
        }
      }}>
        <PresentationColumns columns={editableColumns} isEditing={isEditing}
          selectedBlockKeys={[]} showProgressionMarkers shouldUseHorizontalColumnFlow />
      </div>
      <output>{draft}</output>
    </div>
  );
}

function placeCursor(block, offset) {
  const range = document.createRange();
  range.setStart(block.querySelector("pre").firstChild, offset);
  range.collapse(true);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
}

const getBlocks = (container) =>
  container.querySelectorAll(".presentation-render-content-block");

describe("editable presentation columns", () => {
  it.each([{ metaKey: true }, { shiftKey: true }])(
    "creates a fourth column, moves trailing content and preserves it after rerenders (%o)",
    (modifier) => {
      const { container, rerender } = render(<Editor />);
      placeCursor(getBlocks(container)[2], 7);
      fireEvent.keyDown(getBlocks(container)[2], { key: "Enter", ...modifier });

      let blocks = getBlocks(container);
      expect(blocks).toHaveLength(4);
      expect(blocks[2]).toHaveTextContent("Before");
      expect(blocks[2]).not.toHaveTextContent("After");
      expect(blocks[3]).toHaveTextContent("After");
      expect(blocks[3].contains(window.getSelection().anchorNode)).toBe(true);
      expect(container.querySelectorAll(".presentation-column-header")[3]).toHaveTextContent("D");
      expect(container.querySelector("output").textContent).toBe(
        ["First", "Second", "Before ", "After"].join(`\n${PRESENTATION_COLUMN_BREAK_MARKER}\n`),
      );

      rerender(<Editor />);
      expect(getBlocks(container)[3]).toHaveTextContent("After");

      placeCursor(getBlocks(container)[3], 2);
      fireEvent.keyDown(getBlocks(container)[3], { key: "Enter", ...modifier });
      blocks = getBlocks(container);
      expect(blocks).toHaveLength(5);
      expect(blocks[3]).toHaveTextContent("Af");
      expect(blocks[4]).toHaveTextContent("ter");

      rerender(<Editor isEditing={false} />);
      expect(getBlocks(container)).toHaveLength(3);
      rerender(<Editor />);
      expect(getBlocks(container)).toHaveLength(3);
    },
  );

  it("uses the existing next column for CMD + Enter", () => {
    const { container } = render(<Editor />);
    placeCursor(getBlocks(container)[1], 3);
    fireEvent.keyDown(getBlocks(container)[1], { key: "Enter", metaKey: true });
    const blocks = getBlocks(container);
    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toHaveTextContent("Sec");
    expect(blocks[2].textContent).toBe("ondBefore After");
  });

  it("creates an editable empty column at the end and resets it on a layout change", () => {
    const { container, rerender } = render(<Editor />);
    placeCursor(getBlocks(container)[2], 12);
    fireEvent.keyDown(getBlocks(container)[2], { key: "Enter", metaKey: true });
    expect(getBlocks(container)).toHaveLength(4);
    expect(getBlocks(container)[3]).toHaveAttribute("contenteditable", "true");
    expect(window.getSelection().anchorNode).toBe(getBlocks(container)[3]);

    rerender(<Editor sessionKey="song-default" />);
    expect(getBlocks(container)).toHaveLength(3);
  });

  it.each([{}, { altKey: true, metaKey: true }, { metaKey: true, isComposing: true }])(
    "does not append a column for other key combinations (%o)", (modifier) => {
      const { container } = render(<Editor />);
      placeCursor(getBlocks(container)[2], 7);
      fireEvent.keyDown(getBlocks(container)[2], { key: "Enter", ...modifier });
      expect(getBlocks(container)).toHaveLength(3);
      expect(getBlocks(container)[2]).toHaveTextContent("Before After");
    },
  );
});
