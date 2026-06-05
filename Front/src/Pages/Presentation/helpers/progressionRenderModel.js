import {
  HORIZONTAL_EXPANDED_COLUMN_LINE_UNITS,
} from "./presentationConstants";
import {
  getColumnLabelFromIndex,
  getProgressionVisualColumnOverrideKey,
  splitBlocksIntoColumnChunks,
} from "./presentationUtils";

export function buildProgressionRenderGroups({
  visibleContentBlocks = [],
  progressionMarkOverrides = {},
}) {
  const groupedBlocks = new Map();

  visibleContentBlocks.forEach((entry, visibleIndex) => {
    const blockKey = entry.blockKey || `block-${entry.index}`;
    const override = progressionMarkOverrides[blockKey] || {};
    const rawPosition = override.position ?? entry.progressionIndex;
    const numericPosition =
      Number.parseInt(rawPosition, 10) ||
      entry.progressionIndex ||
      visibleIndex + 1;
    const groupKey = entry.isProgressionEligible
      ? `progression-${numericPosition}`
      : `raw-${entry.index}`;
    const existingGroup = groupedBlocks.get(groupKey);
    const fallbackTitle = entry.progressionTitle;
    const renderOrder = Number.isFinite(Number(override.order))
      ? Number(override.order)
      : visibleIndex;
    const groupedEntry = {
      ...entry,
      renderOrder,
    };

    if (existingGroup) {
      existingGroup.blocks.push(groupedEntry);
      existingGroup.blockKeys.push(blockKey);
      return;
    }

    groupedBlocks.set(groupKey, {
      groupKey,
      blockKeys: [blockKey],
      blocks: [groupedEntry],
      isProgressionEligible: entry.isProgressionEligible,
      columnIndex: numericPosition,
      displayPosition: numericPosition,
      displayTitle: override.title ?? fallbackTitle,
      firstVisibleIndex: visibleIndex,
    });
  });

  return Array.from(groupedBlocks.values())
    .map((group) => ({
      ...group,
      blocks: group.blocks
        .slice()
        .sort(
          (left, right) =>
            (left.renderOrder ?? left.index) -
            (right.renderOrder ?? right.index),
        ),
    }))
    .sort((left, right) => {
      if (left.isProgressionEligible && right.isProgressionEligible) {
        return left.columnIndex - right.columnIndex;
      }

      return left.firstVisibleIndex - right.firstVisibleIndex;
    });
}

export function buildProgressionRenderColumns({
  progressionRenderGroups = [],
  progressionMarkOverrides = {},
}) {
  let visualColumnIndex = 0;

  return progressionRenderGroups.flatMap((group) => {
    if (!group.isProgressionEligible) {
      visualColumnIndex += 1;
      return [
        {
          ...group,
          visualColumnIndex,
          visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
        },
      ];
    }

    const chunks = splitBlocksIntoColumnChunks(group.blocks);

    return chunks.map((blocksChunk, chunkIndex) => {
      visualColumnIndex += 1;
      const visualColumnOverrideKey = getProgressionVisualColumnOverrideKey(
        group.groupKey,
        chunkIndex,
      );
      void progressionMarkOverrides;

      return {
        ...group,
        baseGroupKey: group.groupKey,
        visualColumnOverrideKey,
        groupKey:
          chunkIndex === 0
            ? group.groupKey
            : `${group.groupKey}-overflow-${chunkIndex + 1}`,
        blocks: blocksChunk,
        blockKeys: blocksChunk.map((block) => block.blockKey),
        isOverflowContinuation: chunkIndex > 0,
        visualColumnIndex,
        visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
      };
    });
  });
}

export function getActiveProgressionRenderColumns({
  visibleContentBlocks = [],
  progressionRenderGroups = [],
  shouldUseHorizontalColumnFlow = false,
}) {
  if (shouldUseHorizontalColumnFlow) {
    // Layout contract: once horizontal editor columns are saved as explicit
    // breaks, render must honor those break boundaries. Still keep the
    // line-unit pagination active inside each boundary: if a saved/edit column
    // becomes taller than the visual block, the overflow must continue in the
    // next block to the right instead of being clipped.
    return splitBlocksIntoColumnChunks(
      visibleContentBlocks,
      HORIZONTAL_EXPANDED_COLUMN_LINE_UNITS,
    )
      .filter((blocksChunk) =>
        blocksChunk.some(
          (block) =>
            String(block.block || "")
              .replace(/<[^>]+>/g, "")
              .replace(/\u200b/g, "")
              .trim() !== "",
        ),
      )
      .map((blocksChunk, index) => {
        const visualColumnIndex = index + 1;
        const columnKey = `continuous-column-${visualColumnIndex}`;

        return {
          groupKey: columnKey,
          baseGroupKey: columnKey,
          blockKeys: blocksChunk.map((block) => block.blockKey),
          blocks: blocksChunk,
          isProgressionEligible: blocksChunk.some(
            (block) => block.isProgressionEligible,
          ),
          displayPosition: visualColumnIndex,
          firstVisibleIndex: blocksChunk[0]?.index ?? index,
          visualColumnIndex,
          visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
        };
      });
  }

  return progressionRenderGroups.map((group, index) => {
    const visualColumnIndex =
      Number.parseInt(group.displayPosition, 10) || index + 1;

    return {
      ...group,
      baseGroupKey: group.groupKey,
      visualColumnIndex,
      visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
    };
  });
}

export function buildProgressionRenderModel({
  visibleContentBlocks = [],
  progressionMarkOverrides = {},
  shouldUseHorizontalColumnFlow = false,
}) {
  const groups = buildProgressionRenderGroups({
    visibleContentBlocks,
    progressionMarkOverrides,
  });
  const columns = buildProgressionRenderColumns({
    progressionRenderGroups: groups,
    progressionMarkOverrides,
  });
  const activeColumns = getActiveProgressionRenderColumns({
    visibleContentBlocks,
    progressionRenderGroups: groups,
    shouldUseHorizontalColumnFlow,
  });

  return { groups, columns, activeColumns };
}
