/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
import { useState } from "react";
import DraggableComponent from "./DraggableComponent";
import TollBoxAcoord from "./TollBoxAcoord";
import ToolBoxYT from "./ToolBoxYT";
import VideoDragComp from "./videoDragComp";
import ToolBoxChordPlayer from "./ToolBoxChordPlayer";
import SongInstrumentNotes from "../SongInstrumentNotes";

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
  isTouchLayout = false,
  touchFontSizeLabel,
  decreaseTouchFontSize,
  increaseTouchFontSize,
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
}) {
  const [chordModalStatus, setChordModalStatus] = useState(false);
  const [chordPreviewData, setChordPreviewData] = useState(null);
  const [activeTouchPanel, setActiveTouchPanel] = useState(null);

  // dimensões aproximadas apenas para layout; não afetam o drag
  const BOX_WIDTH = 180;

  if (!toolBoxBtnStatus && !videoModalStatus && !chordModalStatus && !notesModalStatus) {
    return null;
  }

  const closeTouchToolBox = () => {
    setActiveTouchPanel(null);
    toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus);
  };

  const handleTouchHeaderClose = () => {
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
            <div className="min-h-[300px] min-w-[300px] resize overflow-auto">
              <div className="drag-handle cursor-move select-none rounded-t-[14px] bg-gray-500 px-3 py-1 text-center text-[7pt] font-bold text-white">
                Click and hold to drag
              </div>
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
            </div>
          </DraggableComponent>
        </div>
      ) : null}

      {isTouchLayout && toolBoxBtnStatus ? (
        <div className="fixed inset-0 z-[90] bg-black/25">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeTouchToolBox}
            aria-label="Close toolbox"
          />
          <div className=" absolute inset-x-0 bottom-0 rounded-t-[18px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex items-start justify-between">
              <h1 className="text-[2rem] font-black tracking-tight text-black">
                ToolBox
              </h1>
              <button
                className="neuphormism-b-btn flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-2xl font-semibold text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                onClick={handleTouchHeaderClose}
                aria-label={
                  activeTouchPanel ? "Back to toolbox" : "Close toolbox"
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
              isTouchLayout
              touchFontSizeLabel={touchFontSizeLabel}
              decreaseTouchFontSize={decreaseTouchFontSize}
              increaseTouchFontSize={increaseTouchFontSize}
              closeToolBox={closeTouchToolBox}
              activeTouchPanel={activeTouchPanel}
              setActiveTouchPanel={setActiveTouchPanel}
              instrumentNotes={instrumentNotes}
              onInstrumentNotesChange={onInstrumentNotesChange}
              onSaveInstrumentNotes={onSaveInstrumentNotes}
              isSavingNotes={isSavingNotes}
              onSelectInstrument={onSelectInstrument}
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
            <div className="w-40 flex flex-col justify-between neuphormism-b p-2">
              <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between py-2 drag-handle cursor-move select-none">
                <h1 className="text-sm font-bold">ToolBox</h1>
                <button
                  className="text-2xl font-semibold hover:font-black"
                  onClick={() =>
                    toolBoxBtnStatusChange(
                      toolBoxBtnStatus,
                      setToolBoxBtnStatus,
                    )
                  }
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
                touchFontSizeLabel={touchFontSizeLabel}
                decreaseTouchFontSize={decreaseTouchFontSize}
                increaseTouchFontSize={increaseTouchFontSize}
                closeToolBox={() =>
                  toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
                }
                setNotesModalStatus={setNotesModalStatus}
                onOpenInstrumentNotes={onOpenInstrumentNotes}
                instrumentNotes={instrumentNotes}
                onInstrumentNotesChange={onInstrumentNotesChange}
                onSaveInstrumentNotes={onSaveInstrumentNotes}
                isSavingNotes={isSavingNotes}
                onSelectInstrument={onSelectInstrument}
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
