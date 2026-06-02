import { useCallback, useState } from "react";
import { updateInstrumentNotes } from "../../../Tools/Controllers";

export function usePresentationInstrumentNotes({
  artistFromURL,
  currentInstrumentData,
  instrumentSelected,
  pushSnackbarMessage,
  setNotesModalStatus,
  setSongDataFetched,
  songFromURL,
}) {
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const instrumentNotes = currentInstrumentData?.notes || "";

  const handleInstrumentNotesChange = useCallback(
    (plainText) => {
      setSongDataFetched((prev) => {
        if (!prev || !instrumentSelected) return prev;
        return {
          ...prev,
          [instrumentSelected]: {
            ...(prev[instrumentSelected] || {}),
            notes: String(plainText || ""),
          },
        };
      });
    },
    [instrumentSelected, setSongDataFetched],
  );

  const handleSaveInstrumentNotes = useCallback(
    async (plainText) => {
      if (!artistFromURL || !songFromURL || !instrumentSelected) {
        pushSnackbarMessage("Erro", "Sem dados da música para salvar notas.");
        return;
      }

      try {
        setIsSavingNotes(true);
        const result = await updateInstrumentNotes({
          artist: artistFromURL,
          song: songFromURL,
          instrument: instrumentSelected,
          notes: plainText,
        });
        if (result?.song) {
          setSongDataFetched((prev) => {
            if (!prev || !instrumentSelected) return result.song;

            const previousInstrument = prev[instrumentSelected] || {};
            const nextInstrument = result.song?.[instrumentSelected] || {};

            return {
              ...prev,
              ...result.song,
              [instrumentSelected]: {
                ...nextInstrument,
                presentationLayouts:
                  nextInstrument.presentationLayouts ||
                  previousInstrument.presentationLayouts,
                songCifra:
                  nextInstrument.songCifra || previousInstrument.songCifra,
              },
            };
          });
        } else {
          handleInstrumentNotesChange(plainText);
        }
        pushSnackbarMessage("Salvo", "Notas salvas com sucesso.");
      } catch (error) {
        console.error("Erro ao salvar notas:", error);
        pushSnackbarMessage("Erro", "Não foi possível salvar as notas.");
      } finally {
        setIsSavingNotes(false);
      }
    },
    [
      artistFromURL,
      handleInstrumentNotesChange,
      instrumentSelected,
      pushSnackbarMessage,
      setSongDataFetched,
      songFromURL,
    ],
  );

  const openInstrumentNotesWindow = useCallback(() => {
    setNotesModalStatus(true);
    pushSnackbarMessage("Notes", "Notas abertas para este instrumento.");
  }, [pushSnackbarMessage, setNotesModalStatus]);

  return {
    handleInstrumentNotesChange,
    handleSaveInstrumentNotes,
    instrumentNotes,
    isSavingNotes,
    openInstrumentNotesWindow,
  };
}
