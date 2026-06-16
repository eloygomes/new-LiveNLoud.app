/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import DraggableComponent from "./DraggableComponent";
import TollBoxAcoord from "./TollBoxAcoord";
import ToolBoxYT from "./ToolBoxYT";
import VideoDragComp from "./videoDragComp";
import ToolBoxChordPlayer from "./ToolBoxChordPlayer";
import SongInstrumentNotes from "../SongInstrumentNotes";

const TOUCH_PANEL_LABELS = {
  "panel-editor": "Editor",
  "panel-transpose": "Transpose",
  "panel-layout": "Layout",
  "panel-notes": "Notes",
  panel1: "Instruments",
  panel2: "Videos",
  panel6: "Scrolling",
};

function ToolBox({
  toolBoxBtnStatus,
  setToolBoxBtnStatus,
  toolBoxBtnStatusChange,
  embedLinks,
  songFromURL,
  artistFromURL,
  instrumentSelected,
  songDataFetched,
  toggleTabsVisibility,
  hideChords,
  setHideChords,
  selectContenttoShow,
  setSelectContenttoShow,
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
  onToggleMarksVisibility,
  transposeSteps,
  setTransposeSteps,
  displayKey,
  showProgressionMarkers,
  isTouchLayout = false,
  touchFontSizeLabel,
  decreaseTouchFontSize,
  increaseTouchFontSize,
  blockSpacingLabel,
  decreaseBlockSpacing,
  increaseBlockSpacing,
  onVideoModalChange,
  linktoplay,
  setLinktoplay,
  videoModalStatus,
  setVideoModalStatus,
  instrumentNotes = "",
  onInstrumentNotesChange,
  onSaveInstrumentNotes,
  notesModalStatus,
  setNotesModalStatus,
  onOpenInstrumentNotes,
  isSavingNotes = false,
  onSelectInstrument,
  onGoToEditSong,
  canOpenGuitarPro = false,
  onOpenGuitarProViewer,
  onEnterLiveMode,
  isTouchVideoActive = false,
  onCloseTouchVideo,
  requestedPanel,
}) {
  const [chordModalStatus, setChordModalStatus] = useState(false);
  const [chordPreviewData, setChordPreviewData] = useState(null);
  const [activeTouchPanel, setActiveTouchPanel] = useState(null);
  const activeTouchPanelLabel = activeTouchPanel
    ? TOUCH_PANEL_LABELS[activeTouchPanel]
    : "";

  // dimensões aproximadas apenas para layout; não afetam o drag
  const BOX_WIDTH = 320;

  useEffect(() => {
    if (!isTouchLayout || !toolBoxBtnStatus || !isEditing) return;

    setActiveTouchPanel((currentPanel) => currentPanel || "panel-editor");
  }, [isEditing, isTouchLayout, toolBoxBtnStatus]);

  if (!toolBoxBtnStatus && !videoModalStatus && !chordModalStatus && !notesModalStatus) {
    return null;
  }

  const closeToolBoxAndDiscardEditor = () => {
    if (isEditing) {
      handleDiscardDraft();
    }
    setActiveTouchPanel(null);
    toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus);
  };

  const closeTouchToolBox = () => {
    closeToolBoxAndDiscardEditor();
  };

  const hideTouchToolBox = () => {
    setActiveTouchPanel(null);
    setToolBoxBtnStatus(false);
  };

  const handleTouchHeaderClose = () => {
    if (isEditing) {
      hideTouchToolBox();
      return;
    }

    if (activeTouchPanel) {
      setActiveTouchPanel(null);
      return;
    }

    closeTouchToolBox();
  };

  return (
    <>
      {!isTouchLayout && linktoplay && videoModalStatus ? (
        <div className="fixed right-4 bottom-4 z-[60]">
          <VideoDragComp toolBoxBtnStatus={toolBoxBtnStatus}>
            <ToolBoxYT
              embedLinks={embedLinks}
              linktoplay={linktoplay}
              setVideoModalStatus={setVideoModalStatus}
              setLinktoplay={setLinktoplay}
              isTouchLayout={isTouchLayout}
              onVideoModalChange={onVideoModalChange}
            />
          </VideoDragComp>
        </div>
      ) : null}

      {chordPreviewData && chordModalStatus ? (
        <div className="fixed right-4 bottom-4 z-[60]" style={{ width: 320 }}>
          <DraggableComponent
            handle=".drag-handle"
            defaultPosition={{ x: -320, y: -30 }}
          >
            <ToolBoxChordPlayer
              chordPreviewData={chordPreviewData}
              setChordModalStatus={setChordModalStatus}
              setChordPreviewData={setChordPreviewData}
            />
          </DraggableComponent>
        </div>
      ) : null}

      {!isTouchLayout && notesModalStatus ? (
        <div className="fixed right-4 bottom-4 z-[60]" style={{ width: 360 }}>
          <DraggableComponent
            handle=".drag-handle"
            defaultPosition={{ x: -380, y: -40 }}
          >
            <div className="neuphormism-b min-h-[300px] min-w-[300px] resize overflow-hidden rounded-[16px] px-2 pt-2">
              <SongInstrumentNotes
                instrumentName={instrumentSelected}
                title={`${instrumentSelected} notes`}
                value={instrumentNotes}
                onChange={onInstrumentNotesChange}
                onSave={onSaveInstrumentNotes}
                onClose={() => setNotesModalStatus(false)}
                isSaving={isSavingNotes}
                autoFocus={false}
              />
              <div className="drag-handle mx-[-8px] mt-2 bg-[#7f8490] px-3 py-1 text-center text-[7pt] font-bold text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] cursor-move select-none">
                Click and hold to drag
              </div>
            </div>
          </DraggableComponent>
        </div>
      ) : null}

      {isTouchLayout && toolBoxBtnStatus ? (
        <div className="fixed inset-0 z-[90] bg-black/25">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={isEditing ? hideTouchToolBox : closeTouchToolBox}
            aria-label="Close toolbox"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[18px] bg-[#f2f2f2] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="min-w-0 truncate text-sm font-bold leading-6 text-black">
                {`ToolBox${activeTouchPanelLabel ? ` - ${activeTouchPanelLabel}` : ""}`}
              </h1>
              <button
                className="neuphormism-b-btn flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-lg font-semibold text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                onClick={handleTouchHeaderClose}
                aria-label={
                  activeTouchPanel && !isEditing
                    ? "Back to toolbox"
                    : "Close toolbox"
                }
                type="button"
              >
                X
              </button>
            </div>

            <TollBoxAcoord
              embedLinks={embedLinks}
              setLinktoplay={setLinktoplay}
              setVideoModalStatus={setVideoModalStatus}
              linktoplay={linktoplay}
              onVideoModalChange={onVideoModalChange}
              setChordModalStatus={setChordModalStatus}
              setChordPreviewData={setChordPreviewData}
              songFromURL={songFromURL}
              artistFromURL={artistFromURL}
              instrumentSelected={instrumentSelected}
              songDataFetched={songDataFetched}
              toggleTabsVisibility={toggleTabsVisibility}
              hideChords={hideChords}
              setHideChords={setHideChords}
              selectContenttoShow={selectContenttoShow}
              setSelectContenttoShow={setSelectContenttoShow}
              isEditing={isEditing}
              isSavingCifra={isSavingCifra}
              hasDraftChanges={hasDraftChanges}
              songCifraData={songCifraData}
              handleSaveCifra={handleSaveCifra}
              handleDiscardDraft={handleDiscardDraft}
              startEditingCifra={startEditingCifra}
              onToggleMarksVisibility={onToggleMarksVisibility}
              transposeSteps={transposeSteps}
              setTransposeSteps={setTransposeSteps}
              displayKey={displayKey}
              showProgressionMarkers={showProgressionMarkers}
              isTouchLayout
              touchFontSizeLabel={touchFontSizeLabel}
              decreaseTouchFontSize={decreaseTouchFontSize}
              increaseTouchFontSize={increaseTouchFontSize}
              blockSpacingLabel={blockSpacingLabel}
              decreaseBlockSpacing={decreaseBlockSpacing}
              increaseBlockSpacing={increaseBlockSpacing}
              closeToolBox={closeTouchToolBox}
              closeToolBoxWithoutDiscard={hideTouchToolBox}
              activeTouchPanel={activeTouchPanel}
              setActiveTouchPanel={setActiveTouchPanel}
              instrumentNotes={instrumentNotes}
              onInstrumentNotesChange={onInstrumentNotesChange}
              onSaveInstrumentNotes={onSaveInstrumentNotes}
              isSavingNotes={isSavingNotes}
              onSelectInstrument={onSelectInstrument}
              onGoToEditSong={onGoToEditSong}
              canOpenGuitarPro={canOpenGuitarPro}
              onOpenGuitarProViewer={onOpenGuitarProViewer}
              onEnterLiveMode={onEnterLiveMode}
              isTouchVideoActive={isTouchVideoActive}
              onCloseTouchVideo={onCloseTouchVideo}
              requestedPanel={requestedPanel}
            />
          </div>
        </div>
      ) : toolBoxBtnStatus ? (
        <div
          className="fixed z-[50]"
          style={{
            right: 16,
            bottom: 16,
            width: BOX_WIDTH,
          }}
        >
          <DraggableComponent
            handle=".drag-handle"
            defaultPosition={{ x: 0, y: 0 }}
          >
            <div className="flex w-[20rem] max-w-[calc(100vw-2rem)] flex-col justify-between neuphormism-b p-2">
              <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between py-2 drag-handle cursor-move select-none">
                <h1 className="text-sm font-bold">ToolBox</h1>
                <button
                  className="text-2xl font-semibold hover:font-bold"
                  onClick={closeToolBoxAndDiscardEditor}
                  aria-label="Close toolbox"
                  type="button"
                >
                  X
                </button>
              </div>

              <TollBoxAcoord
                embedLinks={embedLinks}
                setLinktoplay={setLinktoplay}
                setVideoModalStatus={setVideoModalStatus}
                linktoplay={linktoplay}
                onVideoModalChange={onVideoModalChange}
                setChordModalStatus={setChordModalStatus}
                setChordPreviewData={setChordPreviewData}
                songFromURL={songFromURL}
                artistFromURL={artistFromURL}
                instrumentSelected={instrumentSelected}
                songDataFetched={songDataFetched}
                toggleTabsVisibility={toggleTabsVisibility}
                hideChords={hideChords}
                setHideChords={setHideChords}
                selectContenttoShow={selectContenttoShow}
                setSelectContenttoShow={setSelectContenttoShow}
                isEditing={isEditing}
                isSavingCifra={isSavingCifra}
                hasDraftChanges={hasDraftChanges}
                songCifraData={songCifraData}
                handleSaveCifra={handleSaveCifra}
                handleDiscardDraft={handleDiscardDraft}
                startEditingCifra={startEditingCifra}
                onToggleMarksVisibility={onToggleMarksVisibility}
                transposeSteps={transposeSteps}
                setTransposeSteps={setTransposeSteps}
                displayKey={displayKey}
                showProgressionMarkers={showProgressionMarkers}
                touchFontSizeLabel={touchFontSizeLabel}
                decreaseTouchFontSize={decreaseTouchFontSize}
                increaseTouchFontSize={increaseTouchFontSize}
                blockSpacingLabel={blockSpacingLabel}
                decreaseBlockSpacing={decreaseBlockSpacing}
                increaseBlockSpacing={increaseBlockSpacing}
                closeToolBox={() =>
                  closeToolBoxAndDiscardEditor()
                }
                setNotesModalStatus={setNotesModalStatus}
                onOpenInstrumentNotes={onOpenInstrumentNotes}
                instrumentNotes={instrumentNotes}
                onInstrumentNotesChange={onInstrumentNotesChange}
                onSaveInstrumentNotes={onSaveInstrumentNotes}
                isSavingNotes={isSavingNotes}
                onSelectInstrument={onSelectInstrument}
                onGoToEditSong={onGoToEditSong}
                canOpenGuitarPro={canOpenGuitarPro}
                onOpenGuitarProViewer={onOpenGuitarProViewer}
                onEnterLiveMode={onEnterLiveMode}
                isTouchVideoActive={isTouchVideoActive}
                onCloseTouchVideo={onCloseTouchVideo}
                requestedPanel={requestedPanel}
              />

              <div className="text-[6pt] font-bold text-center mx-auto w-full bg-gray-500 text-white drag-handle cursor-move select-none">
                Click and hold to drag
              </div>
            </div>
          </DraggableComponent>
        </div>
      ) : null}
    </>
  );
}

export default ToolBox;
