import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CifraDocumentModel } from "../model/CifraDocumentModel";
import PresentationTiptapEditor from "./PresentationTiptapEditor";

describe("PresentationTiptapEditor", () => {
  it("renders a headless editable document and destroys its controller", () => {
    const onFocus = vi.fn();
    const onReady = vi.fn();
    const { unmount } = render(
      <PresentationTiptapEditor
        document={CifraDocumentModel.fromLegacyText("[Am] editable")}
        editable
        horizontal={false}
        onFocus={onFocus}
        onReady={onReady}
        onStateChange={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );

    const editor = screen.getByLabelText("Cifra editor");
    expect(editor).toHaveAttribute("contenteditable", "true");
    expect(editor).toHaveTextContent("[Am] editable");
    expect(editor.querySelector(".notespresentation")).toHaveTextContent("Am");

    fireEvent.focus(editor);
    expect(onFocus).toHaveBeenCalled();

    const controller = onReady.mock.calls[0][0];
    unmount();
    expect(controller.getEditor().isDestroyed).toBe(true);
    expect(onReady).toHaveBeenLastCalledWith(null);
  });

  it("renders detected tablature in a dedicated preformatted block", () => {
    render(
      <PresentationTiptapEditor
        document={CifraDocumentModel.fromLegacyText(
          "E|----------|\nB|-12--10---|\nG|----------|",
        )}
        horizontal
      />,
    );

    const block = screen.getByLabelText("Cifra editor")
      .querySelector(".presentation-editor-tab-block");
    expect(block).not.toBeNull();
    expect(block).toHaveAttribute("data-tablature", "true");
    expect(block.textContent).toBe("E|----------|B|-12--10---|G|----------|");
  });

  it("renders four-string bass tabs without chord styling", () => {
    render(
      <PresentationTiptapEditor
        document={CifraDocumentModel.fromLegacyText(
          "G-----14----|\nD-------12--|\nA-0h12------|\nE-----------|\n  (T) (P)(T)(P)",
        )}
        horizontal
      />,
    );

    const editor = screen.getByLabelText("Cifra editor");
    expect(editor.querySelector(".presentation-editor-tab-block")).not.toBeNull();
    expect(editor.querySelector(".notespresentation")).toBeNull();
    expect(editor.textContent).toContain("G-----14");
  });

  it("keeps a chord above a tablature golden while string labels stay plain", () => {
    render(
      <PresentationTiptapEditor
        document={CifraDocumentModel.fromLegacyText(
          "C5\nE|----------|\nB|-12--10---|\nG|----------|\nD|----------|\nA|-10---9---|\nE|----------|",
        )}
        horizontal
      />,
    );

    const editor = screen.getByLabelText("Cifra editor");
    const chords = editor.querySelectorAll(".notespresentation");
    const tabLines = editor.querySelectorAll(".presentation-editor-tab-line");
    expect(chords).toHaveLength(1);
    expect(chords[0]).toHaveAttribute("data-chord", "C5");
    expect(chords[0]).toHaveTextContent("C5");
    expect(chords[0].closest(".presentation-editor-tab-line")).toBeNull();
    expect(tabLines).toHaveLength(6);
  });
});
