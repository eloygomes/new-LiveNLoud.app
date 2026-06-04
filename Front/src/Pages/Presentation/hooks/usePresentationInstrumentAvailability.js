import { useMemo } from "react";
import { PRESENTATION_INSTRUMENTS } from "../helpers/presentationConstants";
import {
  instrumentHasPresentationContent,
  isInstrumentRegistered,
} from "../helpers/presentationUtils";

export function usePresentationInstrumentAvailability({
  instrumentSelected,
  songDataFetched,
}) {
  const availableInstrumentOptions = useMemo(() => {
    if (!songDataFetched) return [];

    return PRESENTATION_INSTRUMENTS.filter(
      (instrument) =>
        isInstrumentRegistered(songDataFetched, instrument.key) &&
        instrumentHasPresentationContent(songDataFetched[instrument.key]),
    );
  }, [songDataFetched]);

  const isCurrentInstrumentUnavailable = Boolean(
    songDataFetched &&
      instrumentSelected &&
      (!isInstrumentRegistered(songDataFetched, instrumentSelected) ||
        !instrumentHasPresentationContent(songDataFetched[instrumentSelected])),
  );

  return {
    availableInstrumentOptions,
    isCurrentInstrumentUnavailable,
  };
}
