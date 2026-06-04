import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ToolBox from "./ToolBox";

vi.mock("./DraggableComponent", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("./TollBoxAcoord", () => ({
  default: () => <div>Toolbox content</div>,
}));

const baseProps = {
  toolBoxBtnStatus: true,
  setToolBoxBtnStatus: vi.fn(),
  toolBoxBtnStatusChange: vi.fn(),
  embedLinks: [],
  songFromURL: "Song",
  artistFromURL: "Artist",
  instrumentSelected: "keys",
  songDataFetched: {
    instruments: {
      keys: true,
    },
  },
  toggleTabsVisibility: vi.fn(),
  hideChords: false,
  setHideChords: vi.fn(),
  selectContenttoShow: "default",
  setSelectContenttoShow: vi.fn(),
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
  onVideoModalChange: vi.fn(),
  linktoplay: "",
  setLinktoplay: vi.fn(),
  videoModalStatus: false,
  setVideoModalStatus: vi.fn(),
  instrumentNotes: "",
  onInstrumentNotesChange: vi.fn(),
  onSaveInstrumentNotes: vi.fn(),
  notesModalStatus: false,
  setNotesModalStatus: vi.fn(),
  onOpenInstrumentNotes: vi.fn(),
  isSavingNotes: false,
  onSelectInstrument: vi.fn(),
  requestedPanel: null,
};

describe("ToolBox", () => {
  it("discards active editor changes when closing the toolbox", () => {
    const handleDiscardDraft = vi.fn();
    const toolBoxBtnStatusChange = vi.fn();
    const setToolBoxBtnStatus = vi.fn();

    render(
      <ToolBox
        {...baseProps}
        isEditing
        handleDiscardDraft={handleDiscardDraft}
        toolBoxBtnStatusChange={toolBoxBtnStatusChange}
        setToolBoxBtnStatus={setToolBoxBtnStatus}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close toolbox" }));

    expect(handleDiscardDraft).toHaveBeenCalledTimes(1);
    expect(toolBoxBtnStatusChange).toHaveBeenCalledWith(
      true,
      setToolBoxBtnStatus,
    );
  });

  it("does not discard when closing outside edit mode", () => {
    const handleDiscardDraft = vi.fn();

    render(
      <ToolBox {...baseProps} handleDiscardDraft={handleDiscardDraft} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close toolbox" }));

    expect(handleDiscardDraft).not.toHaveBeenCalled();
  });
});
