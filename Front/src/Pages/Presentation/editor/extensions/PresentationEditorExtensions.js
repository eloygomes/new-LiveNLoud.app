import { Extension, Mark, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Fragment } from "@tiptap/pm/model";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import {
  BRACKETED_CHORD_PATTERN,
  ChordParser,
  findBareChordMatches,
  isTablatureBlock,
  isTablatureLine,
} from "../model/ChordParser";

export const PresentationDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "songBlock+",
});

export const SongBlock = Node.create({
  name: "songBlock",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      id: { default: null },
      align: { default: "left" },
      level: { default: 0 },
      tablature: {
        default: false,
        parseHTML: (element) => element.dataset.tablature === "true",
        renderHTML: (attributes) => attributes.tablature
          ? { "data-tablature": "true" }
          : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-song-block]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-song-block": "true",
        class: `presentation-editor-block presentation-editor-level-${HTMLAttributes.level || 0}${node.attrs.tablature ? " presentation-editor-tab-block" : ""}`,
        style: `text-align: ${HTMLAttributes.align || "left"}`,
      },
      0,
    ];
  },
});

export const ChordMark = Mark.create({
  name: "chord",
  inclusive: false,

  addAttributes() {
    return {
      raw: { default: "" },
      root: { default: "" },
      accidental: { default: null },
      quality: { default: "" },
      bass: { default: null },
      chordId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-chord]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const raw = HTMLAttributes.raw || "";
    return [
      "span",
      {
        class: "notespresentation presentation-editor-chord",
        "data-chord": raw,
        "data-chord-raw": raw,
        "data-display-chord": raw,
        "data-chord-id": HTMLAttributes.chordId || undefined,
      },
      0,
    ];
  },
});

export const ChordBracket = Mark.create({
  name: "chordBracket",
  inclusive: false,

  parseHTML() {
    return [{ tag: "span[data-chord-bracket]" }];
  },

  renderHTML() {
    return [
      "span",
      {
        class: "presentation-editor-chord-bracket",
        "data-chord-bracket": "true",
      },
      0,
    ];
  },
});

export const TablatureLine = Mark.create({
  name: "tablatureLine",
  inclusive: false,

  parseHTML() {
    return [{ tag: "span[data-tablature-line]" }];
  },

  renderHTML() {
    return [
      "span",
      {
        class: "presentation-editor-tab-line",
        "data-tablature-line": "true",
      },
      0,
    ];
  },
});

export const ChordRecognition = Extension.create({
  name: "chordRecognition",

  addProseMirrorPlugins() {
    const chordType = this.editor.schema.marks.chord;
    const bracketType = this.editor.schema.marks.chordBracket;

    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) return null;
          if (transactions.some((transaction) => transaction.getMeta("chordRecognition"))) {
            return null;
          }

          const transaction = newState.tr;
          const tablatureLineType = newState.schema.marks.tablatureLine;
          newState.doc.forEach((block, blockPosition, blockIndex) => {
            if (block.type.name !== "songBlock") return;

            const blockStart = blockPosition + 1;
            const blockEnd = blockStart + block.content.size;
            transaction.removeMark(blockStart, blockEnd, chordType);
            transaction.removeMark(blockStart, blockEnd, bracketType);
            transaction.removeMark(blockStart, blockEnd, tablatureLineType);

            const blockText = block.textBetween(0, block.content.size, "\n", "\n");
            const tablature = isTablatureBlock(blockText);
            if (Boolean(block.attrs.tablature) !== tablature) {
              transaction.setNodeMarkup(blockPosition, undefined, {
                ...block.attrs,
                tablature,
              });
            }
            let lineOffset = 0;
            blockText.split("\n").forEach((line) => {
              if (isTablatureLine(line)) {
                if (line.length) {
                  transaction.addMark(
                    blockStart + lineOffset,
                    blockStart + lineOffset + line.length,
                    tablatureLineType.create(),
                  );
                }
                lineOffset += line.length + 1;
                return;
              }

              const chordPattern = new RegExp(
                BRACKETED_CHORD_PATTERN.source,
                BRACKETED_CHORD_PATTERN.flags,
              );
              for (const match of line.matchAll(chordPattern)) {
                const raw = String(match[1] || "").trim();
                const chord = ChordParser.parse(raw);
                if (!chord) continue;

                const matchStart = blockStart + lineOffset + match.index;
                const rawOffset = match[0].indexOf(raw);
                const rawStart = matchStart + rawOffset;
                const rawEnd = rawStart + raw.length;
                const matchEnd = matchStart + match[0].length;

                transaction.addMark(matchStart, rawStart, bracketType.create());
                transaction.addMark(
                  rawStart,
                  rawEnd,
                  chordType.create({
                    ...chord,
                    chordId: `chord-${blockIndex}-${lineOffset + match.index}`,
                  }),
                );
                transaction.addMark(rawEnd, matchEnd, bracketType.create());
              }

              findBareChordMatches(line).forEach((match) => {
                const chord = ChordParser.parse(match.raw);
                if (!chord) return;
                const start = blockStart + lineOffset + match.start;
                transaction.addMark(
                  start,
                  start + match.raw.length,
                  chordType.create({
                    ...chord,
                    chordId: `chord-${blockIndex}-${lineOffset + match.start}`,
                  }),
                );
              });
              lineOffset += line.length + 1;
            });
          });

          if (!transaction.steps.length) return null;
          transaction.setMeta("chordRecognition", true);
          transaction.setMeta("addToHistory", false);
          return transaction;
        },
      }),
    ];
  },
});

const createStyleMark = ({ name, attribute, cssProperty, defaultValue = null }) =>
  Mark.create({
    name,
    addAttributes() {
      return {
        [attribute]: {
          default: defaultValue,
          parseHTML: (element) => element.style[cssProperty] || defaultValue,
        },
      };
    },
    parseHTML() {
      return [{ tag: `span[data-${name}]` }];
    },
    renderHTML({ HTMLAttributes }) {
      const value = HTMLAttributes[attribute];
      return [
        "span",
        {
          [`data-${name}`]: value,
          style: value ? `${cssProperty.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value}` : undefined,
        },
        0,
      ];
    },
    addCommands() {
      return {
        [`set${name[0].toUpperCase()}${name.slice(1)}`]:
          (value) =>
          ({ commands }) =>
            commands.setMark(this.name, { [attribute]: value }),
        [`unset${name[0].toUpperCase()}${name.slice(1)}`]:
          () =>
          ({ commands }) =>
            commands.unsetMark(this.name),
      };
    },
  });

export const FontSize = createStyleMark({
  name: "fontSize",
  attribute: "size",
  cssProperty: "fontSize",
});

export const TextColor = createStyleMark({
  name: "textColor",
  attribute: "color",
  cssProperty: "color",
});

export const Underline = Mark.create({
  name: "underline",
  parseHTML() {
    return [{ tag: "u" }, { style: "text-decoration=underline" }];
  },
  renderHTML() {
    return ["u", 0];
  },
  addCommands() {
    return {
      setUnderline: () => ({ commands }) => commands.setMark(this.name),
      toggleUnderline: () => ({ commands }) => commands.toggleMark(this.name),
      unsetUnderline: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
  addKeyboardShortcuts() {
    return { "Mod-u": () => this.editor.commands.toggleUnderline() };
  },
});

function findActiveBlock(doc, position) {
  const resolved = doc.resolve(position);
  for (let depth = resolved.depth; depth > 0; depth -= 1) {
    if (resolved.node(depth).type.name === "songBlock") {
      const blockPosition = resolved.before(depth);
      let blockIndex = 0;
      doc.forEach((_node, offset, index) => {
        if (offset === blockPosition) blockIndex = index;
      });
      return {
        block: resolved.node(depth),
        blockIndex,
        blockPosition,
        contentStart: resolved.start(depth),
        contentEnd: resolved.end(depth),
      };
    }
  }
  return null;
}

export function moveTrailingContent(editor, direction) {
  const { state, view } = editor;
  const { selection } = state;
  let transaction = state.tr;
  let cursor = selection.from;

  if (!selection.empty) {
    transaction = transaction.deleteSelection();
    cursor = transaction.mapping.map(selection.from);
  }

  const active = findActiveBlock(transaction.doc, cursor);
  if (!active) return false;
  const targetIndex = active.blockIndex + direction;
  if (direction < 0 && targetIndex < 0) return false;

  const trailing = transaction.doc.slice(cursor, active.contentEnd).content;
  transaction.delete(cursor, active.contentEnd);

  const currentNode = transaction.doc.child(active.blockIndex);
  const currentPosition = active.blockPosition;

  const countBoundaryBreaks = (content, fromStart) => {
    let count = 0;
    for (let offset = 0; offset < content.childCount; offset += 1) {
      const index = fromStart ? offset : content.childCount - 1 - offset;
      if (content.child(index).type.name !== "hardBreak") break;
      count += 1;
    }
    return count;
  };

  const createBlankLineSeparator = (leftContent, rightContent) => {
    if (!leftContent.size || !rightContent.size) return Fragment.empty;
    const existingBreaks =
      countBoundaryBreaks(leftContent, false) +
      countBoundaryBreaks(rightContent, true);
    const missingBreaks = Math.max(0, 2 - existingBreaks);
    return Fragment.fromArray(
      Array.from(
        { length: missingBreaks },
        () => state.schema.nodes.hardBreak.create(),
      ),
    );
  };

  if (direction > 0) {
    const nextIndex = active.blockIndex + 1;
    if (nextIndex < transaction.doc.childCount) {
      const nextPosition = currentPosition + currentNode.nodeSize;
      const nextContent = transaction.doc.child(nextIndex).content;
      const separator = createBlankLineSeparator(trailing, nextContent);
      transaction.insert(nextPosition + 1, trailing.append(separator));
      transaction.setSelection(TextSelection.near(transaction.doc.resolve(nextPosition + 1), 1));
    } else {
      const nextBlock = state.schema.nodes.songBlock.create(
        { id: `block-${Date.now()}`, align: active.block.attrs.align, level: 0 },
        trailing,
      );
      const insertionPosition = currentPosition + currentNode.nodeSize;
      transaction.insert(insertionPosition, nextBlock);
      transaction.setSelection(TextSelection.near(transaction.doc.resolve(insertionPosition + 1), 1));
    }
  } else {
    const previousNode = transaction.doc.child(targetIndex);
    let previousPosition = 0;
    for (let index = 0; index < targetIndex; index += 1) {
      previousPosition += transaction.doc.child(index).nodeSize;
    }
    const insertionPosition = previousPosition + previousNode.nodeSize - 1;
    const separator = createBlankLineSeparator(previousNode.content, trailing);
    transaction.insert(insertionPosition, separator.append(trailing));
    transaction.setSelection(
      TextSelection.near(
        transaction.doc.resolve(insertionPosition + separator.size),
        1,
      ),
    );
  }

  view.dispatch(transaction.scrollIntoView());
  return true;
}

export function navigateToAdjacentBlock(editor, direction) {
  const { state, view } = editor;
  const active = findActiveBlock(state.doc, state.selection.from);
  if (!active) return false;
  const targetIndex = active.blockIndex + direction;
  if (targetIndex < 0 || targetIndex >= state.doc.childCount) return false;

  let targetPosition = 0;
  for (let index = 0; index < targetIndex; index += 1) {
    targetPosition += state.doc.child(index).nodeSize;
  }
  const targetNode = state.doc.child(targetIndex);
  const position = direction < 0
    ? targetPosition + targetNode.nodeSize - 1
    : targetPosition + 1;
  view.dispatch(
    state.tr.setSelection(TextSelection.near(state.doc.resolve(position), direction)).scrollIntoView(),
  );
  view.focus();
  return true;
}

export function handlePresentationEditorKeyDown(editor, event, _layout) {
  const hasSystemModifier = event.ctrlKey || event.metaKey || event.altKey;

  if (event.key === "Tab" && !event.shiftKey && !hasSystemModifier) {
    event.preventDefault();
    return editor.commands.insertContent("\t");
  }

  if (event.key === "Enter" && event.shiftKey && !hasSystemModifier) {
    event.preventDefault();
    return moveTrailingContent(editor, 1);
  }

  if (event.key === "Backspace" && event.shiftKey && !hasSystemModifier) {
    event.preventDefault();
    return moveTrailingContent(editor, -1);
  }

  if (event.shiftKey || hasSystemModifier) return false;

  if (event.key === "Enter") {
    event.preventDefault();
    return editor.commands.setHardBreak();
  }

  // Arrow keys deliberately fall through to ProseMirror/the browser. Custom
  // block navigation made the caret jump or become stuck near chords and at
  // block boundaries, unlike a conventional document editor.
  return false;
}

export function createPresentationEditorExtensions() {
  return [
    PresentationDocument,
    SongBlock,
    ChordMark,
    ChordBracket,
    TablatureLine,
    ChordRecognition,
    FontSize,
    TextColor,
    Underline,
    StarterKit.configure({
      document: false,
      paragraph: false,
      heading: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
      horizontalRule: false,
    }),
  ];
}
