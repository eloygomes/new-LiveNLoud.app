import { useMemo } from "react";
import { buildInstrumentPresentationLayouts } from "../presentationLayoutHelpers";

export function usePresentationSongData({
  instrumentSelected,
  isExpandedCifra,
  normalizeCifra,
  selectContenttoShow,
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
  const songLyrics = currentInstrumentData?.songLyrics || "";
  const songChords = currentInstrumentData?.songChords || "";
  const songTabs = currentInstrumentData?.songTabs || "";
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

  const contentSelected = useMemo(() => {
    const defaultContent =
      normalizedSongCifra || songChords || songTabs || songLyrics || "";

    switch (selectContenttoShow) {
      case "tabs":
        return songTabs;
      case "chords":
        return songChords;
      case "lyrics":
        return songLyrics;
      case "full":
        return defaultContent;
      default:
        return defaultContent;
    }
  }, [
    selectContenttoShow,
    normalizedSongCifra,
    songLyrics,
    songChords,
    songTabs,
  ]);

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
