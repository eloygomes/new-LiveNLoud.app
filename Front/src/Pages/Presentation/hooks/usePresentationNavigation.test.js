import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePresentationNavigation } from "./usePresentationNavigation";

const baseProps = () => ({
  artistFromURL: "Current Artist",
  decodedRouteArtist: "Current Artist",
  decodedRouteInstrument: "keys",
  decodedRouteSong: "Current Song",
  instrumentSelected: "keys",
  navigate: vi.fn(),
  resetTransientPresentationState: vi.fn(),
  setArtistFromURL: vi.fn(),
  setEmbedLinks: vi.fn(),
  setInstrumentSelected: vi.fn(),
  setIsRouteSongLoading: vi.fn(),
  setSongDataFetched: vi.fn(),
  setSongFromURL: vi.fn(),
  setlistSongs: [
    { artist: "Previous Artist", song: "Previous Song" },
    { artist: "Current Artist", song: "Current Song" },
    { artist: "Next Artist", song: "Next Song" },
  ],
  songFromURL: "Current Song",
});

describe("usePresentationNavigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, "", "/presentation/Current%20Artist/Current%20Song/keys");
  });

  it("exposes previous and next setlist songs", () => {
    const props = baseProps();
    const { result } = renderHook(() => usePresentationNavigation(props));

    expect(result.current.previousSetlistSong).toEqual({
      artist: "Previous Artist",
      song: "Previous Song",
    });
    expect(result.current.nextSetlistSong).toEqual({
      artist: "Next Artist",
      song: "Next Song",
    });
  });

  it("navigates to an instrument with normalized aliases", () => {
    const props = baseProps();
    const { result } = renderHook(() => usePresentationNavigation(props));

    act(() => {
      result.current.goToInstrument("keyboard");
    });

    expect(props.setIsRouteSongLoading).toHaveBeenCalledWith(true);
    expect(props.setInstrumentSelected).toHaveBeenCalledWith("keys");
    expect(props.resetTransientPresentationState).toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
    expect(props.setIsRouteSongLoading).toHaveBeenLastCalledWith(false);
  });

  it("navigates to a different setlist song and clears loaded song data", () => {
    const props = baseProps();
    const { result } = renderHook(() => usePresentationNavigation(props));

    act(() => {
      result.current.goToSetlistSong({
        artist: "Next Artist",
        song: "Next Song",
      });
    });

    expect(props.setArtistFromURL).toHaveBeenCalledWith("Next Artist");
    expect(props.setSongFromURL).toHaveBeenCalledWith("Next Song");
    expect(props.setSongDataFetched).toHaveBeenCalledWith(undefined);
    expect(props.setEmbedLinks).toHaveBeenCalledWith([]);
    expect(props.navigate).toHaveBeenCalledWith(
      "/presentation/Next%20Artist/Next%20Song/keys",
    );
  });

  it("can preserve live mode while navigating setlist songs", () => {
    const props = baseProps();
    const { result } = renderHook(() => usePresentationNavigation(props));

    act(() => {
      result.current.goToSetlistSong(
        {
          artist: "Next Artist",
          song: "Next Song",
        },
        { preserveLiveMode: true },
      );
    });

    expect(
      window.sessionStorage.getItem("presentation:preserve-live-navigation"),
    ).toMatch(/^\d+$/);
    expect(props.navigate).toHaveBeenCalledWith(
      "/presentation/Next%20Artist/Next%20Song/keys",
    );
  });

  it("stores route context before navigating to edit song", () => {
    const props = baseProps();
    const { result } = renderHook(() => usePresentationNavigation(props));

    act(() => {
      result.current.goToEditSong();
    });

    expect(window.localStorage.getItem("song")).toBe("Current Song");
    expect(window.localStorage.getItem("artist")).toBe("Current Artist");
    expect(props.navigate).toHaveBeenCalledWith(
      "/editsong/Current%20Artist/Current%20Song",
    );
  });
});
