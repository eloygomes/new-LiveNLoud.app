import {
  getColumnLabelFromIndex,
} from "../helpers/presentationUtils";
import {
  PROGRESSION_COLUMN_HEADER_COLORS,
  PROGRESSION_MARKER_COLOR,
} from "../helpers/presentationConstants";
import { getLiveColumnDisplayState } from "../presentationLayoutHelpers";

function PresentationColumns({
  columns,
  selectContenttoShow,
  showProgressionMarkers,
  effectiveLiveMode,
  shouldUseHorizontalColumnFlow,
  shouldApplyProgressionBlockDimensions,
  resizingProgressionWidths,
  selectedBlockKeys,
  isEditing,
  draggedProgressionGroupKeyRef,
  onSetActiveProgressionMarkControl,
  onHandleDropProgressionGroup,
  onToggleSelectedBlockKeys,
  onHandleDeleteSelectedBlocks,
  onHandleStartProgressionResize,
  activeLiveColumnKey,
}) {
  return columns.map(
    (
      {
        groupKey,
        baseGroupKey,
        blockKeys,
        blocks,
        isProgressionEligible,
        displayPosition,
        width,
        height,
        visualColumnOverrideKey,
        isOverflowContinuation,
        visualColumnIndex,
        visualColumnLabel,
      },
      visibleIndex,
      visibleGroups,
    ) => {
      const numericDisplayPosition =
        Number.parseInt(visualColumnIndex, 10) ||
        Number.parseInt(displayPosition, 10) ||
        visibleIndex + 1;
      const progressionColor = isProgressionEligible
        ? PROGRESSION_MARKER_COLOR
        : undefined;
      const progressionHeaderColor = isProgressionEligible
        ? PROGRESSION_COLUMN_HEADER_COLORS[
            (numericDisplayPosition - 1) %
              PROGRESSION_COLUMN_HEADER_COLORS.length
          ]
        : undefined;
      const resizeKey = visualColumnOverrideKey || groupKey;
      const resizeDimensions = resizingProgressionWidths[resizeKey] || {};
      const displayWidth = resizeDimensions.width ?? width;
      const displayHeight = resizeDimensions.height ?? height;
      const headerLabel =
        visualColumnLabel || getColumnLabelFromIndex(numericDisplayPosition);
      const isBlockSelected = blockKeys.some((blockKey) =>
        selectedBlockKeys.includes(blockKey),
      );
      const contentBlockHtml = blocks.map((entry) => entry.block).join("\n");
      const liveColumnState = getLiveColumnDisplayState({
        columnKey: groupKey,
        activeColumnKey: activeLiveColumnKey,
        columnIndex: visibleIndex,
      });
      const originalBlockIndex = Math.min(
        ...blocks.map((entry) =>
          Number.isFinite(Number(entry.index)) ? Number(entry.index) : visibleIndex,
        ),
      );

      return (
        <div
          key={groupKey}
          data-progression-drop-target={isProgressionEligible ? "true" : undefined}
          data-progression-group-key={baseGroupKey || groupKey}
          data-live-column-key={groupKey}
          data-progression-column-label={
            showProgressionMarkers && isProgressionEligible ? headerLabel : undefined
          }
          className={`presentation-render-block ${
            selectContenttoShow === "tabs" ? "presentation-tab-filter-block" : ""
          } ${
            showProgressionMarkers && isProgressionEligible
              ? "presentation-progression-block"
              : ""
          } ${
            isBlockSelected ? "presentation-progression-block-selected" : ""
          } ${
            effectiveLiveMode && shouldUseHorizontalColumnFlow
              ? liveColumnState.className
              : ""
          }`}
          onMouseDownCapture={
            isEditing && isProgressionEligible
              ? (event) => {
                  const currentRect = event.currentTarget.getBoundingClientRect();
                  onSetActiveProgressionMarkControl({
                    groupKey,
                    visualColumnOverrideKey,
                    blockKeys,
                    label: headerLabel,
                    width: displayWidth || Math.round(currentRect.width),
                    height: displayHeight || Math.round(currentRect.height),
                  });
                }
              : undefined
          }
          draggable={isEditing && isProgressionEligible}
          onDragStart={
            isEditing && isProgressionEligible && !isOverflowContinuation
              ? (event) => {
                  draggedProgressionGroupKeyRef.current = baseGroupKey || groupKey;
                  event.dataTransfer.effectAllowed = "move";
                }
              : undefined
          }
          onDragOver={
            isEditing && isProgressionEligible
              ? (event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              : undefined
          }
          onDrop={
            isEditing && isProgressionEligible && !isOverflowContinuation
              ? (event) => {
                  event.preventDefault();
                  onHandleDropProgressionGroup(baseGroupKey || groupKey);
                }
              : undefined
          }
          style={{
            ...(!effectiveLiveMode &&
            visibleIndex === visibleGroups.length - 1 &&
            !shouldUseHorizontalColumnFlow
              ? { paddingBottom: 200 }
              : {}),
            ...(showProgressionMarkers && isProgressionEligible && progressionColor
              ? {
                  "--progression-color": progressionColor,
                  "--progression-header-color": progressionHeaderColor,
                }
              : {}),
            ...(shouldApplyProgressionBlockDimensions && displayWidth
              ? { width: `${displayWidth}px` }
              : {}),
            ...(shouldApplyProgressionBlockDimensions && displayHeight
              ? {
                  height: `${displayHeight}px`,
                  minHeight: `${displayHeight}px`,
                }
              : {}),
          }}
        >
          {isEditing && isProgressionEligible && !isOverflowContinuation ? (
            <>
              <button
                type="button"
                className="presentation-progression-select-handle"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleSelectedBlockKeys(blockKeys);
                }}
                contentEditable={false}
                aria-label={
                  isBlockSelected
                    ? "Unselect progression block"
                    : "Select progression block"
                }
              >
                {isBlockSelected ? "✓" : "○"}
              </button>
              {isBlockSelected ? (
                <button
                  type="button"
                  className="presentation-progression-delete-handle"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onHandleDeleteSelectedBlocks(blockKeys);
                  }}
                  contentEditable={false}
                  aria-label="Delete selected progression block"
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                className="presentation-progression-drag-handle"
                draggable
                onDragStart={(event) => {
                  draggedProgressionGroupKeyRef.current = baseGroupKey || groupKey;
                  event.dataTransfer.effectAllowed = "move";
                }}
                contentEditable={false}
                aria-label="Reorder progression block"
              >
                ::
              </button>
              <button
                type="button"
                className="presentation-progression-resize-handle"
                data-resize-axis="width"
                onMouseDown={(event) =>
                  onHandleStartProgressionResize(event, {
                    groupKey,
                    baseGroupKey,
                    visualColumnOverrideKey,
                    blockKeys,
                    width,
                    height,
                  })
                }
                contentEditable={false}
                aria-label="Resize progression block"
              >
                ↔
              </button>
              <button
                type="button"
                className="presentation-progression-height-handle"
                data-resize-axis="height"
                onMouseDown={(event) =>
                  onHandleStartProgressionResize(event, {
                    groupKey,
                    baseGroupKey,
                    visualColumnOverrideKey,
                    blockKeys,
                    width,
                    height,
                  })
                }
                contentEditable={false}
                aria-label="Resize progression block height"
              >
                ↕
              </button>
              <button
                type="button"
                className="presentation-progression-height-top-handle"
                data-resize-axis="height"
                onMouseDown={(event) =>
                  onHandleStartProgressionResize(event, {
                    groupKey,
                    baseGroupKey,
                    visualColumnOverrideKey,
                    blockKeys,
                    width,
                    height,
                  })
                }
                contentEditable={false}
                aria-label="Resize progression block height"
              >
                ↕
              </button>
            </>
          ) : null}
          <div
            className="presentation-render-content-block"
            data-block-keys={blockKeys.join(",")}
            data-original-block-index={originalBlockIndex}
            dangerouslySetInnerHTML={{ __html: contentBlockHtml }}
          />
        </div>
      );
    },
  );
}

export default PresentationColumns;
