import { render, screen } from "@testing-library/react";
import NewSongSongData from "./NewSongSongData";

describe("NewSongSongData compact touch layout", () => {
  it("stacks song and artist and presents musical metadata in boxes", () => {
    render(
      <NewSongSongData
        songName="Come Together"
        artistName="The Beatles"
        capoData="2"
        tomData="Dm"
        tunerData="Standard"
        touchLayout
        compact
      />,
    );

    const songValue = screen.getByText("Come Together");
    const artistValue = screen.getByText("The Beatles");
    const songArtistGrid = songValue.parentElement?.parentElement;

    expect(songArtistGrid).toHaveClass("grid-cols-1");
    expect(artistValue.parentElement?.parentElement).toBe(songArtistGrid);

    for (const label of ["Capo", "Key", "Tuning"]) {
      expect(screen.getByText(label).parentElement).toHaveClass(
        "rounded-[12px]",
        "bg-white/75",
      );
    }
  });
});
