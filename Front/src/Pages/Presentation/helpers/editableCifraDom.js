import { PRESENTATION_COLUMN_BREAK_MARKER } from "./presentationConstants";

const EDITABLE_LINE_SELECTOR =
  ".presentation-render-content-block pre, .presentation-render-content-block p, .presentation-render-content-block > div";
const MOVABLE_LINE_SELECTOR = "pre, p";

function readEditableBlockText(block) {
  const lineNodes = Array.from(block.querySelectorAll("pre, p")).filter((node) =>
    block.contains(node),
  );

  if (lineNodes.length) {
    return lineNodes
      .map((node) => (node.textContent || "").replace(/\u00a0/g, " "))
      .join("\n");
  }

  const rawText = block.innerText || block.textContent || "";
  return rawText.replace(/\u00a0/g, " ").trimEnd();
}

function hasPreservedBlankLine(block) {
  return Boolean(block.querySelector(".presentation-blank-line"));
}

function getEditableContentBlocks(contentNode) {
  if (!contentNode) return [];
  return Array.from(
    contentNode.querySelectorAll(".presentation-render-content-block"),
  );
}

function serializeEditableBlocks(contentBlocks, { preserveColumnBreaks = false } = {}) {
  const texts = contentBlocks
    .map((block) => ({
      text: readEditableBlockText(block),
      hasPreservedBlankLine: hasPreservedBlankLine(block),
    }))
    .filter((block) => block.text.trim() !== "" || block.hasPreservedBlankLine)
    .map((block) => block.text);

  return texts
    .join(
      preserveColumnBreaks
        ? `\n${PRESENTATION_COLUMN_BREAK_MARKER}\n`
        : "\n",
    )
    .trimEnd();
}

export function collectEditedPresentationBlocksFromNode({
  contentNode,
  fallbackCifra = "",
  excludedBlockKeys = [],
  preserveColumnBreaks = false,
}) {
  const excludedKeys = new Set(excludedBlockKeys);
  const contentBlocks = getEditableContentBlocks(contentNode).filter((block) => {
    if (!excludedKeys.size) return true;

    const blockKeys = (block.dataset.blockKeys || block.dataset.blockKey || "")
      .split(",")
      .map((blockKey) => blockKey.trim())
      .filter(Boolean);

    return !blockKeys.some((blockKey) => excludedKeys.has(blockKey));
  });

  if (!contentBlocks.length) return fallbackCifra;
  return serializeEditableBlocks(contentBlocks, { preserveColumnBreaks });
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
  contentBlock.scrollIntoView({ block: "nearest", inline: "nearest" });
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
  contentBlock.scrollIntoView({ block: "nearest", inline: "nearest" });
  return true;
}

function fragmentHasText(fragment) {
  return (
    (fragment?.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\u200b/g, "")
      .length > 0
  );
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
    blockIndex < contentBlocks.length - 1;
    blockIndex += 1
  ) {
    const sourceBlock = contentBlocks[blockIndex];
    const targetBlock = contentBlocks[blockIndex + 1];
    let guard = 0;

    while (blockHasOverflow(sourceBlock) && guard < 200) {
      const lineNode = getLastMovableLineNode(sourceBlock);
      if (!lineNode) break;

      prependMovedLine(targetBlock, lineNode);
      pruneEmptyLayoutContainers(sourceBlock);
      guard += 1;
    }
  }
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
  const hasTrailingContent = fragmentHasText(trailingFragment);
  const nextBlockHasContent = (nextContentBlock.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .trimEnd();

  range.insertNode(ownerDocument.createTextNode("\n"));
  range.collapse(false);

  if (hasTrailingContent) {
    const nextInsertionRange = ownerDocument.createRange();
    nextInsertionRange.selectNodeContents(nextContentBlock);
    nextInsertionRange.collapse(true);

    if (nextBlockHasContent) {
      trailingFragment.appendChild(ownerDocument.createTextNode("\n"));
    }

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
  const hasTrailingContent = fragmentHasText(trailingFragment);
  const previousBlockHasContent = (previousContentBlock.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .trimEnd();

  range.insertNode(ownerDocument.createTextNode("\n"));
  range.collapse(false);

  if (hasTrailingContent) {
    const previousInsertionRange = ownerDocument.createRange();
    previousInsertionRange.selectNodeContents(previousContentBlock);
    previousInsertionRange.collapse(false);

    if (previousBlockHasContent) {
      const insertionFragment = ownerDocument.createDocumentFragment();
      insertionFragment.appendChild(ownerDocument.createTextNode("\n"));
      insertionFragment.appendChild(trailingFragment);
      previousInsertionRange.insertNode(insertionFragment);
    } else {
      previousInsertionRange.insertNode(trailingFragment);
    }
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
  const targetContentBlock = contentBlocks[targetIndex];

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
