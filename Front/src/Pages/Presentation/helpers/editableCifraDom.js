import { EMPTY_PRESENTATION_BLOCK_PLACEHOLDER } from "./presentationConstants";

const EDITABLE_LINE_SELECTOR =
  ".presentation-render-content-block pre, .presentation-render-content-block p, .presentation-render-content-block > div";

function readEditableBlockText(block) {
  const rawText = block.innerText.replace(/\u00a0/g, " ").trimEnd();
  return rawText.trim() === "" ? EMPTY_PRESENTATION_BLOCK_PLACEHOLDER : rawText;
}

function getEditableContentBlocks(contentNode) {
  if (!contentNode) return [];
  return Array.from(
    contentNode.querySelectorAll(".presentation-render-content-block"),
  );
}

function sortBlocksByOriginalIndex(left, right) {
  const leftIndex = Number.isFinite(left.index) ? left.index : 0;
  const rightIndex = Number.isFinite(right.index) ? right.index : 0;
  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  return left.domIndex - right.domIndex;
}

function serializeEditableBlocks(contentBlocks) {
  return contentBlocks
    .map((block, domIndex) => ({
      domIndex,
      index: Number.parseInt(block.dataset.originalBlockIndex, 10),
      text: readEditableBlockText(block),
    }))
    .sort(sortBlocksByOriginalIndex)
    .map((block) => block.text)
    .join("\n\n")
    .trimEnd();
}

export function collectEditedPresentationBlocksFromNode({
  contentNode,
  fallbackCifra = "",
  excludedBlockKeys = [],
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
  return serializeEditableBlocks(contentBlocks);
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
