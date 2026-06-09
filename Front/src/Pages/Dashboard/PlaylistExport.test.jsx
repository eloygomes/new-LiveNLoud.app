import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlaylistExport from "./PlaylistExport";
import { startSpotifyLogin } from "./spotifyAuth";
import { pickJwtToken, startYouTubeLoginPopup } from "./youtubeAuth";

vi.mock("./spotifyAuth", () => ({
  startSpotifyLogin: vi.fn(),
}));

vi.mock("./youtubeAuth", () => ({
  pickJwtToken: vi.fn(),
  startYouTubeLoginPopup: vi.fn(),
}));

vi.mock("../../Tools/dateFormat", () => ({
  formatDisplayDate: vi.fn(() => "12 / 05 / 2026"),
}));

describe("PlaylistExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables provider buttons when there are no visible songs", () => {
    render(<PlaylistExport visibleSongs={[]} />);

    expect(screen.getByRole("button", { name: /spotify/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /youtube/i })).toBeDisabled();
  });

  it("starts the spotify flow and saves the payload in sessionStorage", async () => {
    render(
      <PlaylistExport
        visibleSongs={[{ song: "Oceans", artist: "Hillsong" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /spotify/i }));

    const input = screen.getByDisplayValue(
      "Sustenido • 1 músicas • 12 / 05 / 2026",
    );
    fireEvent.change(input, { target: { value: "My Playlist" } });
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(startSpotifyLogin).toHaveBeenCalledTimes(1);
    });

    expect(sessionStorage.getItem("spotify_playlist_name")).toBe("My Playlist");
    expect(sessionStorage.getItem("spotify_playlist_songs")).toBe(
      JSON.stringify([{ song: "Oceans", artist: "Hillsong" }]),
    );
  });

  it("shows an error when the youtube popup login fails", async () => {
    startYouTubeLoginPopup.mockRejectedValue(new Error("Popup blocked"));

    render(
      <PlaylistExport
        visibleSongs={[{ song: "Oceans", artist: "Hillsong" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /youtube/i }));
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/falha no login do youtube/i)).toHaveTextContent(
      "Popup blocked",
    );
  });

  it("exports the stored youtube playlist after oauth success", async () => {
    pickJwtToken.mockReturnValue("jwt-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          added: 2,
          notFound: [],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    sessionStorage.setItem("youtube_playlist_name", "YT List");
    sessionStorage.setItem(
      "youtube_playlist_songs",
      JSON.stringify([
        { title: "Oceans", artist: "Hillsong" },
        { name: "Another Song", artist: "Band" },
      ]),
    );

    render(<PlaylistExport visibleSongs={[]} />);

    fireEvent(
      window,
      new MessageEvent("message", {
        origin: window.location.origin,
        data: { type: "YT_OAUTH_OK" },
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.live.eloygomes.com/api/v1/youtube/export");
    expect(options.method).toBe("POST");
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(options.headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(options.body).toBe(
      JSON.stringify({
        playlistName: "YT List",
        songs: [
          { song: "Oceans", artist: "Hillsong" },
          { song: "Another Song", artist: "Band" },
        ],
        privacyStatus: "public",
      }),
    );

    expect(
      await screen.findByText(/playlist criada! itens adicionados: 2/i),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("youtube_playlist_name")).toBeNull();
    expect(replaceStateSpy).toHaveBeenCalled();
  });
});
