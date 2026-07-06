import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TollBoxAcoord from "./TollBoxAcoord";

const baseProps = {
  embedLinks: [],
  setLinktoplay: vi.fn(),
  setVideoModalStatus: vi.fn(),
  setChordModalStatus: vi.fn(),
  setChordPreviewData: vi.fn(),
  songFromURL: "Song",
  artistFromURL: "Artist",
  instrumentSelected: "keys",
  songDataFetched: {
    instruments: {
      keys: true,
      guitar01: false,
      guitar02: false,
      bass: false,
      drums: false,
      voice: false,
    },
  },
  isEditing: false,
  isSavingCifra: false,
  hasDraftChanges: false,
  songCifraData: "C G\nAmazing grace",
  handleSaveCifra: vi.fn(),
  handleDiscardDraft: vi.fn(),
  startEditingCifra: vi.fn(),
  onToggleMarksVisibility: vi.fn(),
  transposeSteps: 0,
  setTransposeSteps: vi.fn(),
  displayKey: "C",
  showProgressionMarkers: true,
  touchFontSizeLabel: "100%",
  decreaseTouchFontSize: vi.fn(),
  increaseTouchFontSize: vi.fn(),
  blockSpacingLabel: "32px",
  decreaseBlockSpacing: vi.fn(),
  increaseBlockSpacing: vi.fn(),
  onSelectInstrument: vi.fn(),
};

describe("TollBoxAcoord", () => {
  it("does not expose editor in the generic toolbox menu", () => {
    render(<TollBoxAcoord {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: "Editor" }),
    ).not.toBeInTheDocument();
  });

  it("uses the shared marks toggle callback inside the requested editor panel", () => {
    const onToggleMarksVisibility = vi.fn();

    render(
      <TollBoxAcoord
        {...baseProps}
        onToggleMarksVisibility={onToggleMarksVisibility}
        requestedPanel={{ id: "panel-editor", requestId: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "On" }));

    expect(onToggleMarksVisibility).toHaveBeenCalledTimes(1);
  });

  it("exposes font size and block spacing controls inside the requested editor panel", () => {
    const decreaseTouchFontSize = vi.fn();
    const increaseTouchFontSize = vi.fn();
    const decreaseBlockSpacing = vi.fn();
    const increaseBlockSpacing = vi.fn();

    render(
      <TollBoxAcoord
        {...baseProps}
        requestedPanel={{ id: "panel-editor", requestId: 1 }}
        decreaseTouchFontSize={decreaseTouchFontSize}
        increaseTouchFontSize={increaseTouchFontSize}
        decreaseBlockSpacing={decreaseBlockSpacing}
        increaseBlockSpacing={increaseBlockSpacing}
      />,
    );

    fireEvent.click(screen.getByLabelText("Decrease font size"));
    fireEvent.click(screen.getByLabelText("Increase font size"));
    fireEvent.click(screen.getByLabelText("Decrease block spacing"));
    fireEvent.click(screen.getByLabelText("Increase block spacing"));

    expect(decreaseTouchFontSize).toHaveBeenCalledTimes(1);
    expect(increaseTouchFontSize).toHaveBeenCalledTimes(1);
    expect(decreaseBlockSpacing).toHaveBeenCalledTimes(1);
    expect(increaseBlockSpacing).toHaveBeenCalledTimes(1);
  });

  it("opens the editor panel on touch when requested by the presentation edit button", () => {
    const setActiveTouchPanel = vi.fn();

    const { rerender } = render(
      <TollBoxAcoord
        {...baseProps}
        isTouchLayout
        setActiveTouchPanel={setActiveTouchPanel}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Editor/i }),
    ).not.toBeInTheDocument();

    rerender(
      <TollBoxAcoord
        {...baseProps}
        isTouchLayout
        setActiveTouchPanel={setActiveTouchPanel}
        requestedPanel={{ id: "panel-editor", requestId: 1 }}
      />,
    );

    expect(setActiveTouchPanel).toHaveBeenCalledWith("panel-editor");
  });
});
