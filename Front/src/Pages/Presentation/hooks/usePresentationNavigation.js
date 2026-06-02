import { useCallback, useMemo } from "react";
import { normalizePresentationInstrumentValue } from "../helpers/presentationUtils";

export function usePresentationNavigation({
  artistFromURL,
  decodedRouteArtist,
  decodedRouteInstrument,
  decodedRouteSong,
  instrumentSelected,
  navigate,
  resetTransientPresentationState,
  setArtistFromURL,
  setEmbedLinks,
  setInstrumentSelected,
  setIsRouteSongLoading,
  setSongDataFetched,
  setSongFromURL,
  setlistSongs,
  songFromURL,
}) {
  const navigatePresentationPath = useCallback(
    (path) => {
      resetTransientPresentationState();

      if (
        document.fullscreenElement &&
        typeof document.exitFullscreen === "function"
      ) {
        try {
          document.exitFullscreen();
        } catch (error) {
          console.warn("Failed to exit fullscreen before navigation:", error);
        }
      }

      if (window.location.pathname === path) {
        setIsRouteSongLoading(false);
        return;
      }

      navigate(path);
    },
    [navigate, resetTransientPresentationState, setIsRouteSongLoading],
  );

  const goToInstrument = useCallback(
    (instrumentKey) => {
      if (!instrumentKey) return;

      const nextInstrument =
        normalizePresentationInstrumentValue(instrumentKey);
      setIsRouteSongLoading(true);
      setInstrumentSelected(nextInstrument);

      navigatePresentationPath(
        `/presentation/${encodeURIComponent(
          decodedRouteArtist || artistFromURL || "",
        )}/${encodeURIComponent(decodedRouteSong || songFromURL || "")}/${encodeURIComponent(
          nextInstrument,
        )}`,
      );
    },
    [
      artistFromURL,
      decodedRouteArtist,
      decodedRouteSong,
      navigatePresentationPath,
      setInstrumentSelected,
      setIsRouteSongLoading,
      songFromURL,
    ],
  );

  const goToEditSong = useCallback(() => {
    localStorage.setItem("song", songFromURL || "");
    localStorage.setItem("artist", artistFromURL || "");

    navigate(
      `/editsong/${encodeURIComponent(
        decodedRouteArtist || artistFromURL || "",
      )}/${encodeURIComponent(decodedRouteSong || songFromURL || "")}`,
    );
  }, [
    artistFromURL,
    decodedRouteArtist,
    decodedRouteSong,
    navigate,
    songFromURL,
  ]);

  const currentSetlistSongIndex = useMemo(() => {
    const normalizedArtist = (artistFromURL || decodedRouteArtist)
      .trim()
      .toLowerCase();
    const normalizedSong = (songFromURL || decodedRouteSong)
      .trim()
      .toLowerCase();

    if (!normalizedArtist || !normalizedSong) return -1;

    return setlistSongs.findIndex(
      (song) =>
        (song.artist || "").trim().toLowerCase() === normalizedArtist &&
        (song.song || "").trim().toLowerCase() === normalizedSong,
    );
  }, [
    artistFromURL,
    decodedRouteArtist,
    decodedRouteSong,
    setlistSongs,
    songFromURL,
  ]);

  const previousSetlistSong =
    currentSetlistSongIndex > 0
      ? setlistSongs[currentSetlistSongIndex - 1]
      : null;
  const nextSetlistSong =
    currentSetlistSongIndex >= 0 &&
    currentSetlistSongIndex < setlistSongs.length - 1
      ? setlistSongs[currentSetlistSongIndex + 1]
      : null;

  const goToSetlistSong = useCallback(
    (song) => {
      if (!song) return;

      const nextArtist = String(song.artist || "").trim();
      const nextSong = String(song.song || "").trim();
      if (!nextArtist || !nextSong) return;

      const nextInstrument = instrumentSelected || decodedRouteInstrument;
      setIsRouteSongLoading(true);
      setArtistFromURL(nextArtist);
      setSongFromURL(nextSong);
      setSongDataFetched(undefined);
      setEmbedLinks([]);

      navigatePresentationPath(
        `/presentation/${encodeURIComponent(nextArtist)}/${encodeURIComponent(
          nextSong,
        )}/${encodeURIComponent(nextInstrument)}`,
      );
    },
    [
      decodedRouteInstrument,
      instrumentSelected,
      navigatePresentationPath,
      setArtistFromURL,
      setEmbedLinks,
      setIsRouteSongLoading,
      setSongDataFetched,
      setSongFromURL,
    ],
  );

  return {
    goToEditSong,
    goToInstrument,
    goToSetlistSong,
    navigatePresentationPath,
    nextSetlistSong,
    previousSetlistSong,
  };
}
