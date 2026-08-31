import { afterEach, describe, expect, it, vi } from "vitest";
import { PresentationEditorController } from "./PresentationEditorController";
import { CifraDocumentModel } from "../model/CifraDocumentModel";
import { handlePresentationEditorKeyDown } from "../extensions/PresentationEditorExtensions";

const controllers = [];

function createController(text, horizontal = false) {
  const controller = new PresentationEditorController({
    document: CifraDocumentModel.fromLegacyText(text),
    horizontal,
  });
  controllers.push(controller);
  return controller;
}

function dispatchEditorKey(editor, key, options = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  editor.view.dom.dispatchEvent(event);
  return event;
}

function runEditorKeyHandler(editor, key, layout) {
  const event = {
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  handlePresentationEditorKeyDown(editor, event, layout);
  return event;
}

afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.destroy());
});

describe("PresentationEditorController", () => {
  it("turns a typed bracketed chord into navigable golden text", () => {
    const controller = createController("");
    const editor = controller.getEditor();
    editor.commands.insertContent("[Am");
    editor.commands.insertContent("]");

    expect(controller.getJSON().content[0].content[1]).toEqual(
      expect.objectContaining({
        type: "text",
        text: "Am",
        marks: expect.arrayContaining([
          expect.objectContaining({
            type: "chord",
            attrs: expect.objectContaining({ raw: "Am" }),
          }),
        ]),
      }),
    );
    expect(
      editor.view.dom.querySelector(".notespresentation"),
    ).not.toBeNull();
  });

  it("moves trailing rich content to the next block and creates it when absent", () => {
    const controller = createController("Hello darkness my old friend");
    controller.getEditor().commands.setTextSelection(15);

    expect(
      dispatchEditorKey(controller.getEditor(), "Enter", { shiftKey: true })
        .defaultPrevented,
    ).toBe(true);
    expect(controller.getJSON().content).toHaveLength(2);
    expect(controller.getLegacyText()).toBe("Hello darkness\n\n my old friend");
  });

  it("inserts a tab character instead of moving focus away from the editor", () => {
    const controller = createController("one line");
    const editor = controller.getEditor();
    editor.commands.setTextSelection(4);

    expect(dispatchEditorKey(editor, "Tab").defaultPrevented).toBe(true);
    expect(controller.getLegacyText()).toBe("one\t line");
  });

  it("keeps regular Enter inside the current structural block", () => {
    const controller = createController("line one");
    controller.getEditor().commands.setTextSelection(5);

    controller.getEditor().commands.keyboardShortcut("Enter");

    expect(controller.getJSON().content).toHaveLength(1);
    expect(controller.getLegacyText()).toBe("line\n one");
  });

  it("moves trailing content to the previous block", () => {
    const controller = createController("first\n\nsecond tail");
    controller.getEditor().commands.setTextSelection(14);

    expect(
      dispatchEditorKey(controller.getEditor(), "Backspace", { shiftKey: true })
        .defaultPrevented,
    ).toBe(true);
    expect(controller.getLegacyText()).toBe("first\n\n tail\n\nsecond");
  });

  it("prepends trailing content to an existing next block without replacing it", () => {
    const controller = createController("Hello darkness my old friend\n\nexisting");
    controller.getEditor().commands.setTextSelection(15);

    expect(controller.moveTrailingContent(1)).toBe(true);
    expect(controller.getLegacyText()).toBe(
      "Hello darkness\n\n my old friend\n\nexisting",
    );
  });

  it("keeps two transferred tablatures separated by one blank line", () => {
    const firstTab = "E|---1---|\nB|---1---|\nG|---2---|\nD|---3---|\nA|---3---|\nE|---1---|";
    const secondTab = "E|---3---|\nB|---3---|\nG|---4---|\nD|---5---|\nA|---5---|\nE|---3---|";
    const controller = createController(`${firstTab}\n\n${secondTab}`);

    expect(controller.navigateBlock(1)).toBe(true);
    expect(
      dispatchEditorKey(controller.getEditor(), "Backspace", { shiftKey: true })
        .defaultPrevented,
    ).toBe(true);
    expect(controller.getLegacyText()).toBe(`${firstTab}\n\n${secondTab}`);
    expect(
      controller.getJSON().content[0].content.filter(
        (node) => node.type === "hardBreak",
      ),
    ).toHaveLength(12);
  });

  it("navigates through structural blocks with one controller command", () => {
    const controller = createController("one\n\ntwo", true);
    controller.getEditor().commands.setTextSelection(2);

    expect(controller.navigateBlock(1)).toBe(true);
    expect(controller.getEditor().state.selection.from).toBeGreaterThan(4);
    expect(controller.navigateBlock(-1)).toBe(true);
    expect(controller.getEditor().state.selection.from).toBeLessThan(5);
  });

  it("leaves horizontal arrows native even at a block boundary", () => {
    const controller = createController("one\n\ntwo\n\nthree", true);
    const editor = controller.getEditor();
    editor.commands.setTextSelection(7);

    expect(dispatchEditorKey(editor, "ArrowRight").defaultPrevented).toBe(false);
    expect(editor.state.selection.from).toBe(7);

    editor.commands.setTextSelection(9);
    expect(dispatchEditorKey(editor, "ArrowRight").defaultPrevented).toBe(false);
    expect(editor.state.selection.from).toBe(9);
  });

  it("leaves ArrowRight native beside a chord", () => {
    const controller = createController("[G]\nlyric", true);
    const editor = controller.getEditor();
    editor.commands.setTextSelection(2);

    expect(dispatchEditorKey(editor, "ArrowRight").defaultPrevented).toBe(false);
    expect(controller.getJSON().content).toHaveLength(1);
    expect(editor.state.selection.from).toBe(2);
  });

  it("does not turn left/right into block navigation in Vertical View", () => {
    const controller = createController("one\n\ntwo", false);
    const editor = controller.getEditor();
    editor.commands.setTextSelection(2);

    expect(dispatchEditorKey(editor, "ArrowRight").defaultPrevented).toBe(false);
    expect(editor.state.selection.from).toBe(2);
  });

  it("leaves every arrow available for native text navigation inside a block", () => {
    const horizontalController = createController("first line\nsecond line", true);
    const verticalController = createController("first line\nsecond line", false);

    [horizontalController, verticalController].forEach((controller) => {
      const editor = controller.getEditor();
      editor.commands.setTextSelection(6);
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach((key) => {
        expect(
          runEditorKeyHandler(
            editor,
            key,
            controller.horizontal ? "horizontal" : "vertical",
          ).defaultPrevented,
        ).toBe(false);
      });
    });
  });

  it("reads toolbar state without stealing focus or clearing the DOM selection", () => {
    const controller = createController("select this text", false);
    const editor = controller.getEditor();
    editor.commands.setTextSelection({ from: 1, to: 7 });
    const focusSpy = vi.spyOn(editor.view, "focus");

    const selectionBefore = editor.state.selection;
    const state = controller.getState();

    expect(state).toEqual(expect.objectContaining({ canUndo: false }));
    expect(editor.state.selection.from).toBe(selectionBefore.from);
    expect(editor.state.selection.to).toBe(selectionBefore.to);
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("leaves vertical arrows native at every block position", () => {
    const controller = createController("one\nline\n\ntwo\nline", false);
    const editor = controller.getEditor();

    editor.commands.setTextSelection(4);
    expect(runEditorKeyHandler(editor, "ArrowDown", "vertical").defaultPrevented)
      .toBe(false);

    editor.commands.setTextSelection(9);
    expect(runEditorKeyHandler(editor, "ArrowDown", "vertical").defaultPrevented)
      .toBe(false);
    expect(editor.state.selection.from).toBe(9);
  });

  it("maps a primary mouse click to a text selection without cancelling native selection", () => {
    const controller = createController("click this text", false);
    const editor = controller.getEditor();
    editor.commands.setTextSelection(1);
    vi.spyOn(editor.view, "posAtCoords").mockReturnValue({ pos: 7, inside: 0 });

    const event = new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      clientX: 120,
      clientY: 80,
    });
    editor.view.dom.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(editor.state.selection.from).toBe(7);
    expect(editor.state.selection.to).toBe(7);
  });

  it("preserves marks in structured JSON and serializes bare chords for legacy clients", () => {
    const controller = createController("[Am] text");
    controller.getEditor().commands.selectAll();
    controller.run("bold");

    expect(controller.getJSON().content[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "text",
          text: "Am",
          marks: expect.arrayContaining([
            expect.objectContaining({ type: "chord", attrs: expect.objectContaining({ raw: "Am" }) }),
            expect.objectContaining({ type: "bold" }),
          ]),
        }),
      ]),
    );
    expect(controller.getLegacyText()).toBe("Am text");
    expect(
      controller.getEditor().view.dom.querySelector(".notespresentation")
        ?.dataset.chordRaw,
    ).toBe("Am");

    controller.setTransposeSteps(2);
    expect(
      controller.getEditor().view.dom.querySelector(".notespresentation")
        ?.dataset.displayChord,
    ).toBe("Bm");
  });

  it("allows a text selection at every character boundary inside [G]", () => {
    const controller = createController("[G]");
    const editor = controller.getEditor();

    [1, 2, 3, 4].forEach((position) => {
      editor.commands.setTextSelection(position);
      expect(editor.state.selection.from).toBe(position);
    });
  });
});
