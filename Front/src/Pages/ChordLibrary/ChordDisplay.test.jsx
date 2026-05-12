import { render, screen } from "@testing-library/react";
import ChordDisplay from "./ChordDisplay";

describe("ChordDisplay", () => {
  it("shows a fallback message when no fingering is provided", () => {
    render(<ChordDisplay chordName="C" />);

    expect(screen.getByText("Sem digitação")).toBeInTheDocument();
  });

  it("renders finger markers and open or muted strings", () => {
    render(
      <ChordDisplay
        chordName="C"
        fingering={{
          frets: [-1, 3, 2, 0, 1, 0],
          fingers: [0, 3, 2, 0, 1, 0],
        }}
      />,
    );

    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.getAllByText("o").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows the fret position when the chord starts above the first fret", () => {
    render(
      <ChordDisplay
        chordName="B"
        fingering={{
          frets: [-1, 2, 4, 4, 4, 2],
          fingers: [0, 1, 3, 4, 2, 1],
          firstFret: 2,
        }}
      />,
    );

    expect(screen.getByText("2fr")).toBeInTheDocument();
  });
});
