import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PresentationColumns from "./PresentationColumns";
import PresentationHorizontalNav from "./PresentationHorizontalNav";
import PresentationLiveHeader from "./PresentationLiveHeader";
import PresentationStatusState from "./PresentationStatusState";
import PresentationTopBar from "./PresentationTopBar";
import TouchVideoMenu from "./TouchVideoMenu";

vi.mock("../DraggableComponent", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../ToolBoxYT", () => ({
  default: () => <div>Inline video player</div>,
}));

describe("Presentation extracted components", () => {
  it("renders loading and unavailable status states", () => {
    const { rerender } = render(
      <PresentationStatusState
        mode="loading"
        effectiveLiveMode={false}
        songFromURL="Song"
        artistFromURL="Artist"
        instrumentSelected="keys"
        availableInstrumentOptions={[]}
        onSelectInstrument={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading song")).toBeInTheDocument();
    expect(screen.getByText("Song")).toBeInTheDocument();

    const onSelectInstrument = vi.fn();
    rerender(
      <PresentationStatusState
        mode="unavailable"
        effectiveLiveMode={false}
        songFromURL="Song"
        artistFromURL="Artist"
        instrumentSelected="drums"
        availableInstrumentOptions={[{ key: "keys", label: "Keys" }]}
        onSelectInstrument={onSelectInstrument}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keys" }));

    expect(
      screen.getByText("Esta música ainda não tem cifra para drums."),
    ).toBeInTheDocument();
    expect(onSelectInstrument).toHaveBeenCalledWith("keys");
  });

  it("fires horizontal navigation callbacks", () => {
    const onNavigate = vi.fn();
    render(
      <PresentationHorizontalNav
        open
        effectiveLiveMode={false}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Navigate left through expanded cifra",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Navigate right through expanded cifra",
      }),
    );

    expect(onNavigate).toHaveBeenNthCalledWith(1, -1);
    expect(onNavigate).toHaveBeenNthCalledWith(2, 1);
  });

  it("renders live header controls and fires callbacks", () => {
    const onDecreaseZoom = vi.fn();
    const onIncreaseZoom = vi.fn();
    const onDecreaseSpacing = vi.fn();
    const onIncreaseSpacing = vi.fn();
    const onExit = vi.fn();

    render(
      <PresentationLiveHeader
        effectiveLiveMode
        isTouchLayout={false}
        songFromURL="Song"
        artistFromURL="Artist"
        liveCifraZoomLabel="120%"
        blockSpacingLabel="32px"
        onDecreaseZoom={onDecreaseZoom}
        onIncreaseZoom={onIncreaseZoom}
        onDecreaseSpacing={onDecreaseSpacing}
        onIncreaseSpacing={onIncreaseSpacing}
        onExit={onExit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Decrease live cifra zoom" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase live cifra zoom" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease live block spacing" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase live block spacing" }));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onDecreaseZoom).toHaveBeenCalled();
    expect(onIncreaseZoom).toHaveBeenCalled();
    expect(onDecreaseSpacing).toHaveBeenCalled();
    expect(onIncreaseSpacing).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });

  it("renders touch video actions", () => {
    const onClose = vi.fn();
    const onCloseVideo = vi.fn();

    render(
      <TouchVideoMenu
        open
        onClose={onClose}
        onCloseVideo={onCloseVideo}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Close video options" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Close video" }));

    expect(onClose).toHaveBeenCalled();
    expect(onCloseVideo).toHaveBeenCalled();
  });

  it("renders progression columns with active live state", () => {
    render(
      <PresentationColumns
        columns={[
          {
            groupKey: "column-1",
            baseGroupKey: "column-1",
            blockKeys: ["block-1"],
            blocks: [{ block: "<pre>C G</pre>", index: 0 }],
            isProgressionEligible: true,
            displayPosition: 1,
          },
        ]}
        selectContenttoShow="default"
        showProgressionMarkers
        effectiveLiveMode
        shouldUseHorizontalColumnFlow
        selectedBlockKeys={["block-1"]}
        activeLiveColumnKey="column-1"
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("C G")).toBeInTheDocument();
  });

  it("renders top bar actions", () => {
    const openEditorToolBox = vi.fn();
    const onToggleExpanded = vi.fn();
    const onGoToSetlistSong = vi.fn();

    render(
      <PresentationTopBar
        visible
        isTouchLayout
        isTouchVideoActive={false}
        touchVideoLink=""
        songFromURL="Song"
        artistFromURL="Artist"
        activeLayoutLabel="Default layout"
        previousSetlistSong={{ artist: "Prev", song: "Prev Song" }}
        nextSetlistSong={{ artist: "Next", song: "Next Song" }}
        getMobileTitleSizeClass={() => "text-base"}
        toolBoxBtnStatus={false}
        isEditing={false}
        isVideoModalOpen={false}
        openEditorToolBox={openEditorToolBox}
        onToggleToolBox={vi.fn()}
        onOpenTouchVideoMenu={vi.fn()}
        isExpandedCifra={false}
        onToggleExpanded={onToggleExpanded}
        onGoToEditSong={vi.fn()}
        instrumentSelected="keys"
        canOpenGuitarPro={false}
        onOpenGuitarProViewer={vi.fn()}
        onEnterLiveMode={vi.fn()}
        onGoToSetlistSong={onGoToSetlistSong}
        onTouchVideoLinkChange={vi.fn()}
        onTouchVideoActiveChange={vi.fn()}
        onVideoModalChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open cifra editor" }));
    fireEvent.click(screen.getByRole("button", { name: "Enable expanded layout" }));
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Next song in selected setlist",
      })[0],
    );

    expect(openEditorToolBox).toHaveBeenCalled();
    expect(onToggleExpanded).toHaveBeenCalled();
    expect(onGoToSetlistSong).toHaveBeenCalledWith({
      artist: "Next",
      song: "Next Song",
    });
  });
});
