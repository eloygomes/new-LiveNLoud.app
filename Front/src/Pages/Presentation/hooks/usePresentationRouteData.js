import { useEffect, useRef } from "react";
import {
  allDataFromOneSong,
  updateLastPlayed,
} from "../../../Tools/Controllers";
import {
  buildInstrumentPresentationLayouts,
  toPresentationLayoutPayload,
} from "../presentationLayoutHelpers";
import { PRESENTATION_INSTRUMENTS } from "../helpers/presentationConstants";
import {
  getPresentationContentDebugSummary,
  getPresentationLayoutsDebugSummary,
} from "../presentationLayoutHelpers";
import {
  instrumentHasPresentationContent,
  isInstrumentRegistered,
  logPresentationDebug,
} from "../helpers/presentationUtils";
import { setLocalStorageItemSafe } from "../../../Tools/storageSafe";
import { loadActiveSetlistSongs } from "../../shared/setlistNavigation";

function hydrateSongPresentationData(rawSongData = {}) {
  const hydratedSongData = { ...rawSongData };

  PRESENTATION_INSTRUMENTS.forEach(({ key }) => {
    const instrumentData = hydratedSongData[key];
    if (!instrumentData) return;

    const sanitizedLayouts = buildInstrumentPresentationLayouts(instrumentData);

    hydratedSongData[key] = {
      ...instrumentData,
      songCifra:
        sanitizedLayouts.default.songCifra || instrumentData.songCifra || "",
      presentationLayouts: toPresentationLayoutPayload(sanitizedLayouts),
    };
  });

  return hydratedSongData;
}

function getSelectedPresentationInstrument(songData, requestedInstrument) {
  const requestedInstrumentIsAvailable =
    isInstrumentRegistered(songData, requestedInstrument) &&
    instrumentHasPresentationContent(songData[requestedInstrument]);

  if (requestedInstrumentIsAvailable) return requestedInstrument;

  return (
    PRESENTATION_INSTRUMENTS.find(
      ({ key }) =>
        isInstrumentRegistered(songData, key) &&
        instrumentHasPresentationContent(songData[key]),
    )?.key || requestedInstrument
  );
}

export function usePresentationRouteData({
  decodedRouteArtist,
  decodedRouteInstrument,
  decodedRouteSong,
  instrumentSelected,
  artistFromURL,
  songFromURL,
  navigate,
  setArtistFromURL,
  setEmbedLinks,
  setInstrumentSelected,
  setIsRouteSongLoading,
  setSetlistSongs,
  setSongDataFetched,
  setSongFromURL,
}) {
  const didPingRef = useRef(false);

  useEffect(() => {
    if (!artistFromURL || !songFromURL || !instrumentSelected) return;

    // Prevents duplicate writes in React StrictMode during local development.
    if (didPingRef.current) return;
    didPingRef.current = true;

    updateLastPlayed(songFromURL, artistFromURL, instrumentSelected).catch(
      (error) => console.error("updateLastPlayed error:", error),
    );
  }, [artistFromURL, songFromURL, instrumentSelected]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        didPingRef.current = false;

        setIsRouteSongLoading(true);
        setInstrumentSelected(decodedRouteInstrument);
        setSongFromURL(decodedRouteSong);
        setArtistFromURL(decodedRouteArtist);
        setSongDataFetched(undefined);
        setEmbedLinks([]);
        setLocalStorageItemSafe("song", decodedRouteSong);
        setLocalStorageItemSafe("artist", decodedRouteArtist);

        logPresentationDebug("fetch:start", {
          artist: decodedRouteArtist,
          song: decodedRouteSong,
          requestedInstrument: decodedRouteInstrument,
        });

        const dataFromSong = await allDataFromOneSong(
          decodedRouteArtist,
          decodedRouteSong,
        );
        const parsedSongData = JSON.parse(dataFromSong);
        const hydratedSongData = hydrateSongPresentationData(parsedSongData);

        if (!active) return;

        const selectedInstrument = getSelectedPresentationInstrument(
          hydratedSongData,
          decodedRouteInstrument,
        );

        logPresentationDebug("fetch:loaded", {
          artist: decodedRouteArtist,
          song: decodedRouteSong,
          requestedInstrument: decodedRouteInstrument,
          selectedInstrument,
          availableInstruments: PRESENTATION_INSTRUMENTS.filter(({ key }) =>
            isInstrumentRegistered(hydratedSongData, key),
          ).map(({ key }) => key),
          selectedLayouts: getPresentationLayoutsDebugSummary(
            hydratedSongData[selectedInstrument]?.presentationLayouts,
          ),
          selectedSongCifra: getPresentationContentDebugSummary(
            hydratedSongData[selectedInstrument]?.songCifra,
          ),
        });

        setSongDataFetched(hydratedSongData);
        setEmbedLinks(
          Array.isArray(hydratedSongData.embedVideos)
            ? hydratedSongData.embedVideos
            : [],
        );
        setInstrumentSelected(selectedInstrument);

        if (selectedInstrument !== decodedRouteInstrument) {
          navigate(
            `/presentation/${encodeURIComponent(
              decodedRouteArtist,
            )}/${encodeURIComponent(decodedRouteSong)}/${encodeURIComponent(
              selectedInstrument,
            )}`,
            { replace: true },
          );
        }
      } catch (error) {
        if (!active) return;
        console.error("Error fetching song data:", error);
        setSongDataFetched(null);
        setEmbedLinks([]);
      } finally {
        if (active) {
          setIsRouteSongLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [
    decodedRouteArtist,
    decodedRouteInstrument,
    decodedRouteSong,
    navigate,
    setArtistFromURL,
    setEmbedLinks,
    setInstrumentSelected,
    setIsRouteSongLoading,
    setSongDataFetched,
    setSongFromURL,
  ]);

  useEffect(() => {
    let active = true;

    const loadSetlistNavigation = async () => {
      const songs = await loadActiveSetlistSongs(
        decodedRouteArtist,
        decodedRouteSong,
      );

      if (active) setSetlistSongs(songs);
    };

    loadSetlistNavigation();

    return () => {
      active = false;
    };
  }, [decodedRouteArtist, decodedRouteSong, setSetlistSongs]);
}
