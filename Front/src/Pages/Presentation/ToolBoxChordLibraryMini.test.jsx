import { fireEvent, render, screen } from "@testing-library/react";
import ToolBoxChordLibraryMini from "./ToolBoxChordLibraryMini";

vi.mock("../ChordLibrary/ChordDisplay", () => ({
  default: function ChordDisplayMock({ chordName }) {
    return <div>Preview chord: {chordName}</div>;
  },
}));

describe("ToolBoxChordLibraryMini", () => {
  it("renders the default mini chord preview", () => {
    render(<ToolBoxChordLibraryMini />);

    expect(screen.getByText("Preview chord: C")).toBeInTheDocument();
    expect(screen.getByText("1/24")).toBeInTheDocument();
    expect(screen.getByText("Preview chord: C")).toBeInTheDocument();
  });

  it("updates the chord label when the selects change", () => {
    render(<ToolBoxChordLibraryMini />);

    fireEvent.change(screen.getByLabelText("Root"), {
      target: { value: "D" },
    });
    fireEvent.change(screen.getByLabelText("Mode"), {
      target: { value: "Minor" },
    });

    expect(screen.getByText("Dm")).toBeInTheDocument();
    expect(screen.getByText("Preview chord: Dm")).toBeInTheDocument();
  });

  it("opens the preview with the current chord data", () => {
    const onOpenPreview = vi.fn();

    render(<ToolBoxChordLibraryMini onOpenPreview={onOpenPreview} />);

    fireEvent.click(
      screen.getByRole("button", { name: /preview chord: c click to enlarge/i }),
    );

    expect(onOpenPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        chordName: "C",
        fingering: expect.any(Object),
      }),
    );
  });
});
