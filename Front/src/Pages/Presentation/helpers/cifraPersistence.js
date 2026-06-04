import {
  buildInstrumentPresentationLayouts,
  buildSavedPresentationLayouts,
} from "../presentationLayoutHelpers";
import { setLocalStorageJsonSafe } from "../../../Tools/storageSafe";

export function buildCifraSavePayload({
  activeLayoutVariant,
  currentInstrumentData,
  instrumentSelected,
  nextDraftCifra,
  songDataFetched,
}) {
  const currentLayouts = buildInstrumentPresentationLayouts(
    currentInstrumentData,
  );
  const persistedLayouts = buildSavedPresentationLayouts(
    currentLayouts,
    activeLayoutVariant,
    nextDraftCifra,
  );
  const updatedBlock = {
    ...currentInstrumentData,
    songCifra: persistedLayouts.default.songCifra,
    presentationLayouts: persistedLayouts,
  };
  const nextSongData = {
    ...(songDataFetched || {}),
    [instrumentSelected]: updatedBlock,
    updateIn: new Date().toISOString().split("T")[0],
  };

  return {
    currentLayouts,
    nextSongData,
    persistedLayouts,
    updatedBlock,
  };
}

export function mergeSavedCifraState({
  previousSongData,
  saveResult,
  nextSongData,
  instrumentSelected,
  updatedBlock,
  persistedLayouts,
}) {
  const serverSong =
    saveResult?.song && typeof saveResult.song === "object"
      ? saveResult.song
      : {};

  return {
    ...(previousSongData || {}),
    ...nextSongData,
    ...serverSong,
    [instrumentSelected]: {
      ...(serverSong?.[instrumentSelected] || {}),
      ...updatedBlock,
      songCifra: persistedLayouts.default.songCifra,
      presentationLayouts: persistedLayouts,
    },
  };
}

export function restoreOriginalLayoutsInSongData({
  previousSongData,
  instrumentSelected,
  originalLayouts,
}) {
  if (!previousSongData || !instrumentSelected || !originalLayouts) {
    return previousSongData;
  }

  const currentInstrument = previousSongData[instrumentSelected] || {};

  return {
    ...previousSongData,
    [instrumentSelected]: {
      ...currentInstrument,
      songCifra:
        originalLayouts.default?.songCifra || currentInstrument.songCifra || "",
      presentationLayouts: originalLayouts,
    },
  };
}

export function persistPresentationLayoutsToStorage({
  storageKey,
  layouts,
}) {
  if (!storageKey || typeof window === "undefined" || !layouts) return;

  setLocalStorageJsonSafe(storageKey, layouts);
}
