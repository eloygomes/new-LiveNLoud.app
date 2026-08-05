import { fireEvent, render, screen } from "@testing-library/react";
import ChordLibrary from "./ChordLibrary";

vi.mock("./ChordDisplay", () => ({
  default: function ChordDisplayMock({ chordName, fingering, size }) {
    return (
      <div data-testid="chord-display" data-size={size}>
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

  it("uses the full editorial workspace on portrait tablets", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    render(<ChordLibrary />);

    expect(screen.getByTestId("tablet-tool-shell")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Build voicings that serve the song.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Chord library workspace illustration",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("chord-display")).toHaveAttribute(
      "data-size",
      "300",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Minor", pressed: false }),
    );

    expect(screen.getByText("Chord display: Cm")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Minor", pressed: true }),
    ).toBeInTheDocument();
  });
});
