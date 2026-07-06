import { getColumnLabelFromIndex } from "../helpers/presentationUtils";
import {
  PROGRESSION_COLUMN_HEADER_COLORS,
  PROGRESSION_MARKER_COLOR,
} from "../helpers/presentationConstants";
import { getLiveColumnDisplayState } from "../presentationLayoutHelpers";

function PresentationColumns({
  columns,
  showProgressionMarkers,
  effectiveLiveMode,
  shouldUseHorizontalColumnFlow,
  selectedBlockKeys,
  activeLiveColumnKey,
  isEditing = false,
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
          Number.isFinite(Number(entry.index))
            ? Number(entry.index)
            : visibleIndex,
        ),
      );

      return (
        <div
          key={groupKey}
          className={`presentation-column ${
            showProgressionMarkers && isProgressionEligible
              ? "presentation-progression-column"
              : ""
          } ${
            isBlockSelected ? "presentation-progression-column-selected" : ""
          } ${
            effectiveLiveMode && shouldUseHorizontalColumnFlow
              ? liveColumnState.className
              : ""
          }`}
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
          }}
        >
          <div
            data-progression-drop-target={
              isProgressionEligible ? "true" : undefined
            }
            data-progression-group-key={baseGroupKey || groupKey}
            data-live-column-key={groupKey}
            className={`presentation-render-block ${
              showProgressionMarkers && isProgressionEligible
                ? "presentation-progression-block"
                : ""
            } ${
              isBlockSelected ? "presentation-progression-block-selected" : ""
            }`}
          >
            <div
              className={`presentation-column-header ${
                showProgressionMarkers && isProgressionEligible
                  ? "presentation-column-header-visible"
                  : ""
              }`}
              contentEditable={false}
              aria-hidden={
                showProgressionMarkers && isProgressionEligible
                  ? undefined
                  : "true"
              }
            >
              {headerLabel}
            </div>
            <div className="presentation-column-body">
              <div
                className="presentation-render-content-block"
                data-block-keys={blockKeys.join(",")}
                data-original-block-index={originalBlockIndex}
                contentEditable={isEditing}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: contentBlockHtml }}
              />
            </div>
          </div>
        </div>
      );
    },
  );
}

export default PresentationColumns;
