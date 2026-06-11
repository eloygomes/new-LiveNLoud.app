import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlaylistExport from "./PlaylistExport";
import { startSpotifyLogin } from "./spotifyAuth";
import { startYouTubeLoginPopup } from "./youtubeAuth";

vi.mock("./spotifyAuth", () => ({
  startSpotifyLogin: vi.fn(),
}));

vi.mock("./youtubeAuth", () => ({
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

  it("starts the youtube popup flow and reports export success", async () => {
    startYouTubeLoginPopup.mockResolvedValue({
      added: 2,
      notFound: 0,
    });

    render(
      <PlaylistExport
        visibleSongs={[
          { title: "Oceans", artist: "Hillsong" },
          { name: "Another Song", artist: "Band" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /youtube/i }));

    const input = screen.getByDisplayValue(
      "Sustenido • 2 músicas • 12 / 05 / 2026",
    );
    fireEvent.change(input, { target: { value: "YT List" } });
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(startYouTubeLoginPopup).toHaveBeenCalledWith({
        returnTo: "/yt/done",
      });
    });

    expect(sessionStorage.getItem("youtube_playlist_name")).toBeNull();
    expect(sessionStorage.getItem("youtube_playlist_songs")).toBeNull();
    expect(
      await screen.findByText(/playlist criada! itens adicionados: 2/i),
    ).toBeInTheDocument();
  });

  it("stores the youtube export payload before opening the popup", async () => {
    startYouTubeLoginPopup.mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <PlaylistExport
        visibleSongs={[
          { title: "Oceans", artist: "Hillsong" },
          { name: "Another Song", artist: "Band" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /youtube/i }));
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    expect(sessionStorage.getItem("youtube_playlist_name")).toBe(
      "Sustenido • 2 músicas • 12 / 05 / 2026",
    );
    expect(sessionStorage.getItem("youtube_playlist_songs")).toBe(
      JSON.stringify([
        { title: "Oceans", artist: "Hillsong" },
        { name: "Another Song", artist: "Band" },
      ]),
    );
  });
});
