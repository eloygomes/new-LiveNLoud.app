import { fireEvent, render, screen } from "@testing-library/react";
import PresentationChordTooltip, {
  findChordTooltipData,
} from "./PresentationChordTooltip";

describe("findChordTooltipData", () => {
  it("returns null for an invalid chord label", () => {
    expect(findChordTooltipData("???")).toBeNull();
  });

  it("returns chord data for a valid chord", () => {
    const result = findChordTooltipData("C");

    expect(result).toEqual(
      expect.objectContaining({
        chordLabel: "C",
        variations: expect.any(Array),
      }),
    );
    expect(result.variations.length).toBeGreaterThan(0);
  });
});

describe("PresentationChordTooltip", () => {
  const tooltip = {
    position: { x: 10, y: 20 },
    data: {
      chordId: "chord-1",
      chordLabel: "C",
      variations: [
        {
          id: "var-1",
          fingering: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
          variationNumber: 1,
        },
        {
          id: "var-2",
          fingering: { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0] },
          variationNumber: 2,
        },
      ],
    },
  };

  it("renders the compact tooltip", () => {
    render(
      <PresentationChordTooltip
        tooltip={tooltip}
        selectedVariationIndex={0}
        onApplyVariation={vi.fn()}
      />,
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change position" }),
    ).toBeInTheDocument();
  });

  it("expands and applies a new variation", () => {
    const onApplyVariation = vi.fn();

    render(
      <PresentationChordTooltip
        tooltip={tooltip}
        selectedVariationIndex={0}
        onApplyVariation={onApplyVariation}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change position" }));
    fireEvent.click(screen.getByRole("button", { name: /Variacao 2/i }));
    fireEvent.click(screen.getByRole("button", { name: "ok" }));

    expect(onApplyVariation).toHaveBeenCalledWith({
      chordLabel: "C",
      chordId: "chord-1",
      variationIndex: 1,
      applyToAll: true,
    });
  });
});
