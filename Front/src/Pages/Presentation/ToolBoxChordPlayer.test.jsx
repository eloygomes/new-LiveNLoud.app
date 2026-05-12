import { fireEvent, render, screen } from "@testing-library/react";
import ToolBoxChordPlayer from "./ToolBoxChordPlayer";

vi.mock("../ChordLibrary/ChordDisplay", () => ({
  default: function ChordDisplayMock({ chordName }) {
    return <div>Player chord: {chordName}</div>;
  },
}));

describe("ToolBoxChordPlayer", () => {
  it("renders nothing when there is no preview data", () => {
    const { container } = render(
      <ToolBoxChordPlayer
        chordPreviewData={null}
        setChordModalStatus={vi.fn()}
        setChordPreviewData={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the selected chord preview", () => {
    render(
      <ToolBoxChordPlayer
        chordPreviewData={{
          chordName: "C",
          chordType: "maj7",
          fingering: { frets: [0, 1, 0, 2, 3, 0], fingers: [0, 1, 0, 2, 3, 0] },
        }}
        setChordModalStatus={vi.fn()}
        setChordPreviewData={vi.fn()}
      />,
    );

    expect(screen.getByText("C maj7")).toBeInTheDocument();
    expect(screen.getByText("Player chord: C maj7")).toBeInTheDocument();
  });

  it("clears the preview when the close button is clicked", () => {
    const setChordModalStatus = vi.fn();
    const setChordPreviewData = vi.fn();

    render(
      <ToolBoxChordPlayer
        chordPreviewData={{
          chordName: "C",
          chordType: "",
          fingering: { frets: [0, 1, 0, 2, 3, 0], fingers: [0, 1, 0, 2, 3, 0] },
        }}
        setChordModalStatus={setChordModalStatus}
        setChordPreviewData={setChordPreviewData}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close chord window" }));

    expect(setChordModalStatus).toHaveBeenCalledWith(false);
    expect(setChordPreviewData).toHaveBeenCalledWith(null);
  });
});
