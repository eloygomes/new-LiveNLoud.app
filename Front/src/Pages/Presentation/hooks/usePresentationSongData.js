import { useMemo } from "react";
import { buildInstrumentPresentationLayouts } from "../presentationLayoutHelpers";

export function usePresentationSongData({
  instrumentSelected,
  isExpandedCifra,
  normalizeCifra,
  songDataFetched,
}) {
  const currentInstrumentData = useMemo(() => {
    if (!songDataFetched || !instrumentSelected) return {};
    return songDataFetched[instrumentSelected] || {};
  }, [songDataFetched, instrumentSelected]);

  const activeLayoutVariant = isExpandedCifra ? "expanded" : "default";
  const instrumentPresentationLayouts = useMemo(
    () => buildInstrumentPresentationLayouts(currentInstrumentData),
    [currentInstrumentData],
  );
  const activePresentationLayout =
    instrumentPresentationLayouts[activeLayoutVariant];
  const songCifraData = activePresentationLayout?.songCifra || "";
  const isTwoColumns = isExpandedCifra;
  const showProgressionMarkers = Boolean(
    activePresentationLayout?.showProgressionMarkers,
  );
  const progressionMarkOverrides =
    activePresentationLayout?.progressionMarkOverrides || {};
  const touchFontSizeStep = activePresentationLayout?.fontSizeStep ?? 0;
  const blockSpacingStep = activePresentationLayout?.blockSpacingStep ?? 0;
  const activeLayoutLabel = isExpandedCifra
    ? "Expanded layout"
    : "Default layout";

  const normalizedSongCifra = useMemo(
    () => normalizeCifra(songCifraData),
    [songCifraData, normalizeCifra],
  );
  const editableSongCifra = normalizedSongCifra;

  const contentSelected = normalizedSongCifra;

  return {
    activeLayoutLabel,
    activeLayoutVariant,
    activePresentationLayout,
    blockSpacingStep,
    contentSelected,
    currentInstrumentData,
    editableSongCifra,
    instrumentPresentationLayouts,
    isTwoColumns,
    progressionMarkOverrides,
    showProgressionMarkers,
    songCifraData,
    touchFontSizeStep,
  };
}
