import {
  getColumnLabelFromIndex,
  getMaxLineUnitsForProgressionHeight,
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
    const width = Number.isFinite(Number(override.width))
      ? Number(override.width)
      : undefined;
    const height = Number.isFinite(Number(override.height))
      ? Number(override.height)
      : undefined;
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
      existingGroup.width = existingGroup.width ?? width;
      existingGroup.height = existingGroup.height ?? height;
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
      width,
      height,
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
  resizingProgressionWidths = {},
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

    const getChunkHeight = (chunkIndex) => {
      const visualColumnOverrideKey = getProgressionVisualColumnOverrideKey(
        group.groupKey,
        chunkIndex,
      );
      return (
        resizingProgressionWidths[visualColumnOverrideKey]?.height ??
        progressionMarkOverrides[visualColumnOverrideKey]?.height ??
        (chunkIndex === 0 ? group.height : undefined)
      );
    };
    const chunks = splitBlocksIntoColumnChunks(group.blocks, (chunkIndex) =>
      getMaxLineUnitsForProgressionHeight(getChunkHeight(chunkIndex)),
    );

    return chunks.map((blocksChunk, chunkIndex) => {
      visualColumnIndex += 1;
      const visualColumnOverrideKey = getProgressionVisualColumnOverrideKey(
        group.groupKey,
        chunkIndex,
      );
      const visualColumnOverride =
        progressionMarkOverrides[visualColumnOverrideKey] || {};

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
        width:
          resizingProgressionWidths[visualColumnOverrideKey]?.width ??
          visualColumnOverride.width ??
          group.width,
        height:
          resizingProgressionWidths[visualColumnOverrideKey]?.height ??
          visualColumnOverride.height ??
          (chunkIndex === 0 ? group.height : undefined),
        isOverflowContinuation: chunkIndex > 0,
        visualColumnIndex,
        visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
      };
    });
  });
}

export function getActiveProgressionRenderColumns({
  progressionRenderGroups = [],
  progressionRenderColumns = [],
  shouldUseHorizontalColumnFlow = false,
}) {
  if (shouldUseHorizontalColumnFlow) {
    return progressionRenderColumns;
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
  resizingProgressionWidths = {},
  shouldUseHorizontalColumnFlow = false,
}) {
  const groups = buildProgressionRenderGroups({
    visibleContentBlocks,
    progressionMarkOverrides,
  });
  const columns = buildProgressionRenderColumns({
    progressionRenderGroups: groups,
    progressionMarkOverrides,
    resizingProgressionWidths,
  });
  const activeColumns = getActiveProgressionRenderColumns({
    progressionRenderGroups: groups,
    progressionRenderColumns: columns,
    shouldUseHorizontalColumnFlow,
  });

  return { groups, columns, activeColumns };
}
