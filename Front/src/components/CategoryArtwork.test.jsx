import { render, screen } from "@testing-library/react";
import CategoryArtwork from "./CategoryArtwork";

describe("CategoryArtwork", () => {
  it("selects the requested panel from the shared illustration strip", () => {
    render(
      <CategoryArtwork
        src="/illustrations.jpg"
        index={3}
        label="Metronome illustration"
        className="relative h-20 w-20"
      />,
    );

    const artwork = screen.getByRole("img", {
      name: "Metronome illustration",
    });
    expect(artwork).toHaveClass("relative", "h-20", "w-20");
    expect(artwork.querySelector("img")).toHaveStyle({
      transform: "translateX(-60%) translateY(-50%)",
    });
  });

  it("keeps invalid panel indexes inside the available range", () => {
    const { rerender } = render(
      <CategoryArtwork src="/illustrations.jpg" index={99} label="Last panel" />,
    );

    expect(screen.getByRole("img", { name: "Last panel" }).querySelector("img"))
      .toHaveStyle({ transform: "translateX(-80%) translateY(-50%)" });

    rerender(
      <CategoryArtwork src="/illustrations.jpg" index={-4} label="First panel" />,
    );
    expect(screen.getByRole("img", { name: "First panel" }).querySelector("img"))
      .toHaveStyle({ transform: "translateX(-0%) translateY(-50%)" });
  });
});
