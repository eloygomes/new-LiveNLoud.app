import { fireEvent, render, screen } from "@testing-library/react";
import ChordLibrary from "./ChordLibrary";

vi.mock("./ChordDisplay", () => ({
  default: function ChordDisplayMock({ chordName, fingering }) {
    return (
      <div>
        <div>Chord display: {chordName}</div>
        <div>Frets: {(fingering?.frets || []).join(",")}</div>
      </div>
    );
  },
}));

describe("ChordLibrary", () => {
  it("renders the default chord on desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    render(<ChordLibrary />);

    expect(screen.getByText("CHORD LIBRARY")).toBeInTheDocument();
    expect(screen.getByText("Chord display: C")).toBeInTheDocument();
    expect(screen.getByText(/^\d+\/\d+$/)).toBeInTheDocument();
  });

  it("changes the chord when the user selects a different root and mode", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    render(<ChordLibrary />);

    fireEvent.click(screen.getAllByRole("button", { name: "D" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Minor" }));

    expect(screen.getByText("Chord display: Dm")).toBeInTheDocument();
    expect(screen.getAllByText("D").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Minor").length).toBeGreaterThan(0);
  });

  it("cycles to the next variation when more than one is available", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    render(<ChordLibrary />);

    const initialCounter = screen.getByText(/^\d+\/\d+$/).textContent;
    const initialFretText = screen.getByText(/^Frets:/).textContent;

    fireEvent.click(screen.getByRole("button", { name: "Next variation" }));

    expect(screen.getByText(/^\d+\/\d+$/).textContent).not.toBe(initialCounter);
    expect(screen.getByText(/^Frets:/).textContent).not.toBe(initialFretText);
  });
});
