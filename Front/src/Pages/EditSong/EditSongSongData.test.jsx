import { fireEvent, render, screen } from "@testing-library/react";
import EditSongSongData from "./EditSongSongData";

describe("EditSongSongData compact layout", () => {
  it("uses the same stacked song-data hierarchy as New Song", () => {
    const setSongName = vi.fn();
    const setArtistName = vi.fn();
    const onIdentityChange = vi.fn();
    render(
      <EditSongSongData
        songName="Vento no Litoral"
        artistName="Legião Urbana"
        capoData="2"
        tomData="D"
        tunerData="Standard"
        touchLayout
        compact
        setSongName={setSongName}
        setArtistName={setArtistName}
        onIdentityChange={onIdentityChange}
      />,
    );

    const songInput = screen.getByLabelText("Song");
    const artistInput = screen.getByLabelText("Artist");
    const songGrid = songInput.parentElement?.parentElement;
    expect(songGrid).toHaveClass("grid-cols-1");
    expect(artistInput.parentElement?.parentElement).toBe(songGrid);
    expect(screen.getByText("Capo").parentElement).toHaveClass(
      "rounded-[12px]",
    );

    fireEvent.change(songInput, { target: { value: "Vento" } });
    fireEvent.change(artistInput, { target: { value: "Legião" } });
    expect(setSongName).toHaveBeenCalledWith("Vento");
    expect(setArtistName).toHaveBeenCalledWith("Legião");
    expect(onIdentityChange).toHaveBeenCalledTimes(2);
  });
});
