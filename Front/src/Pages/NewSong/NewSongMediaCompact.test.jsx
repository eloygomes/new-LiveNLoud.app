import { render, screen } from "@testing-library/react";
import NewSongEmbed from "./NewSongEmbed";
import NewSongSetlist from "./NewSongSetlist";

vi.mock("../../Tools/Controllers", () => ({
  getAllUserSetlists: vi.fn(),
  updateUserSetlists: vi.fn(),
}));

describe("compact new-song media sections", () => {
  it("keeps the empty video state dense and uses the full input row", () => {
    const { container } = render(
      <NewSongEmbed ytEmbedSongList={[]} setEmbedLink={vi.fn()} compact />,
    );

    expect(screen.getByText("0 videos")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Insert your link here")).toHaveClass(
      "h-10",
    );
    expect(container.querySelector("ul")).not.toBeInTheDocument();
  });

  it("keeps every setlist tag the same size and places the count under the title", () => {
    render(
      <NewSongSetlist
        setlistOptions={["rehearsal", "live", "acoustic"]}
        setSetlistOptions={vi.fn()}
        setlist={["live"]}
        setSetlist={vi.fn()}
        compact
      />,
    );

    expect(screen.getByText("1/3 selected")).toBeInTheDocument();
    const tags = ["rehearsal", "live", "acoustic"].map((name) =>
      screen.getByRole("button", { name }),
    );
    for (const tag of tags) {
      expect(tag).toHaveClass("!h-10", "!w-full");
      expect(tag).not.toHaveClass("col-span-2");
    }
    expect(screen.getByText("1/3 selected")).toHaveClass(
      "text-[goldenrod]",
    );
  });
});
