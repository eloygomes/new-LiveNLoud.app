import { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { CifraDocumentModel } from "../model/CifraDocumentModel";
import {
  createPresentationEditorExtensions,
  handlePresentationEditorKeyDown,
  moveTrailingContent,
  navigateToAdjacentBlock,
} from "../extensions/PresentationEditorExtensions";
import { transposeChord } from "../../transposeCifra";

const DEFAULT_STATE = {
  canUndo: false,
  canRedo: false,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  align: "left",
  level: 0,
  fontSize: "1em",
  color: "#000000",
};

export class PresentationEditorController {
  constructor({
    document,
    editable = true,
    horizontal = false,
    onFocus,
    onUpdate,
    onStateChange,
  }) {
    this.horizontal = horizontal;
    this.onUpdate = onUpdate;
    this.onStateChange = onStateChange;
    this.editor = new Editor({
      content: CifraDocumentModel.normalize(document),
      editable,
      extensions: createPresentationEditorExtensions(),
      editorProps: {
        attributes: {
          class: "presentation-cifra-editor",
          spellcheck: "true",
          "aria-label": "Cifra editor",
        },
        handleKeyDown: (_view, event) =>
          handlePresentationEditorKeyDown(
            this.editor,
            event,
            this.horizontal ? "horizontal" : "vertical",
          ),
        handleDOMEvents: {
          mousedown: (view, event) => {
            if (
              !view.editable ||
              event.button !== 0 ||
              event.shiftKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            ) {
              return false;
            }

            const mappedPosition = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (!mappedPosition) return false;

            const selection = TextSelection.near(
              view.state.doc.resolve(mappedPosition.pos),
              1,
            );
            if (!selection.eq(view.state.selection)) {
              view.dispatch(view.state.tr.setSelection(selection));
            }

            // Keep the native event alive so dragging, double-clicking and
            // extending a selection continue to work like a regular editor.
            return false;
          },
        },
      },
      onFocus: () => onFocus?.(),
      onUpdate: () => this.emitUpdate(),
      onSelectionUpdate: () => this.emitState(),
      onTransaction: () => this.emitState(),
      onCreate: () => this.emitState(),
    });
  }

  emitUpdate() {
    this.onUpdate?.({
      document: this.getJSON(),
      legacyText: this.getLegacyText(),
    });
    this.emitState();
  }

  emitState() {
    if (!this.editor || this.editor.isDestroyed) return;
    this.onStateChange?.(this.getState());
  }

  getState() {
    if (!this.editor || this.editor.isDestroyed) return DEFAULT_STATE;
    const attrs = this.editor.getAttributes("songBlock");
    return {
      canUndo: this.editor.can().undo(),
      canRedo: this.editor.can().redo(),
      bold: this.editor.isActive("bold"),
      italic: this.editor.isActive("italic"),
      underline: this.editor.isActive("underline"),
      strike: this.editor.isActive("strike"),
      align: attrs.align || "left",
      level: Number(attrs.level || 0),
      fontSize: this.editor.getAttributes("fontSize").size || "1em",
      color: this.editor.getAttributes("textColor").color || "#000000",
    };
  }

  getJSON() {
    return this.editor?.getJSON() || CifraDocumentModel.fromLegacyText("");
  }

  getLegacyText() {
    return CifraDocumentModel.toLegacyText(this.getJSON(), {
      horizontal: this.horizontal,
    });
  }

  getEditor() {
    return this.editor;
  }

  setDocument(document, { emitUpdate = false } = {}) {
    if (!this.editor || this.editor.isDestroyed) return;
    this.editor.commands.setContent(CifraDocumentModel.normalize(document), emitUpdate);
    this.emitState();
  }

  setEditable(editable) {
    this.editor?.setEditable(Boolean(editable));
  }

  setHorizontal(horizontal) {
    this.horizontal = Boolean(horizontal);
  }

  setTransposeSteps(steps = 0) {
    const root = this.editor?.view?.dom;
    root?.querySelectorAll?.("[data-chord]").forEach((element) => {
      const raw = element.dataset.chordRaw || "";
      const displayChord = transposeChord(raw, steps);
      element.dataset.displayChord = displayChord;
      if (steps) {
        element.dataset.transposeActive = "true";
      } else {
        delete element.dataset.transposeActive;
      }
    });
  }

  navigateBlock(direction) {
    return navigateToAdjacentBlock(this.editor, direction);
  }

  moveTrailingContent(direction) {
    return moveTrailingContent(this.editor, direction);
  }

  run(command, value) {
    if (!this.editor || this.editor.isDestroyed) return false;
    const chain = this.editor.chain().focus();
    const commands = {
      bold: () => chain.toggleBold().run(),
      italic: () => chain.toggleItalic().run(),
      underline: () => chain.toggleUnderline().run(),
      strike: () => chain.toggleStrike().run(),
      undo: () => chain.undo().run(),
      redo: () => chain.redo().run(),
      clear: () => chain.unsetAllMarks().updateAttributes("songBlock", { level: 0, align: "left" }).run(),
      align: () => chain.updateAttributes("songBlock", { align: value }).run(),
      level: () => chain.updateAttributes("songBlock", { level: Number(value) || 0 }).run(),
      fontSize: () => chain.setFontSize(value).run(),
      color: () => chain.setTextColor(value).run(),
    };
    const result = commands[command]?.() || false;
    this.emitState();
    return result;
  }

  destroy() {
    if (this.editor && !this.editor.isDestroyed) this.editor.destroy();
  }
}
