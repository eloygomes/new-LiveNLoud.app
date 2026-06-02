import { useCallback, useEffect, useRef, useState } from "react";
import { findChordTooltipData } from "../PresentationChordTooltip";

function buildTooltipState({ chordElement, chordData, activeChordTooltip }) {
  const rect = chordElement.getBoundingClientRect();
  const isExpanded = activeChordTooltip?.data?.chordId === chordData.chordId;
  const tooltipWidth = isExpanded ? 860 : 184;
  const spacing = 14;
  const safeLeft = Math.min(
    Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 12,
  );

  return {
    chord: chordData.chordLabel,
    data: chordData,
    position: {
      x: safeLeft,
      y: rect.bottom + spacing,
    },
  };
}

export function usePresentationChordTooltip({ contentRef, isEditing }) {
  const [tooltip, setTooltip] = useState(null);
  const [selectedChordVariations, setSelectedChordVariations] = useState({});
  const [
    selectedChordOccurrenceVariations,
    setSelectedChordOccurrenceVariations,
  ] = useState({});
  const tooltipHideTimeoutRef = useRef(null);

  const clearTooltipHideTimeout = useCallback(() => {
    if (tooltipHideTimeoutRef.current) {
      window.clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    clearTooltipHideTimeout();
    setTooltip(null);
  }, [clearTooltipHideTimeout]);

  const scheduleTooltipHide = useCallback(() => {
    clearTooltipHideTimeout();
    tooltipHideTimeoutRef.current = window.setTimeout(() => {
      setTooltip(null);
      tooltipHideTimeoutRef.current = null;
    }, 150);
  }, [clearTooltipHideTimeout]);

  const updateTooltip = useCallback(
    (target) => {
      clearTooltipHideTimeout();

      if (!(target instanceof HTMLElement)) {
        setTooltip(null);
        return;
      }

      const chordElement = target.closest(".notespresentation[data-chord]");
      if (!chordElement) {
        setTooltip(null);
        return;
      }

      const rawChord = chordElement.getAttribute("data-chord") || "";
      const chordId = chordElement.getAttribute("data-chord-id") || "";
      const chordData = findChordTooltipData(rawChord);

      if (!chordData) {
        setTooltip(null);
        return;
      }

      setTooltip((currentTooltip) =>
        buildTooltipState({
          chordElement,
          chordData: {
            ...chordData,
            chordId,
          },
          activeChordTooltip: currentTooltip,
        }),
      );
    },
    [clearTooltipHideTimeout],
  );

  const applyChordVariation = useCallback(
    ({ chordLabel, chordId, variationIndex, applyToAll }) => {
      if (applyToAll) {
        setSelectedChordVariations((current) => ({
          ...current,
          [chordLabel]: variationIndex,
        }));
      } else {
        setSelectedChordOccurrenceVariations((current) => ({
          ...current,
          [chordId]: variationIndex,
        }));
      }
      hideTooltip();
    },
    [hideTooltip],
  );

  const getSelectedVariationIndex = useCallback(
    (tooltipData) => {
      if (!tooltipData) return 0;
      if (
        Object.prototype.hasOwnProperty.call(
          selectedChordOccurrenceVariations,
          tooltipData.chordId,
        )
      ) {
        return selectedChordOccurrenceVariations[tooltipData.chordId];
      }
      return selectedChordVariations[tooltipData.chordLabel] ?? 0;
    },
    [selectedChordOccurrenceVariations, selectedChordVariations],
  );

  useEffect(() => {
    const contentNode = contentRef.current;
    if (!contentNode || isEditing) return undefined;

    const handleMouseEnter = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest(".notespresentation[data-chord]")) {
        updateTooltip(target);
      }
    };

    const handleMouseOut = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest(".notespresentation[data-chord]")) return;

      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof HTMLElement &&
        (nextTarget.closest(".notespresentation[data-chord]") ||
          nextTarget.closest(".presentation-chord-tooltip"))
      ) {
        return;
      }
      scheduleTooltipHide();
    };

    contentNode.addEventListener("mouseover", handleMouseEnter);
    contentNode.addEventListener("mouseout", handleMouseOut);

    return () => {
      contentNode.removeEventListener("mouseover", handleMouseEnter);
      contentNode.removeEventListener("mouseout", handleMouseOut);
    };
  }, [contentRef, isEditing, scheduleTooltipHide, updateTooltip]);

  useEffect(() => {
    if (isEditing) {
      hideTooltip();
    }
  }, [hideTooltip, isEditing]);

  useEffect(() => clearTooltipHideTimeout, [clearTooltipHideTimeout]);

  return {
    tooltip,
    selectedVariationIndex: getSelectedVariationIndex(tooltip?.data),
    applyChordVariation,
    handleTooltipEnter: clearTooltipHideTimeout,
    handleTooltipLeave: scheduleTooltipHide,
    hideTooltip,
  };
}
