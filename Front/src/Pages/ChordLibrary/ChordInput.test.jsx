import { fireEvent, render, screen } from "@testing-library/react";
import ChordInput from "./ChordInput";

describe("ChordInput", () => {
  it("updates the selected root when the Root input changes", () => {
    const setSelectedRoot = vi.fn();

    render(
      <ChordInput
        values={["C", "D"]}
        inputLabel="Root"
        setSelectedRoot={setSelectedRoot}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText("Root"));
    fireEvent.click(screen.getByRole("option", { name: "D" }));

    expect(setSelectedRoot).toHaveBeenCalledWith("D");
  });

  it("updates the selected quality when the Quality input changes", () => {
    const setSelectedQuality = vi.fn();

    render(
      <ChordInput
        values={["Major", "Minor"]}
        inputLabel="Quality"
        setSelectedQuality={setSelectedQuality}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText("Quality"));
    fireEvent.click(screen.getByRole("option", { name: "Minor" }));

    expect(setSelectedQuality).toHaveBeenCalledWith("Minor");
  });
});
