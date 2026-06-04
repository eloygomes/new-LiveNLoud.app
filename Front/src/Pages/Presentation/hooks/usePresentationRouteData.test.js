import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  allDataFromOneSong,
  fetchUserSongs,
  loadDashboardVisibleSongs,
  loadSelectedSetlists,
  updateLastPlayed,
} from "../../../Tools/Controllers";
import { usePresentationRouteData } from "./usePresentationRouteData";

vi.mock("../../../Tools/Controllers", () => ({
  allDataFromOneSong: vi.fn(),
  fetchUserSongs: vi.fn(),
  loadDashboardVisibleSongs: vi.fn(),
  loadSelectedSetlists: vi.fn(),
  updateLastPlayed: vi.fn(),
}));

const makeProps = (overrides = {}) => ({
  decodedRouteArtist: "Artist",
  decodedRouteInstrument: "drums",
  decodedRouteSong: "Song",
  instrumentSelected: "keys",
  artistFromURL: "Artist",
  songFromURL: "Song",
  navigate: vi.fn(),
  setArtistFromURL: vi.fn(),
  setEmbedLinks: vi.fn(),
  setInstrumentSelected: vi.fn(),
  setIsRouteSongLoading: vi.fn(),
  setSetlistSongs: vi.fn(),
  setSongDataFetched: vi.fn(),
  setSongFromURL: vi.fn(),
  ...overrides,
});

describe("usePresentationRouteData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    updateLastPlayed.mockResolvedValue({});
    loadDashboardVisibleSongs.mockReturnValue([]);
    loadSelectedSetlists.mockReturnValue([]);
    fetchUserSongs.mockResolvedValue({
      songs: [{ artist: "Artist", song: "Song" }],
    });
  });

  it("loads song data, picks the first available instrument and redirects", async () => {
    allDataFromOneSong.mockResolvedValue(
      JSON.stringify({
        embedVideos: ["video"],
        keys: {
          songCifra: "C G\nAvailable keys",
        },
        drums: {
          songCifra: "",
        },
      }),
    );
    const props = makeProps();

    renderHook(() => usePresentationRouteData(props));

    await waitFor(() => {
      expect(props.setSongDataFetched).toHaveBeenCalledWith(
        expect.objectContaining({
          keys: expect.objectContaining({
            presentationLayouts: expect.any(Object),
          }),
        }),
      );
    });

    expect(allDataFromOneSong).toHaveBeenCalledWith("Artist", "Song");
    expect(props.setEmbedLinks).toHaveBeenCalledWith(["video"]);
    expect(props.setInstrumentSelected).toHaveBeenLastCalledWith("keys");
    expect(props.navigate).toHaveBeenCalledWith(
      "/presentation/Artist/Song/keys",
      { replace: true },
    );
    expect(props.setIsRouteSongLoading).toHaveBeenLastCalledWith(false);
  });

  it("uses dashboard visible songs for setlist navigation when current song is visible", async () => {
    allDataFromOneSong.mockResolvedValue(
      JSON.stringify({
        keys: {
          songCifra: "C G",
        },
      }),
    );
    loadDashboardVisibleSongs.mockReturnValue([
      { artist: "Artist", song: "Song" },
    ]);
    const props = makeProps({ decodedRouteInstrument: "keys" });

    renderHook(() => usePresentationRouteData(props));

    await waitFor(() => {
      expect(props.setSetlistSongs).toHaveBeenCalledWith([
        { artist: "Artist", song: "Song" },
      ]);
    });

    expect(fetchUserSongs).not.toHaveBeenCalled();
  });
});
