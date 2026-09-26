import {
  BRACKETED_CHORD_PATTERN,
  ChordParser,
  findBareChordMatches,
  getBassTabStringLabel,
  isTablatureBlock,
  isTablatureLine,
  isTablatureTechniqueLine,
} from "./ChordParser";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "../../helpers/presentationConstants";
import { sanitizeCifraContent } from "../../helpers/sanitizeCifraContent";

export const TIPTAP_DOCUMENT_VERSION = 1;

const normalizeLineEndings = (value = "") =>
  sanitizeCifraContent(value).replace(/\u00a0/g, " ");

const createChordMarks = (raw, chordId) => {
  const chord = ChordParser.parse(raw);
  if (!chord) return null;
  return {
    chord: { type: "chord", attrs: { ...chord, chordId } },
    bracket: { type: "chordBracket" },
  };
};

function collectChordRanges(line = "") {
  const explicitRanges = Array.from(
    line.matchAll(new RegExp(
      BRACKETED_CHORD_PATTERN.source,
      BRACKETED_CHORD_PATTERN.flags,
    )),
  ).flatMap((match) => {
    const raw = String(match[1] || "").trim();
    if (!ChordParser.isChord(raw)) return [];
    const rawStart = match.index + match[0].indexOf(raw);
    return [{
      type: "explicit",
      raw,
      start: match.index,
      end: match.index + match[0].length,
      rawStart,
      rawEnd: rawStart + raw.length,
    }];
  });
  const bareRanges = findBareChordMatches(line).map((match) => ({
    type: "bare",
    raw: match.raw,
    start: match.start,
    end: match.end,
    rawStart: match.start,
    rawEnd: match.end,
  }));

  return [...explicitRanges, ...bareRanges].sort((a, b) => a.start - b.start);
}

function withoutRecognitionMarks(marks = []) {
  return marks.filter(
    (mark) => !["chord", "chordBracket", "tablatureLine"].includes(mark?.type),
  );
}

const TABLATURE_LINE_MARK = { type: "tablatureLine" };

function sliceLineNodes(lineNodes, start, end, extraMark = null) {
  if (end <= start) return [];
  const result = [];
  let offset = 0;

  lineNodes.forEach((node) => {
    if (node?.type !== "text") return;
    const nodeStart = offset;
    const nodeEnd = nodeStart + (node.text?.length || 0);
    offset = nodeEnd;
    const sliceStart = Math.max(start, nodeStart);
    const sliceEnd = Math.min(end, nodeEnd);
    if (sliceEnd <= sliceStart) return;

    const marks = withoutRecognitionMarks(node.marks || []);
    if (extraMark) marks.push(extraMark);
    result.push({
      ...node,
      text: node.text.slice(sliceStart - nodeStart, sliceEnd - nodeStart),
      marks: marks.length ? marks : undefined,
    });
  });

  return result;
}

function marksAtOffset(lineNodes, targetOffset) {
  let offset = 0;
  for (const node of lineNodes) {
    if (node?.type !== "text") continue;
    const end = offset + (node.text?.length || 0);
    if (targetOffset >= offset && targetOffset <= end) {
      return withoutRecognitionMarks(node.marks || []);
    }
    offset = end;
  }
  return [];
}

function decorateLineContent(lineNodes, blockIndex, lineIndex) {
  const line = lineNodes.map((node) => node?.text || "").join("");
  if (isTablatureLine(line)) {
    const normalizedLine = line.replace(
      /^(\s*)\[\s*([EADGBeB](?:#|b)?)\s*\]/,
      "$1$2",
    );
    if (normalizedLine !== line) {
      return normalizedLine
        ? [{ type: "text", text: normalizedLine, marks: [TABLATURE_LINE_MARK] }]
        : [];
    }
    return lineNodes.map((node) => {
      if (node?.type !== "text") return node;
      const marks = withoutRecognitionMarks(node.marks || []);
      marks.push(TABLATURE_LINE_MARK);
      return { ...node, marks };
    });
  }
  const ranges = collectChordRanges(line);
  if (!ranges.length) return lineNodes;

  const content = [];
  let cursor = 0;
  ranges.forEach((range) => {
    content.push(...sliceLineNodes(lineNodes, cursor, range.start));
    const marks = createChordMarks(
      range.raw,
      `chord-${blockIndex}-${lineIndex}-${range.start}`,
    );
    if (!marks) return;

    if (range.type === "bare") {
      const inheritedMarks = marksAtOffset(lineNodes, range.start);
      content.push({
        type: "text",
        text: "[",
        marks: [...inheritedMarks, marks.bracket],
      });
      content.push(...sliceLineNodes(
        lineNodes,
        range.rawStart,
        range.rawEnd,
        marks.chord,
      ));
      content.push({
        type: "text",
        text: "]",
        marks: [...inheritedMarks, marks.bracket],
      });
    } else {
      content.push(...sliceLineNodes(
        lineNodes,
        range.start,
        range.rawStart,
        marks.bracket,
      ));
      content.push(...sliceLineNodes(
        lineNodes,
        range.rawStart,
        range.rawEnd,
        marks.chord,
      ));
      content.push(...sliceLineNodes(
        lineNodes,
        range.rawEnd,
        range.end,
        marks.bracket,
      ));
    }
    cursor = range.end;
  });
  content.push(...sliceLineNodes(lineNodes, cursor, line.length));
  return content;
}

function decorateInlineContent(content = [], blockIndex = 0) {
  const decorated = [];
  let lineNodes = [];
  let lineIndex = 0;

  const flushLine = () => {
    decorated.push(...decorateLineContent(lineNodes, blockIndex, lineIndex));
    lineNodes = [];
    lineIndex += 1;
  };

  content.forEach((node) => {
    if (node?.type === "hardBreak") {
      flushLine();
      decorated.push(node);
    } else {
      lineNodes.push(node);
    }
  });
  flushLine();
  return decorated;
}

function createInlineContent(text = "", blockIndex = 0) {
  const content = [];
  normalizeLineEndings(text).split("\n").forEach((line, lineIndex) => {
    if (lineIndex > 0) content.push({ type: "hardBreak" });
    if (line) content.push({ type: "text", text: line });
  });
  return decorateInlineContent(content, blockIndex);
}

function isBassTabGroupAt(lines, startIndex) {
  return ["G", "D", "A", "E"].every(
    (label, offset) => getBassTabStringLabel(lines[startIndex + offset]) === label,
  );
}

function normalizeBassTabContinuationSpacing(value = "") {
  const lines = String(value || "").split("\n");
  const normalized = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim()) {
      normalized.push(lines[index]);
      continue;
    }

    let nextIndex = index;
    while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex += 1;
    const previousTechniqueIndex = normalized.length - 1;
    const previousGroupStart = previousTechniqueIndex - 4;
    const joinsBassContinuation =
      previousGroupStart >= 0 &&
      isTablatureTechniqueLine(normalized[previousTechniqueIndex]) &&
      isBassTabGroupAt(normalized, previousGroupStart) &&
      isBassTabGroupAt(lines, nextIndex);

    if (joinsBassContinuation) {
      index = nextIndex - 1;
      continue;
    }

    normalized.push(...lines.slice(index, nextIndex));
    index = nextIndex - 1;
  }

  return normalized.join("\n");
}

function splitLegacyBlocks(value = "") {
  const normalized = normalizeBassTabContinuationSpacing(normalizeLineEndings(value));
  if (!normalized) return [""];

  return normalized
    .split(new RegExp(`\\n?${PRESENTATION_COLUMN_BREAK_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "g"))
    .flatMap((column) => column.split(/\n{2,}/))
    .map((block) => block.replace(/^\n|\n$/g, ""))
    .filter((block, index, blocks) => block !== "" || blocks.length === 1);
}

function hasMark(node, markName) {
  return Array.isArray(node?.marks) &&
    node.marks.some((mark) => mark?.type === markName);
}

function migrateInlineContent(content = []) {
  return content.flatMap((node, index) => {
    if (node?.type !== "chord") return node;
    const raw = node.attrs?.raw || "";
    const marks = createChordMarks(raw, node.attrs?.chordId || `chord-migrated-${index}`);
    if (!marks) return { type: "text", text: raw };
    return [
      { type: "text", text: "[", marks: [marks.bracket] },
      { type: "text", text: raw, marks: [marks.chord] },
      { type: "text", text: "]", marks: [marks.bracket] },
    ];
  });
}

function migrateDocument(document) {
  const migrated = {
    ...document,
    content: document.content.map((block, blockIndex) => {
      const content = decorateInlineContent(
        migrateInlineContent(block.content || []),
        blockIndex,
      );
      const blockText = serializeInlineContent(content, {
        includeChordBrackets: true,
      });
      return {
        ...block,
        attrs: {
          ...block.attrs,
          tablature: isTablatureBlock(blockText),
        },
        content,
      };
    }),
  };

  const mergedContent = [];
  migrated.content.forEach((block) => {
    const previous = mergedContent[mergedContent.length - 1];
    if (!previous) {
      mergedContent.push(block);
      return;
    }

    const previousText = serializeInlineContent(previous.content, {
      includeChordBrackets: true,
    });
    const currentText = serializeInlineContent(block.content, {
      includeChordBrackets: true,
    });
    const previousLines = previousText.split("\n");
    const currentLines = currentText.split("\n");
    const techniqueIndex = previousLines.length - 1;
    const mergesBassContinuation =
      techniqueIndex >= 4 &&
      isTablatureTechniqueLine(previousLines[techniqueIndex]) &&
      isBassTabGroupAt(previousLines, techniqueIndex - 4) &&
      isBassTabGroupAt(currentLines, 0);

    if (!mergesBassContinuation) {
      mergedContent.push(block);
      return;
    }

    mergedContent[mergedContent.length - 1] = {
      ...previous,
      attrs: { ...previous.attrs, tablature: true },
      content: [
        ...(previous.content || []),
        { type: "hardBreak" },
        ...(block.content || []),
      ],
    };
  });

  return { ...migrated, content: mergedContent };
}

function serializeInlineContent(content = [], { includeChordBrackets = false } = {}) {
  return content
    .map((node) => {
      if (node.type === "text") {
        if (!includeChordBrackets && hasMark(node, "chordBracket")) return "";
        return node.text || "";
      }
      if (node.type === "hardBreak") return "\n";
      if (node.type === "chord") {
        return includeChordBrackets
          ? `[${node.attrs?.raw || ""}]`
          : node.attrs?.raw || "";
      }
      return "";
    })
    .join("");
}

export class CifraDocumentModel {
  static isValidDocument(value) {
    return (
      value?.type === "doc" &&
      Array.isArray(value.content) &&
      value.content.every((node) => node?.type === "songBlock")
    );
  }

  static fromLegacyText(value = "") {
    return {
      type: "doc",
      content: splitLegacyBlocks(value).map((block, index) => ({
        type: "songBlock",
        attrs: {
          id: `block-${index + 1}`,
          align: "left",
          level: 0,
          tablature: isTablatureBlock(block),
        },
        content: createInlineContent(block, index),
      })),
    };
  }

  static normalize(document, legacyText = "") {
    if (!this.isValidDocument(document)) return this.fromLegacyText(legacyText);

    const migrated = migrateDocument(document);
    const structuredText = migrated.content
      .map((block) => serializeInlineContent(block.content, {
        includeChordBrackets: true,
      }))
      .join("\n\n");
    const sanitizedText = sanitizeCifraContent(structuredText);

    return sanitizedText === structuredText
      ? migrated
      : this.fromLegacyText(sanitizedText);
  }

  static toLegacyText(
    document,
    { horizontal = false, includeChordBrackets = false } = {},
  ) {
    const normalized = this.normalize(document);
    const separator = horizontal
      ? `\n${PRESENTATION_COLUMN_BREAK_MARKER}\n`
      : "\n\n";

    return normalized.content
      .map((block) =>
        serializeInlineContent(block.content, { includeChordBrackets }),
      )
      .join(separator)
      .trimEnd();
  }

  static toPersistedDocument(document) {
    return {
      version: TIPTAP_DOCUMENT_VERSION,
      document: this.normalize(document),
    };
  }

  static fromPersistedDocument(value, legacyText = "") {
    const document = value?.document || value;
    return this.normalize(document, legacyText);
  }
}
