import { useCallback, useMemo } from "react";
import {
  MAX_PROGRESSION_BLOCK_HEIGHT_PX,
  MIN_PROGRESSION_BLOCK_HEIGHT_PX,
  PROGRESSION_BLOCK_BOTTOM_GUTTER_PX,
} from "../helpers/presentationConstants";
import { getProgressionColumnsDebugSummary } from "../presentationLayoutHelpers";
import { logPresentationDebug } from "../helpers/presentationUtils";

export function usePresentationProgressionControls({
  activeProgressionMarkControl,
  activeProgressionRenderColumns,
  draggedProgressionGroupKeyRef,
  isEditing,
  presentationContentRef,
  presentationLayoutIdentity,
  progressionMarkOverrides,
  progressionRenderGroups,
  resizingProgressionWidths,
  setResizingProgressionWidths,
  updateActivePresentationLayout,
}) {
  const handleChangeMarkWidth = useCallback(
    (blockKeys, width) => {
      const normalizedWidth = Math.max(260, Math.min(1200, Math.round(width)));

      updateActivePresentationLayout((currentLayout) => {
        const currentOverrides = currentLayout.progressionMarkOverrides || {};
        const nextOverrides = { ...currentOverrides };

        blockKeys.forEach((blockKey) => {
          nextOverrides[blockKey] = {
            ...(currentOverrides[blockKey] || {}),
            width: normalizedWidth,
          };
        });

        return {
          ...currentLayout,
          progressionMarkOverrides: nextOverrides,
        };
      });
    },
    [updateActivePresentationLayout],
  );

  const handleChangeMarkHeight = useCallback(
    (blockKeys, height) => {
      const normalizedHeight = Math.max(
        MIN_PROGRESSION_BLOCK_HEIGHT_PX,
        Math.min(MAX_PROGRESSION_BLOCK_HEIGHT_PX, Math.round(height)),
      );

      updateActivePresentationLayout((currentLayout) => {
        const currentOverrides = currentLayout.progressionMarkOverrides || {};
        const nextOverrides = { ...currentOverrides };

        blockKeys.forEach((blockKey) => {
          nextOverrides[blockKey] = {
            ...(currentOverrides[blockKey] || {}),
            height: normalizedHeight,
          };
        });

        return {
          ...currentLayout,
          progressionMarkOverrides: nextOverrides,
        };
      });
    },
    [updateActivePresentationLayout],
  );

  const handleStartProgressionResize = useCallback(
    (event, group) => {
      if (!group?.blockKeys?.length) return;

      event.preventDefault();
      event.stopPropagation();

      const blockNode = event.currentTarget.closest(
        ".presentation-render-block",
      );
      const startX = event.clientX;
      const startY = event.clientY;
      const blockRect = blockNode?.getBoundingClientRect();
      const startWidth = blockRect?.width || group.width || 620;
      const startHeight = blockRect?.height || group.height || 180;
      const axis = event.currentTarget.dataset.resizeAxis || "width";
      const resizingKey =
        group.visualColumnOverrideKey || group.baseGroupKey || group.groupKey;
      const heightOverrideKeys = group.visualColumnOverrideKey
        ? [group.visualColumnOverrideKey]
        : group.blockKeys;
      const widthOverrideKeys = group.visualColumnOverrideKey
        ? [group.visualColumnOverrideKey]
        : group.blockKeys;
      const viewportRect =
        presentationContentRef.current?.getBoundingClientRect();
      const visibleBottomLimit =
        Math.max(
          viewportRect?.bottom || window.innerHeight,
          window.innerHeight,
        ) - PROGRESSION_BLOCK_BOTTOM_GUTTER_PX;
      const maxHeightFromViewport = Math.max(
        MIN_PROGRESSION_BLOCK_HEIGHT_PX,
        Math.round(visibleBottomLimit - (blockRect?.top || 0)),
      );
      const maxAllowedHeight = Math.min(
        MAX_PROGRESSION_BLOCK_HEIGHT_PX,
        maxHeightFromViewport,
      );
      const clampHeight = (value) =>
        Math.max(
          MIN_PROGRESSION_BLOCK_HEIGHT_PX,
          Math.min(maxAllowedHeight, Math.round(value)),
        );

      const handleMouseMove = (moveEvent) => {
        const nextWidth = Math.max(
          260,
          Math.min(1200, startWidth + moveEvent.clientX - startX),
        );
        const nextHeight = clampHeight(
          startHeight + moveEvent.clientY - startY,
        );

        setResizingProgressionWidths((current) => ({
          ...current,
          [resizingKey]:
            axis === "height"
              ? { ...(current[resizingKey] || {}), height: nextHeight }
              : { ...(current[resizingKey] || {}), width: nextWidth },
        }));
      };

      const handleMouseUp = (upEvent) => {
        const nextWidth = Math.max(
          260,
          Math.min(1200, startWidth + upEvent.clientX - startX),
        );
        const nextHeight = clampHeight(startHeight + upEvent.clientY - startY);

        if (axis === "height") {
          handleChangeMarkHeight(heightOverrideKeys, nextHeight);
        } else {
          handleChangeMarkWidth(widthOverrideKeys, nextWidth);
        }
        setResizingProgressionWidths((current) => {
          const next = { ...current };
          delete next[resizingKey];
          return next;
        });
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [
      handleChangeMarkHeight,
      handleChangeMarkWidth,
      presentationContentRef,
      setResizingProgressionWidths,
    ],
  );

  const activeProgressionMarkSettings = useMemo(() => {
    if (!activeProgressionMarkControl) {
      return {
        active: false,
        label: "",
        width: 0,
        height: 0,
      };
    }

    const targetColumn = activeProgressionRenderColumns.find((column) => {
      if (
        activeProgressionMarkControl.visualColumnOverrideKey &&
        column.visualColumnOverrideKey ===
          activeProgressionMarkControl.visualColumnOverrideKey
      ) {
        return true;
      }
      return column.groupKey === activeProgressionMarkControl.groupKey;
    });
    const overrideKey =
      activeProgressionMarkControl.visualColumnOverrideKey ||
      targetColumn?.visualColumnOverrideKey ||
      activeProgressionMarkControl.groupKey;
    const overrides = progressionMarkOverrides[overrideKey] || {};
    const resizing = resizingProgressionWidths[overrideKey] || {};

    return {
      active: Boolean(targetColumn),
      label:
        targetColumn?.visualColumnLabel ||
        activeProgressionMarkControl.label ||
        "",
      overrideKey,
      blockKeys:
        targetColumn?.blockKeys || activeProgressionMarkControl.blockKeys || [],
      width: Math.round(
        resizing.width ??
          overrides.width ??
          targetColumn?.width ??
          activeProgressionMarkControl.width ??
          620,
      ),
      height: Math.round(
        resizing.height ??
          overrides.height ??
          targetColumn?.height ??
          activeProgressionMarkControl.height ??
          260,
      ),
    };
  }, [
    activeProgressionMarkControl,
    activeProgressionRenderColumns,
    progressionMarkOverrides,
    resizingProgressionWidths,
  ]);

  const adjustActiveProgressionMarkWidth = useCallback(
    (delta) => {
      if (!activeProgressionMarkSettings.active) return;
      const nextWidth = Math.max(
        260,
        Math.min(1200, activeProgressionMarkSettings.width + delta),
      );
      handleChangeMarkWidth(
        [activeProgressionMarkSettings.overrideKey],
        nextWidth,
      );
    },
    [activeProgressionMarkSettings, handleChangeMarkWidth],
  );

  const adjustActiveProgressionMarkHeight = useCallback(
    (delta) => {
      if (!activeProgressionMarkSettings.active) return;
      const nextHeight = Math.max(
        MIN_PROGRESSION_BLOCK_HEIGHT_PX,
        Math.min(
          MAX_PROGRESSION_BLOCK_HEIGHT_PX,
          activeProgressionMarkSettings.height + delta,
        ),
      );
      handleChangeMarkHeight(
        [activeProgressionMarkSettings.overrideKey],
        nextHeight,
      );
    },
    [activeProgressionMarkSettings, handleChangeMarkHeight],
  );

  const handleDropProgressionGroup = useCallback(
    (targetGroupKey) => {
      const draggedGroupKey = draggedProgressionGroupKeyRef.current;
      draggedProgressionGroupKeyRef.current = "";

      if (!draggedGroupKey || draggedGroupKey === targetGroupKey) return;

      const orderedGroups = progressionRenderGroups.filter(
        (group) => group.isProgressionEligible,
      );
      const draggedGroup = orderedGroups.find(
        (group) => group.groupKey === draggedGroupKey,
      );
      const targetGroup = orderedGroups.find(
        (group) => group.groupKey === targetGroupKey,
      );

      if (!draggedGroup || !targetGroup) return;

      logPresentationDebug("drag:drop-group", {
        identity: presentationLayoutIdentity,
        draggedGroupKey,
        targetGroupKey,
        draggedGroup: getProgressionColumnsDebugSummary([draggedGroup])[0],
        targetGroup: getProgressionColumnsDebugSummary([targetGroup])[0],
      });

      updateActivePresentationLayout((currentLayout) => {
        const currentOverrides = currentLayout.progressionMarkOverrides || {};
        const nextOverrides = { ...currentOverrides };
        const targetPosition =
          Number.parseInt(targetGroup.columnIndex, 10) ||
          Number.parseInt(targetGroup.displayPosition, 10) ||
          1;
        const nextOrder =
          Math.max(
            ...targetGroup.blocks.map((block) =>
              Number.isFinite(Number(block.renderOrder))
                ? Number(block.renderOrder)
                : Number(block.index) || 0,
            ),
            0,
          ) + 1;

        draggedGroup.blockKeys.forEach((blockKey, blockIndex) => {
          nextOverrides[blockKey] = {
            ...(currentOverrides[blockKey] || {}),
            position: targetPosition,
            order: nextOrder + blockIndex,
          };
        });

        logPresentationDebug("drag:next-overrides", {
          identity: presentationLayoutIdentity,
          draggedGroupKey,
          targetGroupKey,
          targetPosition,
          nextOrder,
          changedOverrides: Object.fromEntries(
            draggedGroup.blockKeys.map((blockKey) => [
              blockKey,
              nextOverrides[blockKey],
            ]),
          ),
        });

        return {
          ...currentLayout,
          progressionMarkOverrides: nextOverrides,
        };
      });
    },
    [
      draggedProgressionGroupKeyRef,
      presentationLayoutIdentity,
      progressionRenderGroups,
      updateActivePresentationLayout,
    ],
  );

  const handleDropProgressionGroupOnColumn = useCallback(
    (event) => {
      if (!isEditing || !draggedProgressionGroupKeyRef.current) return;

      const columnNodes = Array.from(
        event.currentTarget.querySelectorAll(
          "[data-progression-drop-target='true']",
        ),
      );
      if (!columnNodes.length) return;

      event.preventDefault();

      const pointerX = event.clientX;
      const targetNode =
        columnNodes.find((node) => {
          const rect = node.getBoundingClientRect();
          return pointerX >= rect.left && pointerX <= rect.right;
        }) ||
        columnNodes
          .map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              node,
              distance: Math.abs(pointerX - (rect.left + rect.width / 2)),
            };
          })
          .sort((left, right) => left.distance - right.distance)[0]?.node;

      const targetGroupKey = targetNode?.dataset?.progressionGroupKey;
      logPresentationDebug("drag:drop-on-column", {
        identity: presentationLayoutIdentity,
        draggedGroupKey: draggedProgressionGroupKeyRef.current,
        pointerX,
        targetGroupKey,
        availableTargets: columnNodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            groupKey: node.dataset?.progressionGroupKey,
            label: node.dataset?.progressionColumnLabel,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        }),
      });
      if (targetGroupKey) {
        handleDropProgressionGroup(targetGroupKey);
      }
    },
    [
      draggedProgressionGroupKeyRef,
      handleDropProgressionGroup,
      isEditing,
      presentationLayoutIdentity,
    ],
  );

  return {
    activeProgressionMarkSettings,
    adjustActiveProgressionMarkHeight,
    adjustActiveProgressionMarkWidth,
    handleChangeMarkHeight,
    handleChangeMarkWidth,
    handleDropProgressionGroup,
    handleDropProgressionGroupOnColumn,
    handleStartProgressionResize,
  };
}
