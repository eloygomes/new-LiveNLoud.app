import { useCallback } from "react";
import {
  buildInstrumentPresentationLayouts,
  clampPresentationBlockSpacingStep,
  clampPresentationFontSizeStep,
  getPresentationLayoutsDebugSummary,
  normalizePresentationLayoutVariant,
  toPresentationLayoutPayload,
} from "../presentationLayoutHelpers";
import { logPresentationDebug } from "../helpers/presentationUtils";

export function usePresentationLayoutUpdater({
  activeLayoutVariant,
  instrumentSelected,
  presentationLayoutIdentity,
  setHasEditedLayoutContent,
  setSongDataFetched,
}) {
  const updatePresentationLayoutVariant = useCallback(
    (variantKey, update) => {
      setHasEditedLayoutContent(true);
      setSongDataFetched((prev) => {
        if (!prev || !instrumentSelected) return prev;

        const currentInstrument = prev[instrumentSelected] || {};
        const currentLayouts =
          buildInstrumentPresentationLayouts(currentInstrument);
        const currentVariantLayout = currentLayouts[variantKey];
        const nextVariantLayoutInput =
          typeof update === "function"
            ? update(currentVariantLayout, currentLayouts)
            : {
                ...currentVariantLayout,
                ...(update || {}),
              };
        const nextVariantLayout = normalizePresentationLayoutVariant(
          nextVariantLayoutInput,
          {
            fallbackSongCifra:
              currentVariantLayout?.songCifra ||
              currentInstrument.songCifra ||
              "",
            defaultTwoColumns: variantKey === "expanded",
          },
        );
        const nextLayouts = {
          ...currentLayouts,
          [variantKey]: nextVariantLayout,
        };
        const nextInstrument = {
          ...currentInstrument,
          presentationLayouts: toPresentationLayoutPayload(nextLayouts),
          songCifra: nextLayouts.default.songCifra,
        };

        logPresentationDebug("layout:update-variant", {
          identity: presentationLayoutIdentity,
          variantKey,
          current: getPresentationLayoutsDebugSummary(currentLayouts),
          next: getPresentationLayoutsDebugSummary(nextLayouts),
        });

        return {
          ...prev,
          [instrumentSelected]: nextInstrument,
          updateIn: new Date().toISOString().split("T")[0],
        };
      });
    },
    [
      instrumentSelected,
      presentationLayoutIdentity,
      setHasEditedLayoutContent,
      setSongDataFetched,
    ],
  );

  const updateActivePresentationLayout = useCallback(
    (update) => {
      updatePresentationLayoutVariant(activeLayoutVariant, update);
    },
    [activeLayoutVariant, updatePresentationLayoutVariant],
  );

  const setActiveShowProgressionMarkers = useCallback(
    (valueOrUpdater) => {
      updateActivePresentationLayout((currentLayout) => ({
        ...currentLayout,
        showProgressionMarkers:
          typeof valueOrUpdater === "function"
            ? valueOrUpdater(currentLayout.showProgressionMarkers)
            : Boolean(valueOrUpdater),
      }));
    },
    [updateActivePresentationLayout],
  );

  const adjustActiveFontSizeStep = useCallback(
    (delta) => {
      updateActivePresentationLayout((currentLayout) => ({
        ...currentLayout,
        fontSizeStep: clampPresentationFontSizeStep(
          (currentLayout.fontSizeStep ?? 0) + delta,
        ),
      }));
    },
    [updateActivePresentationLayout],
  );

  const adjustActiveBlockSpacingStep = useCallback(
    (delta) => {
      updateActivePresentationLayout((currentLayout) => ({
        ...currentLayout,
        blockSpacingStep: clampPresentationBlockSpacingStep(
          Number(currentLayout.blockSpacingStep ?? 0) + delta,
        ),
      }));
    },
    [updateActivePresentationLayout],
  );

  return {
    adjustActiveBlockSpacingStep,
    adjustActiveFontSizeStep,
    setActiveShowProgressionMarkers,
    updateActivePresentationLayout,
    updatePresentationLayoutVariant,
  };
}
