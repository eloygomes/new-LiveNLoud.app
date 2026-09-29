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
        name: "Navigate to previous block",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Navigate to next block",
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

  it("adapts the desktop presentation controls to the touch live header", () => {
    const onGoToSetlistSong = vi.fn();
    const onOpenSetlist = vi.fn();
    const onDecreaseZoom = vi.fn();
    const onIncreaseZoom = vi.fn();
    const onDecreaseSpacing = vi.fn();
    const onIncreaseSpacing = vi.fn();
    const onExit = vi.fn();

    const { container } = render(
      <PresentationLiveHeader
        effectiveLiveMode
        isTouchLayout
        songFromURL="Song"
        artistFromURL="Artist"
        previousSetlistSong={{ artist: "Prev", song: "Prev Song" }}
        nextSetlistSong={{ artist: "Next", song: "Next Song" }}
        setlistSongs={[
          { artist: "Artist", song: "Song" },
          { artist: "Next", song: "Next Song" },
        ]}
        liveCifraZoomLabel="120%"
        blockSpacingLabel="32px"
        onDecreaseZoom={onDecreaseZoom}
        onIncreaseZoom={onIncreaseZoom}
        onDecreaseSpacing={onDecreaseSpacing}
        onIncreaseSpacing={onIncreaseSpacing}
        onOpenSetlist={onOpenSetlist}
        onGoToSetlistSong={onGoToSetlistSong}
        onExit={onExit}
      />,
    );

    expect(screen.getByText("Song")).toBeInTheDocument();
    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Live cifra zoom" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Live block spacing" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Decrease live cifra zoom" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Increase live cifra zoom" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Decrease live block spacing" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Increase live block spacing" }),
    );

    expect(onDecreaseZoom).toHaveBeenCalledOnce();
    expect(onIncreaseZoom).toHaveBeenCalledOnce();
    expect(onDecreaseSpacing).toHaveBeenCalledOnce();
    expect(onIncreaseSpacing).toHaveBeenCalledOnce();

    fireEvent.click(
      screen.getByRole("button", { name: "Previous song in selected setlist" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Next song in selected setlist" }),
    );

    expect(onGoToSetlistSong).toHaveBeenNthCalledWith(1, {
      artist: "Prev",
      song: "Prev Song",
    });
    expect(onGoToSetlistSong).toHaveBeenNthCalledWith(2, {
      artist: "Next",
      song: "Next Song",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Open live setlist" }),
    );
    expect(onOpenSetlist).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close live mode" }));
    expect(onExit).toHaveBeenCalledOnce();

    expect(screen.queryByRole("button", { name: "Like live song" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Comment on live song" }),
    ).toBeNull();
    expect(screen.queryByText("Add comment...")).toBeNull();
    expect(
      container.querySelector('[class*="presentation-live-reels"]'),
    ).toBeNull();
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

  it("keeps chord spacing stable while editing presentation columns", () => {
    const columns = [
      {
        groupKey: "column-1",
        baseGroupKey: "column-1",
        blockKeys: ["block-1"],
        blocks: [
          {
            block:
              '<pre><span class="notespresentation" data-chord="C">C</span> lyric <span class="notespresentation" data-chord="D/F#">D/F#</span></pre>',
            index: 0,
          },
        ],
        isProgressionEligible: false,
        displayPosition: 1,
      },
    ];

    const { rerender } = render(
      <PresentationColumns
        columns={columns}
        showProgressionMarkers={false}
        effectiveLiveMode={false}
        shouldUseHorizontalColumnFlow={false}
        selectedBlockKeys={[]}
        activeLiveColumnKey=""
      />,
    );

    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D/F#")).toBeInTheDocument();
    expect(screen.queryByText("[C]")).not.toBeInTheDocument();

    rerender(
      <PresentationColumns
        columns={columns}
        showProgressionMarkers={false}
        effectiveLiveMode={false}
        shouldUseHorizontalColumnFlow={false}
        selectedBlockKeys={[]}
        activeLiveColumnKey=""
        isEditing
      />,
    );

    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D/F#")).toBeInTheDocument();
    expect(screen.queryByText("[C]")).not.toBeInTheDocument();
  });

  it("renders top bar actions", () => {
    const onStartEditing = vi.fn();
    const onToggleTabsHidden = vi.fn();
    const onToggleToolBox = vi.fn();
    const onToggleExpanded = vi.fn();
    const onGoToSetlistSong = vi.fn();

    render(
      <PresentationTopBar
        visible
        isTouchLayout={false}
        isTouchVideoActive={false}
        songFromURL="Song"
        artistFromURL="Artist"
        activeLayoutLabel="Vertical View"
        previousSetlistSong={{ artist: "Prev", song: "Prev Song" }}
        nextSetlistSong={{ artist: "Next", song: "Next Song" }}
        toolBoxBtnStatus={false}
        isEditing={false}
        isVideoModalOpen={false}
        onStartEditing={onStartEditing}
        tabsHidden={false}
        onToggleTabsHidden={onToggleTabsHidden}
        onToggleToolBox={onToggleToolBox}
        isExpandedCifra={false}
        isLayoutModeManual={false}
        onToggleExpanded={onToggleExpanded}
        onGoToEditSong={vi.fn()}
        instrumentSelected="keys"
        canOpenGuitarPro={false}
        onOpenGuitarProViewer={vi.fn()}
        onEnterLiveMode={vi.fn()}
        onGoToSetlistSong={onGoToSetlistSong}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit cifra" }));
    const hideTabsButton = screen.getByRole("button", { name: "Hide tabs" });
    fireEvent.click(hideTabsButton);
    fireEvent.click(screen.getByRole("button", { name: "Automatic layout" }));
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Next song in selected setlist",
      })[0],
    );

    expect(onStartEditing).toHaveBeenCalled();
    expect(onToggleTabsHidden).toHaveBeenCalledOnce();
    expect(hideTabsButton).toHaveAttribute("aria-pressed", "false");
    expect(onToggleExpanded).toHaveBeenCalled();
    expect(screen.getByLabelText("Automatic layout status")).toHaveTextContent("AUTO");
    expect(onGoToSetlistSong).toHaveBeenCalledWith({
      artist: "Next",
      song: "Next Song",
    });
  });

  it("stacks tablet presentation identity before its action buttons", () => {
    const { container } = render(
      <PresentationTopBar
        visible
        isTouchLayout
        isPortraitTabletLayout
        isTouchVideoActive={false}
        songFromURL="Tablet Song"
        artistFromURL="Tablet Artist"
        activeLayoutLabel="Vertical View"
        toolBoxBtnStatus={false}
        isEditing={false}
        isVideoModalOpen={false}
        onStartEditing={vi.fn()}
        tabsHidden
        onToggleTabsHidden={vi.fn()}
        onToggleToolBox={vi.fn()}
        isExpandedCifra={false}
        onToggleExpanded={vi.fn()}
        onGoToEditSong={vi.fn()}
        instrumentSelected="keys"
        canOpenGuitarPro={false}
        onOpenGuitarProViewer={vi.fn()}
        onEnterLiveMode={vi.fn()}
        onGoToSetlistSong={vi.fn()}
      />,
    );

    const topBar = container.querySelector("[data-presentation-top-bar='true']");
    const songTitle = screen.getByText("Tablet Song");
    const firstAction = screen.getByRole("button", { name: "Edit cifra" });
    const hideTabsButton = screen.getByRole("button", { name: "Hide tabs" });

    expect(topBar).toHaveAttribute("data-tablet-layout", "true");
    expect(
      container.querySelector(".presentation-tablet-actions"),
    ).toHaveClass("justify-end");
    expect(
      songTitle.compareDocumentPosition(firstAction) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(hideTabsButton).toHaveAttribute("aria-pressed", "true");
    expect(hideTabsButton).toHaveClass("bg-[goldenrod]");
  });

  it("replaces presentation actions with a symmetric two-row edit toolbar", () => {
    const onSaveCifra = vi.fn();
    const onDiscardDraft = vi.fn();

    render(
      <PresentationTopBar
        visible
        isTouchLayout={false}
        isTouchVideoActive={false}
        songFromURL="Song"
        artistFromURL="Artist"
        activeLayoutLabel="Vertical View"
        toolBoxBtnStatus={false}
        isEditing
        isVideoModalOpen={false}
        onStartEditing={vi.fn()}
        onToggleToolBox={vi.fn()}
        isExpandedCifra={false}
        onToggleExpanded={vi.fn()}
        onGoToEditSong={vi.fn()}
        instrumentSelected="keys"
        canOpenGuitarPro={false}
        onOpenGuitarProViewer={vi.fn()}
        onEnterLiveMode={vi.fn()}
        onGoToSetlistSong={vi.fn()}
        hasDraftChanges
        onSaveCifra={onSaveCifra}
        onDiscardDraft={onDiscardDraft}
        editorState={{ canUndo: false, canRedo: false, align: "left" }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Transpose" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "LIVE" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next song in selected setlist" })).not.toBeInTheDocument();

    const rows = document.querySelectorAll("[data-editor-toolbar-row]");
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelectorAll("button, label")).toHaveLength(10);
    expect(rows[1].querySelectorAll("button, label")).toHaveLength(10);
    expect(rows[0].lastElementChild).toHaveAccessibleName("Save");
    expect(rows[1].lastElementChild).toHaveAccessibleName("Discard changes");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(
      "neuphormism-b-btn",
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "neuphormism-b-btn",
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(onSaveCifra).toHaveBeenCalled();
    expect(onDiscardDraft).toHaveBeenCalled();
  });

  it("keeps only identity and one action trigger in the touch top bar", () => {
    const onStartEditing = vi.fn();
    const onGoToSetlistSong = vi.fn();
    const onToggleToolBox = vi.fn();

    render(
      <PresentationTopBar
        visible
        isTouchLayout
        isTouchVideoActive={false}
        songFromURL="Song"
        artistFromURL="Artist"
        activeLayoutLabel="Vertical View"
        previousSetlistSong={{ artist: "Prev", song: "Prev Song" }}
        nextSetlistSong={{ artist: "Next", song: "Next Song" }}
        toolBoxBtnStatus={false}
        isEditing={false}
        isVideoModalOpen={false}
        onStartEditing={onStartEditing}
        onToggleToolBox={onToggleToolBox}
        isExpandedCifra={false}
        onToggleExpanded={vi.fn()}
        onGoToEditSong={vi.fn()}
        instrumentSelected="keys"
        canOpenGuitarPro={false}
        onOpenGuitarProViewer={vi.fn()}
        onEnterLiveMode={vi.fn()}
        onGoToSetlistSong={onGoToSetlistSong}
      />,
    );

    const topBar = document.querySelector(
      '[data-presentation-top-bar="true"]',
    );
    expect(topBar).toHaveClass("sticky", "top-0", "z-[120]");

    expect(
      screen.queryByRole("button", { name: "Open editor tools" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Switch to Horizontal View" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Song settings" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Edit cifra" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next song in selected setlist" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open presentation actions" }),
    );

    expect(onToggleToolBox).toHaveBeenCalled();
    expect(onStartEditing).not.toHaveBeenCalled();
    expect(onGoToSetlistSong).not.toHaveBeenCalled();
  });
});
