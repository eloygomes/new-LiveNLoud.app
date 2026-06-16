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
};

describe("ToolBoxEditControls", () => {
  it("renders only the edit entry point outside edit mode", () => {
    render(<ToolBoxEditControls {...baseProps} />);

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Decrease font size")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Increase font size")).not.toBeInTheDocument();
    expect(screen.queryByText("Block spacing")).not.toBeInTheDocument();
    expect(screen.queryByText("Progression marks")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Discard" })).not.toBeInTheDocument();
  });

  it("starts cifra editing from the edit button", () => {
    const startEditingCifra = vi.fn();

    render(
      <ToolBoxEditControls
        {...baseProps}
        startEditingCifra={startEditingCifra}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(startEditingCifra).toHaveBeenCalledTimes(1);
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

  it("renders save and discard while editing", () => {
    render(
      <ToolBoxEditControls
        {...baseProps}
        isEditing
        hasDraftChanges
      />,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
