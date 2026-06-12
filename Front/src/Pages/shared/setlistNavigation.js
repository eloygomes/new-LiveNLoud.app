import {
  fetchUserSongs,
  loadDashboardVisibleSongs,
  loadSelectedSetlists,
} from "../../Tools/Controllers";

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

export function findSongIndexInList(songs = [], artist = "", song = "") {
  const normalizedArtist = normalizeText(artist);
  const normalizedSong = normalizeText(song);

  if (!normalizedArtist || !normalizedSong) return -1;

  return songs.findIndex(
    (entry) =>
      normalizeText(entry.artist) === normalizedArtist &&
      normalizeText(entry.song) === normalizedSong,
  );
}

export async function loadActiveSetlistSongs(artist = "", song = "") {
  const currentArtist = normalizeText(artist);
  const currentSong = normalizeText(song);
  const dashboardVisibleSongs = loadDashboardVisibleSongs();

  if (dashboardVisibleSongs.length && currentArtist && currentSong) {
    const currentSongIsVisibleOnDashboard =
      findSongIndexInList(dashboardVisibleSongs, currentArtist, currentSong) >= 0;

    if (currentSongIsVisibleOnDashboard) return dashboardVisibleSongs;
  }

  const selectedSetlists = loadSelectedSetlists().map(normalizeText);
  const { songs } = await fetchUserSongs();

  if (!selectedSetlists.length) return songs;

  return songs.filter((entry) => {
    const songSetlists = (entry.setlist || []).map(normalizeText);
    return selectedSetlists.some((setlist) => songSetlists.includes(setlist));
  });
}

export function getAdjacentSetlistSongs(songs = [], artist = "", song = "") {
  const currentIndex = findSongIndexInList(songs, artist, song);

  return {
    currentIndex,
    previousSetlistSong:
      currentIndex > 0 ? songs[currentIndex - 1] : null,
    nextSetlistSong:
      currentIndex >= 0 && currentIndex < songs.length - 1
        ? songs[currentIndex + 1]
        : null,
  };
}
