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
  touchFontSizeLabel: "100%",
  showProgressionMarkers: false,
  progressionBadgeSide: "right",
  onChangeProgressionBadgeSide: vi.fn(),
  onDecreaseFontSize: vi.fn(),
  onIncreaseFontSize: vi.fn(),
  activeProgressionMarkSettings: { active: false },
  onDecreaseActiveMarkWidth: vi.fn(),
  onIncreaseActiveMarkWidth: vi.fn(),
  onDecreaseActiveMarkHeight: vi.fn(),
  onIncreaseActiveMarkHeight: vi.fn(),
  onRequestDeleteActiveMark: vi.fn(),
};

describe("ToolBoxEditControls", () => {
  it("renders the updated layout header and font size controls", () => {
    render(<ToolBoxEditControls {...baseProps} />);

    expect(screen.queryByText("Expanded Layout")).not.toBeInTheDocument();
    expect(screen.queryByText("Active layout")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Decrease font size")).toBeInTheDocument();
    expect(screen.getByLabelText("Increase font size")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.queryByText("Columns")).not.toBeInTheDocument();
    expect(screen.queryByText("Detected blocks")).not.toBeInTheDocument();
    expect(screen.getByText("Progression marks")).toBeInTheDocument();
    expect(screen.getByText("Mark tag side")).toBeInTheDocument();
    expect(screen.queryByText("Selected mark")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Off" })).toBeInTheDocument();
    expect(screen.queryByText("Show Marks")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Edit cifra")).not.toBeInTheDocument();
  });

  it("wires font size controls to the provided callbacks", () => {
    const onDecreaseFontSize = vi.fn();
    const onIncreaseFontSize = vi.fn();

    render(
      <ToolBoxEditControls
        {...baseProps}
        onDecreaseFontSize={onDecreaseFontSize}
        onIncreaseFontSize={onIncreaseFontSize}
      />,
    );

    fireEvent.click(screen.getByLabelText("Decrease font size"));
    fireEvent.click(screen.getByLabelText("Increase font size"));

    expect(onDecreaseFontSize).toHaveBeenCalledTimes(1);
    expect(onIncreaseFontSize).toHaveBeenCalledTimes(1);
  });

  it("toggles the mark badge side from the editor controls", () => {
    const onChangeProgressionBadgeSide = vi.fn();

    render(
      <ToolBoxEditControls
        {...baseProps}
        onChangeProgressionBadgeSide={onChangeProgressionBadgeSide}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Right" }));

    expect(onChangeProgressionBadgeSide).toHaveBeenCalledTimes(1);
  });

  it("does not render the legacy marks editor entry point", () => {
    render(<ToolBoxEditControls {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: /edit marks/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mark editor")).not.toBeInTheDocument();
  });

  it("shows selected mark dimensions only while editing a selected mark", () => {
    const onIncreaseActiveMarkHeight = vi.fn();
    const onDecreaseActiveMarkWidth = vi.fn();
    const onRequestDeleteActiveMark = vi.fn();

    render(
      <ToolBoxEditControls
        {...baseProps}
        isEditing
        activeProgressionMarkSettings={{
          active: true,
          label: "C",
          width: 642,
          height: 718,
        }}
        onIncreaseActiveMarkHeight={onIncreaseActiveMarkHeight}
        onDecreaseActiveMarkWidth={onDecreaseActiveMarkWidth}
        onRequestDeleteActiveMark={onRequestDeleteActiveMark}
      />,
    );

    expect(screen.getByText("Selected mark")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("642px")).toBeInTheDocument();
    expect(screen.getByText("718px")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Increase selected mark height"));
    fireEvent.click(screen.getByLabelText("Decrease selected mark width"));
    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(onIncreaseActiveMarkHeight).toHaveBeenCalledTimes(1);
    expect(onDecreaseActiveMarkWidth).toHaveBeenCalledTimes(1);
    expect(onRequestDeleteActiveMark).toHaveBeenCalledTimes(1);
  });
});
