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
  progressionBadgeSide: "right",
  touchFontSizeLabel: "100%",
  decreaseTouchFontSize: vi.fn(),
  increaseTouchFontSize: vi.fn(),
  onSelectInstrument: vi.fn(),
  onChangeProgressionBadgeSide: vi.fn(),
};

describe("TollBoxAcoord", () => {
  it("uses the shared marks toggle callback inside the layout panel", () => {
    const onToggleMarksVisibility = vi.fn();

    render(
      <TollBoxAcoord
        {...baseProps}
        onToggleMarksVisibility={onToggleMarksVisibility}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
    fireEvent.click(screen.getByRole("button", { name: "On" }));

    expect(onToggleMarksVisibility).toHaveBeenCalledTimes(1);
  });
});
