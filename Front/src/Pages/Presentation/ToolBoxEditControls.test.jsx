import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ToolBoxEditControls from "./ToolBoxEditControls";

const baseProps = {
  isEditing: false,
  isSavingCifra: false,
  hasDraftChanges: false,
  songCifraData: "C G\nAmazing grace",
  handleSaveCifra: vi.fn(),
  handleDiscardDraft: vi.fn(),
  startEditingCifra: vi.fn(),
  onToggleMarksVisibility: vi.fn(),
  activeLayoutLabel: "Expanded Layout",
  blockSpacingLabel: "32px",
  onDecreaseBlockSpacing: vi.fn(),
  onIncreaseBlockSpacing: vi.fn(),
  showProgressionMarkers: false,
};

describe("ToolBoxEditControls", () => {
  it("renders editor layout controls without font size", () => {
    render(<ToolBoxEditControls {...baseProps} />);

    expect(screen.queryByText("Expanded Layout")).not.toBeInTheDocument();
    expect(screen.queryByText("Active layout")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Decrease font size")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Increase font size")).not.toBeInTheDocument();
    expect(screen.getByText("32px")).toBeInTheDocument();
    expect(screen.getByText("Block spacing")).toBeInTheDocument();
    expect(screen.queryByText("Columns")).not.toBeInTheDocument();
    expect(screen.queryByText("Detected blocks")).not.toBeInTheDocument();
    expect(screen.getByText("Progression marks")).toBeInTheDocument();
    expect(screen.queryByText("Mark tag side")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected mark")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /off/i })).toBeInTheDocument();
    expect(screen.queryByText("Show Marks")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Edit cifra")).not.toBeInTheDocument();
  });

  it("wires block spacing controls to the provided callbacks", () => {
    const onDecreaseBlockSpacing = vi.fn();
    const onIncreaseBlockSpacing = vi.fn();

    render(
      <ToolBoxEditControls
        {...baseProps}
        onDecreaseBlockSpacing={onDecreaseBlockSpacing}
        onIncreaseBlockSpacing={onIncreaseBlockSpacing}
      />,
    );

    fireEvent.click(screen.getByLabelText("Decrease block spacing"));
    fireEvent.click(screen.getByLabelText("Increase block spacing"));

    expect(onDecreaseBlockSpacing).toHaveBeenCalledTimes(1);
    expect(onIncreaseBlockSpacing).toHaveBeenCalledTimes(1);
  });

  it("does not render the legacy marks editor entry point", () => {
    render(<ToolBoxEditControls {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: /edit marks/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mark editor")).not.toBeInTheDocument();
  });

  it("does not render selected mark resize controls while editing", () => {
    render(
      <ToolBoxEditControls
        {...baseProps}
        isEditing
      />,
    );

    expect(screen.queryByText("Selected mark")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Increase selected mark height"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Decrease selected mark width"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete block" }),
    ).not.toBeInTheDocument();
  });
});
