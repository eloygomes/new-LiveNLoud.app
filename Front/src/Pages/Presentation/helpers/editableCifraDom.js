import { PRESENTATION_COLUMN_BREAK_MARKER } from "./presentationConstants";

const EDITABLE_LINE_SELECTOR =
  ".presentation-render-content-block pre, .presentation-render-content-block p, .presentation-render-content-block > div";
const MOVABLE_LINE_SELECTOR = "pre, p";
const ZERO_WIDTH_CHARACTERS_REGEX = /[\u200b\u200c\u200d\u2060\ufeff]/g;
const EDITABLE_BRACKETED_CHORD_REGEX = /\[\s*([^\]]+?)\s*\]/g;
const SECTION_LINE_CLASSES = new Set([
  "intro",
  "chorus",
  "verse",
  "solo",
  "bridge",
  "section",
]);

function sanitizeEditableText(text = "") {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(ZERO_WIDTH_CHARACTERS_REGEX, "");
}

function isRenderedSectionLabelLine(node, text = "") {
  if (!/^\s*\[[^\]]+\]\s*$/.test(text)) return false;

  const bracketContent = text.replace(/^\s*\[|\]\s*$/g, "").toLowerCase();
  if (
    /\b(intro|verse|parte|chorus|refr[aã]o|solo|bridge|ponte)\b/.test(
      bracketContent,
    )
  ) {
    return true;
  }

  if (!node?.classList) return false;

  return Array.from(node.classList).some((className) =>
    SECTION_LINE_CLASSES.has(className),
  );
}

function normalizeEditedLineText(node, text = "") {
  const sanitizedText = sanitizeEditableText(text).replace(/^\n+/, "");

  if (isRenderedSectionLabelLine(node, sanitizedText)) {
    return sanitizedText;
  }

  return sanitizedText.replace(
    EDITABLE_BRACKETED_CHORD_REGEX,
    (match, chord, offset, fullText) => {
      const normalizedChord = String(chord || "").trim();
      const previousCharacter = fullText[offset - 1] || "";
      const nextCharacter = fullText[offset + match.length] || "";
      const needsLeadingSpace =
        previousCharacter !== "" && !/[\s([\]]/.test(previousCharacter);
      const needsTrailingSpace = nextCharacter === "[";
      const needsLineBreak =
        !needsTrailingSpace &&
        nextCharacter !== "" &&
        !/[\s\])]/.test(nextCharacter);

      return `${needsLeadingSpace ? " " : ""}[${normalizedChord}]${
        needsLineBreak ? "\n" : needsTrailingSpace ? " " : ""
      }`;
    },
  );
}

function getEditableNodeStructuredText(node) {
  if (!node) return "";

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return node.textContent || "";
  }

  if (
    node.classList?.contains("notespresentation") &&
    node.dataset?.chord
  ) {
    const chordText = sanitizeEditableText(node.textContent || "").trim();
    const normalizedChordText = chordText.replace(/^\[|\]$/g, "");
    if (!normalizedChordText.trim()) return "";
    return `[${normalizedChordText}]`;
  }

  return Array.from(node.childNodes || [])
    .map((childNode) => getEditableNodeStructuredText(childNode))
    .join("");
}

function getEditableNodeText(node) {
  const structuredText = getEditableNodeStructuredText(node);
  if (structuredText) return structuredText;

  if (typeof node?.innerText === "string" && node.innerText !== "") {
    return node.innerText;
  }

  return node?.textContent || "";
}

function readEditableBlockText(block) {
  if (!block) return "";

  const lineNodes = Array.from(block.querySelectorAll("pre, p, div")).filter(
    (node) => {
      if (!block.contains(node) || node === block) return false;

      const tagName = node.tagName?.toLowerCase();
      if (node.parentElement?.closest("pre, p")) return false;
      if (tagName === "pre" || tagName === "p") return true;
      if (tagName !== "div") return false;

      return !node.querySelector("pre, p, div");
    },
  );

  if (lineNodes.length) {
    return lineNodes
      .map((node) => normalizeEditedLineText(node, getEditableNodeText(node)))
      .join("\n");
  }

  const rawText = getEditableNodeText(block);
  return normalizeEditedLineText(block, rawText).trimEnd();
}

function hasPreservedBlankLine(block) {
  return Boolean(block.querySelector(".presentation-blank-line"));
}

function hasMeaningfulEditableText(text = "") {
  return sanitizeEditableText(text).trim() !== "";
}

function getEditableContentBlocks(contentNode) {
  if (!contentNode) return [];
  return Array.from(
    contentNode.querySelectorAll(".presentation-render-content-block"),
  );
}

export function compactEmptyEditableBlocks(contentNode) {
  // The editor may freely change content inside each render block, but it must
  // not remove React-owned presentation-column/render-block wrappers. React
  // will reconcile those wrappers later, and removing them here can trigger
  // DOM removeChild errors during the next render.
  void contentNode;
  return false;
}

function getContentBlockKeys(block) {
  return (block?.dataset?.blockKeys || block?.dataset?.blockKey || "")
    .split(",")
    .map((blockKey) => blockKey.trim())
    .filter(Boolean);
}

function hasExplicitColumnBreakBetween({
  previousBlockKeys = [],
  nextBlockKeys = [],
  sourceBlocks = [],
}) {
  if (!previousBlockKeys.length || !nextBlockKeys.length || !sourceBlocks.length) {
    return false;
  }

  const previousKeySet = new Set(previousBlockKeys);
  const nextKeySet = new Set(nextBlockKeys);
  const previousIndex = sourceBlocks.findLastIndex((block) =>
    previousKeySet.has(block.blockKey),
  );
  const nextIndex = sourceBlocks.findIndex((block) =>
    nextKeySet.has(block.blockKey),
  );

  if (previousIndex < 0 || nextIndex < 0 || previousIndex >= nextIndex) {
    return false;
  }

  return sourceBlocks
    .slice(previousIndex + 1, nextIndex)
    .some((block) => block.isColumnBreak);
}

function serializeEditableBlocks(
  contentBlocks,
  {
    preserveColumnBreaks = false,
    persistVisualColumnBreaks = false,
    sourceBlocks = [],
  } = {},
) {
  const blocks = contentBlocks
    .map((block) => ({
      text: readEditableBlockText(block),
      hasPreservedBlankLine: hasPreservedBlankLine(block),
      blockKeys: getContentBlockKeys(block),
    }))
    .filter((block) =>
      persistVisualColumnBreaks
        ? hasMeaningfulEditableText(block.text)
        : hasMeaningfulEditableText(block.text) || block.hasPreservedBlankLine,
    )
    .map((block) => block);

  // Layout contract: in horizontal editing mode, the visible editor columns are
  // intentional user layout and must be serialized as column-break markers.
  // Empty visual columns are explicitly discarded before markers are written,
  // so the next non-empty column shifts left instead of saving a blank page.
  // Outside that mode, never serialize automatic render columns as manual breaks.
  // Changing this will make saved cifras move to different columns after reload.
  return blocks.reduce((serialized, block, index) => {
    if (index === 0) return block.text;

    const previousBlock = blocks[index - 1];
    const separator =
      preserveColumnBreaks &&
      (persistVisualColumnBreaks ||
        hasExplicitColumnBreakBetween({
          previousBlockKeys: previousBlock.blockKeys,
          nextBlockKeys: block.blockKeys,
          sourceBlocks,
        }))
        ? `\n${PRESENTATION_COLUMN_BREAK_MARKER}\n`
        : "\n";

    return `${serialized}${separator}${block.text}`;
  }, "").trimEnd();
}

export function collectEditedCifraModelFromNode({
  contentNode,
  fallbackCifra = "",
  excludedBlockKeys = [],
  preserveColumnBreaks = false,
  persistVisualColumnBreaks = false,
  sourceBlocks = [],
}) {
  compactEmptyEditableBlocks(contentNode);

  const excludedKeys = new Set(excludedBlockKeys);
  const contentBlocks = getEditableContentBlocks(contentNode).filter((block) => {
    if (!excludedKeys.size) return true;

    const blockKeys = (block.dataset.blockKeys || block.dataset.blockKey || "")
      .split(",")
      .map((blockKey) => blockKey.trim())
      .filter(Boolean);

    return !blockKeys.some((blockKey) => excludedKeys.has(blockKey));
  });

  const modelType = persistVisualColumnBreaks
    ? "expanded-columns"
    : "standard-linear";

  if (!contentBlocks.length) {
    return {
      text: fallbackCifra,
      type: modelType,
      preserveColumnBreaks,
      persistVisualColumnBreaks,
    };
  }

  return {
    text: serializeEditableBlocks(contentBlocks, {
      preserveColumnBreaks,
      persistVisualColumnBreaks,
      sourceBlocks,
    }),
    type: modelType,
    preserveColumnBreaks,
    persistVisualColumnBreaks,
  };
}

export function collectEditedPresentationBlocksFromNode(args) {
  return collectEditedCifraModelFromNode(args).text;
}

export function removeEmptyEditableLine(event) {
  if (event.key !== "Backspace" && event.key !== "Delete") return false;

  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) return false;

  const targetBlock = event.currentTarget;
  const range = selection.getRangeAt(0);
  const anchorNode = selection.anchorNode;
  const anchorElement =
    anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
  if (!anchorElement || !targetBlock.contains(anchorElement)) return false;

  const selectedText = selection.toString().replace(/\u00a0/g, " ");
  const selectedEmptyElement =
    !selection.isCollapsed &&
    Array.from(targetBlock.querySelectorAll(EDITABLE_LINE_SELECTOR)).find(
      (node) => {
        if (!selection.containsNode(node, true)) return false;
        return (node.innerText || node.textContent || "").trim() === "";
      },
    );

  const currentLineElement = anchorElement.closest(EDITABLE_LINE_SELECTOR);
  const currentLineText =
    currentLineElement && currentLineElement !== targetBlock
      ? currentLineElement.innerText || currentLineElement.textContent || ""
      : "";

  const lineToRemove =
    selectedEmptyElement ||
    (currentLineElement &&
    currentLineElement !== targetBlock &&
    currentLineText.trim() === ""
      ? currentLineElement
      : null);

  if (lineToRemove && targetBlock.contains(lineToRemove)) {
    event.preventDefault();
    lineToRemove.remove();
    targetBlock.focus();
    return true;
  }

  if (!selection.isCollapsed && selectedText.trim() === "") {
    event.preventDefault();
    range.deleteContents();
    targetBlock.focus();
    return true;
  }

  return false;
}

export function deleteSelectedEditableContent(event) {
  if (event.key !== "Backspace" && event.key !== "Delete") return false;

  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }

  const targetBlock = event.currentTarget;
  const contentBlocks = getEditableContentBlocks(targetBlock);
  const selectedIndexes = getRangeBlockIndexes(contentBlocks, selection);

  if (selectedIndexes && selectedIndexes.endIndex > selectedIndexes.startIndex) {
    event.preventDefault();
    event.stopPropagation();

    for (
      let blockIndex = selectedIndexes.startIndex;
      blockIndex <= selectedIndexes.endIndex;
      blockIndex += 1
    ) {
      contentBlocks[blockIndex]?.replaceChildren();
    }

    compactEmptyEditableBlocks(targetBlock);

    const updatedBlocks = getEditableContentBlocks(targetBlock);
    const focusBlock =
      updatedBlocks[Math.min(selectedIndexes.startIndex, updatedBlocks.length - 1)];
    focusEditableBlockStart(focusBlock);
    return true;
  }

  const range = selection.getRangeAt(0);
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  const anchorElement =
    anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
  const focusElement =
    focusNode instanceof HTMLElement ? focusNode : focusNode?.parentElement;

  if (
    !anchorElement ||
    !focusElement ||
    !targetBlock.contains(anchorElement) ||
    !targetBlock.contains(focusElement)
  ) {
    return false;
  }

  event.preventDefault();
  range.deleteContents();
  selection.removeAllRanges();
  selection.addRange(range);
  pruneEmptyLayoutContainers(targetBlock);
  compactEmptyEditableBlocks(targetBlock);
  targetBlock.focus?.({ preventScroll: true });
  return true;
}

export function replaceSelectedEditableContentWithText(event) {
  if (
    event.isComposing ||
    event.key?.length !== 1 ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return false;
  }

  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }

  const targetBlock = event.currentTarget;
  const contentBlocks = getEditableContentBlocks(targetBlock);
  const selectedIndexes = getRangeBlockIndexes(contentBlocks, selection);
  if (!selectedIndexes) return false;

  if (selectedIndexes.endIndex <= selectedIndexes.startIndex) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  for (
    let blockIndex = selectedIndexes.startIndex;
    blockIndex <= selectedIndexes.endIndex;
    blockIndex += 1
  ) {
    contentBlocks[blockIndex]?.replaceChildren();
  }

  replaceEditableBlockText(contentBlocks[selectedIndexes.startIndex], event.key);
  compactEmptyEditableBlocks(targetBlock);

  const updatedBlocks = getEditableContentBlocks(targetBlock);
  const focusBlock =
    updatedBlocks[Math.min(selectedIndexes.startIndex, updatedBlocks.length - 1)];
  focusEditableBlockEnd(focusBlock);
  return true;
}

function focusEditableBlockStart(contentBlock) {
  if (!contentBlock) return false;

  const selection = window.getSelection?.();
  if (!selection) return false;

  const ownerDocument = contentBlock.ownerDocument || document;
  const range = ownerDocument.createRange();
  const textWalker = ownerDocument.createTreeWalker(
    contentBlock,
    window.NodeFilter?.SHOW_TEXT ?? 4,
  );
  let firstTextNode = textWalker.nextNode();

  while (firstTextNode && firstTextNode.textContent === "") {
    firstTextNode = textWalker.nextNode();
  }

  if (firstTextNode) {
    range.setStart(firstTextNode, 0);
  } else {
    range.setStart(contentBlock, 0);
  }

  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  contentBlock
    .closest(".presentation-content-flow")
    ?.focus({ preventScroll: true });
  contentBlock.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  return true;
}

function focusEditableBlockEnd(contentBlock) {
  if (!contentBlock) return false;

  const selection = window.getSelection?.();
  if (!selection) return false;

  const ownerDocument = contentBlock.ownerDocument || document;
  const range = ownerDocument.createRange();
  const textWalker = ownerDocument.createTreeWalker(
    contentBlock,
    window.NodeFilter?.SHOW_TEXT ?? 4,
  );
  let lastTextNode = null;
  let currentTextNode = textWalker.nextNode();

  while (currentTextNode) {
    if (currentTextNode.textContent !== "") {
      lastTextNode = currentTextNode;
    }
    currentTextNode = textWalker.nextNode();
  }

  if (lastTextNode) {
    range.setStart(lastTextNode, lastTextNode.textContent.length);
  } else {
    range.selectNodeContents(contentBlock);
  }

  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  contentBlock
    .closest(".presentation-content-flow")
    ?.focus({ preventScroll: true });
  contentBlock.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  return true;
}

function fragmentHasText(fragment) {
  return sanitizeEditableText(fragment?.textContent || "").length > 0;
}

function removeWhitespaceTextSeparators(node) {
  if (!node) return;
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    ["pre", "p"].includes(node.tagName?.toLowerCase())
  ) {
    return;
  }

  Array.from(node.childNodes || []).forEach((childNode) => {
    const parentTagName = childNode.parentElement?.tagName?.toLowerCase();
    if (["pre", "p"].includes(parentTagName)) return;

    if (
      childNode.nodeType === Node.TEXT_NODE &&
      sanitizeEditableText(childNode.textContent || "").trim() === ""
    ) {
      childNode.remove();
      return;
    }

    if (childNode.nodeType === Node.ELEMENT_NODE) {
      removeWhitespaceTextSeparators(childNode);
    }
  });
}

function blockHasOverflow(contentBlock) {
  if (!contentBlock) return false;
  return contentBlock.scrollHeight > contentBlock.clientHeight + 1;
}

function getLastMovableLineNode(contentBlock) {
  if (!contentBlock) return null;

  const lineElements = Array.from(
    contentBlock.querySelectorAll(MOVABLE_LINE_SELECTOR),
  ).filter((node) => contentBlock.contains(node));

  if (lineElements.length) {
    return lineElements[lineElements.length - 1];
  }

  return Array.from(contentBlock.childNodes)
    .reverse()
    .find((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent || "").length > 0;
      }
      return node.nodeType === Node.ELEMENT_NODE;
    });
}

function pruneEmptyLayoutContainers(contentBlock) {
  if (!contentBlock) return;

  Array.from(contentBlock.querySelectorAll("div"))
    .reverse()
    .forEach((node) => {
      if (node.children.length === 0 && (node.textContent || "") === "") {
        node.remove();
      }
    });
}

function prependMovedLine(targetBlock, lineNode) {
  if (!targetBlock || !lineNode) return;

  targetBlock.insertBefore(lineNode, targetBlock.firstChild);
}

function rebalanceOverflowToRight(contentBlocks, startIndex) {
  for (
    let blockIndex = Math.max(0, startIndex);
    blockIndex < contentBlocks.length;
    blockIndex += 1
  ) {
    const sourceBlock = contentBlocks[blockIndex];
    let guard = 0;

    while (blockHasOverflow(sourceBlock) && guard < 200) {
      const targetBlock = contentBlocks[blockIndex + 1];
      const lineNode = getLastMovableLineNode(sourceBlock);
      if (!lineNode || !targetBlock) break;

      prependMovedLine(targetBlock, lineNode);
      pruneEmptyLayoutContainers(sourceBlock);
      guard += 1;
    }
  }
}

function createPlainEditableLine(ownerDocument, lineText) {
  const lineNode = ownerDocument.createElement("pre");
  lineNode.className = "mt-1 presentation-lyrics";
  lineNode.textContent = lineText;
  return lineNode;
}

function createPlainEditableFragment(ownerDocument, text) {
  const fragment = ownerDocument.createDocumentFragment();
  String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .forEach((line) => {
      fragment.appendChild(createPlainEditableLine(ownerDocument, line));
    });
  return fragment;
}

function replaceEditableBlockText(contentBlock, text) {
  if (!contentBlock) return;
  const ownerDocument = contentBlock.ownerDocument || document;
  contentBlock.replaceChildren(createPlainEditableFragment(ownerDocument, text));
}

function getSelectionBlockIndexes(contentBlocks, selection) {
  if (!selection || selection.rangeCount === 0) return null;

  const anchorIndex = contentBlocks.findIndex((block) =>
    block.contains(selection.anchorNode),
  );
  const focusIndex = contentBlocks.findIndex((block) =>
    block.contains(selection.focusNode),
  );

  if (anchorIndex < 0 || focusIndex < 0) return null;

  return {
    startIndex: Math.min(anchorIndex, focusIndex),
    endIndex: Math.max(anchorIndex, focusIndex),
  };
}

function getRangeBlockIndexes(contentBlocks, selection) {
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const selectedIndexes = contentBlocks
    .map((block, index) => {
      try {
        return range.intersectsNode(block) ? index : -1;
      } catch {
        return -1;
      }
    })
    .filter((index) => index >= 0);

  if (!selectedIndexes.length) return null;

  return {
    startIndex: Math.min(...selectedIndexes),
    endIndex: Math.max(...selectedIndexes),
  };
}

export function selectAllEditableContent(event) {
  if (
    event.key?.toLowerCase() !== "a" ||
    event.shiftKey ||
    event.altKey ||
    (!event.metaKey && !event.ctrlKey)
  ) {
    return false;
  }

  const targetBlock = event.currentTarget;
  const contentBlocks = getEditableContentBlocks(targetBlock);
  if (!contentBlocks.length) return false;

  const selection = window.getSelection?.();
  if (!selection) return false;

  const ownerDocument = targetBlock.ownerDocument || document;
  const range = ownerDocument.createRange();
  range.setStartBefore(contentBlocks[0]);
  range.setEndAfter(contentBlocks[contentBlocks.length - 1]);

  event.preventDefault();
  event.stopPropagation();
  selection.removeAllRanges();
  selection.addRange(range);
  targetBlock.focus?.({ preventScroll: true });
  return true;
}

export function pasteEditableContentAcrossBlocks(event) {
  const clipboardText = event.clipboardData?.getData("text/plain");
  if (typeof clipboardText !== "string" || clipboardText === "") return false;

  const targetBlock = event.currentTarget;
  const contentBlocks = getEditableContentBlocks(targetBlock);
  if (!contentBlocks.length) return false;

  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) return false;

  const selectedIndexes =
    getSelectionBlockIndexes(contentBlocks, selection) ||
    getRangeBlockIndexes(contentBlocks, selection);
  const ownerDocument = targetBlock.ownerDocument || document;
  let insertionIndex = selectedIndexes?.startIndex ?? 0;

  event.preventDefault();
  event.stopPropagation();

  if (selectedIndexes && selectedIndexes.endIndex > selectedIndexes.startIndex) {
    for (
      let blockIndex = selectedIndexes.startIndex;
      blockIndex <= selectedIndexes.endIndex;
      blockIndex += 1
    ) {
      contentBlocks[blockIndex]?.replaceChildren();
    }
    replaceEditableBlockText(contentBlocks[insertionIndex], clipboardText);
  } else {
    const range = selection.getRangeAt(0);
    const anchorIndex = contentBlocks.findIndex((block) =>
      block.contains(selection.anchorNode),
    );
    insertionIndex = anchorIndex >= 0 ? anchorIndex : insertionIndex;

    if (contentBlocks[insertionIndex]?.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(createPlainEditableFragment(ownerDocument, clipboardText));
    } else {
      replaceEditableBlockText(contentBlocks[insertionIndex], clipboardText);
    }
  }

  rebalanceOverflowToRight(getEditableContentBlocks(targetBlock), insertionIndex);
  compactEmptyEditableBlocks(targetBlock);

  const updatedBlocks = getEditableContentBlocks(targetBlock);
  const focusBlock = updatedBlocks[Math.min(insertionIndex, updatedBlocks.length - 1)];
  focusEditableBlockEnd(focusBlock);
  return true;
}

function moveTrailingContentToBlockStart({
  currentContentBlock,
  nextContentBlock,
  selection,
}) {
  if (
    !currentContentBlock ||
    !nextContentBlock ||
    !selection ||
    selection.rangeCount === 0
  ) {
    return false;
  }

  const ownerDocument = currentContentBlock.ownerDocument || document;
  const range = selection.getRangeAt(0);

  if (!selection.isCollapsed) {
    range.deleteContents();
    range.collapse(true);
  }

  const trailingRange = range.cloneRange();
  trailingRange.selectNodeContents(currentContentBlock);

  try {
    trailingRange.setStart(range.endContainer, range.endOffset);
  } catch {
    return false;
  }

  const trailingFragment = trailingRange.extractContents();
  removeWhitespaceTextSeparators(trailingFragment);
  const hasTrailingContent = fragmentHasText(trailingFragment);

  if (hasTrailingContent) {
    const nextInsertionRange = ownerDocument.createRange();
    nextInsertionRange.selectNodeContents(nextContentBlock);
    nextInsertionRange.collapse(true);

    nextInsertionRange.insertNode(trailingFragment);
  }

  return true;
}

function moveTrailingContentToBlockEnd({
  currentContentBlock,
  previousContentBlock,
  selection,
}) {
  if (
    !currentContentBlock ||
    !previousContentBlock ||
    !selection ||
    selection.rangeCount === 0
  ) {
    return false;
  }

  const ownerDocument = currentContentBlock.ownerDocument || document;
  const range = selection.getRangeAt(0);

  if (!selection.isCollapsed) {
    range.deleteContents();
    range.collapse(true);
  }

  const trailingRange = range.cloneRange();
  trailingRange.selectNodeContents(currentContentBlock);

  try {
    trailingRange.setStart(range.endContainer, range.endOffset);
  } catch {
    return false;
  }

  const trailingFragment = trailingRange.extractContents();
  removeWhitespaceTextSeparators(trailingFragment);
  const hasTrailingContent = fragmentHasText(trailingFragment);

  if (hasTrailingContent) {
    const previousInsertionRange = ownerDocument.createRange();
    previousInsertionRange.selectNodeContents(previousContentBlock);
    previousInsertionRange.collapse(false);
    previousInsertionRange.insertNode(trailingFragment);
  }

  return true;
}

export function moveToAdjacentEditableBlock(event) {
  const shouldMoveRight =
    event.key === "Enter" &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.ctrlKey;
  const isBackward =
    event.key === "Backspace" &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.ctrlKey;

  if ((!shouldMoveRight && !isBackward) || event.isComposing) return false;

  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) return false;

  const targetBlock = event.currentTarget;
  const anchorNode = selection.anchorNode;
  const anchorElement =
    anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
  const currentContentBlock = anchorElement?.closest(
    ".presentation-render-content-block",
  );

  if (!currentContentBlock || !targetBlock.contains(currentContentBlock)) {
    return false;
  }

  const contentBlocks = getEditableContentBlocks(targetBlock);
  const currentIndex = contentBlocks.indexOf(currentContentBlock);
  const targetIndex = shouldMoveRight ? currentIndex + 1 : currentIndex - 1;
  let targetContentBlock = contentBlocks[targetIndex];

  if (!targetContentBlock) return false;

  event.preventDefault();

  if (shouldMoveRight) {
    moveTrailingContentToBlockStart({
      currentContentBlock,
      nextContentBlock: targetContentBlock,
      selection,
    });
    return focusEditableBlockStart(targetContentBlock);
  }

  moveTrailingContentToBlockEnd({
    currentContentBlock,
    previousContentBlock: targetContentBlock,
    selection,
  });
  rebalanceOverflowToRight(contentBlocks, targetIndex);
  return focusEditableBlockEnd(targetContentBlock);
}

export function moveEnterToNextEditableBlock(event) {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.altKey ||
    event.metaKey ||
    event.ctrlKey ||
    event.isComposing
  ) {
    return false;
  }

  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return false;
  }

  const targetBlock = event.currentTarget;
  const range = selection.getRangeAt(0);
  const anchorNode = selection.anchorNode;
  const anchorElement =
    anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
  const currentContentBlock = anchorElement?.closest(
    ".presentation-render-content-block",
  );

  if (!currentContentBlock || !targetBlock.contains(currentContentBlock)) {
    return false;
  }

  const trailingRange = range.cloneRange();
  trailingRange.selectNodeContents(currentContentBlock);
  try {
    trailingRange.setStart(range.endContainer, range.endOffset);
  } catch {
    return false;
  }

  const trailingText = trailingRange
    .toString()
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .trim();

  if (trailingText !== "") return false;

  const contentBlocks = getEditableContentBlocks(targetBlock);
  const currentIndex = contentBlocks.indexOf(currentContentBlock);
  const nextContentBlock = contentBlocks[currentIndex + 1];

  if (!nextContentBlock) return false;

  event.preventDefault();
  focusEditableBlockStart(nextContentBlock);
  return true;
}
