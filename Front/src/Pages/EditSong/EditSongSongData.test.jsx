import { render, screen } from "@testing-library/react";
import EditSongSongData from "./EditSongSongData";

describe("EditSongSongData compact layout", () => {
  it("uses the same stacked song-data hierarchy as New Song", () => {
    render(
      <EditSongSongData
        songName="Vento no Litoral"
        artistName="Legião Urbana"
        capoData="2"
        tomData="D"
        tunerData="Standard"
        touchLayout
        compact
      />,
    );

    const songGrid = screen.getByText("Vento no Litoral").parentElement?.parentElement;
    expect(songGrid).toHaveClass("grid-cols-1");
    expect(screen.getByText("Legião Urbana").parentElement?.parentElement).toBe(
      songGrid,
    );
    expect(screen.getByText("Capo").parentElement).toHaveClass(
      "rounded-[12px]",
    );
  });
});
