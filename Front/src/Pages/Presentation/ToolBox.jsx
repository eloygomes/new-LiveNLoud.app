/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
import { useState } from "react";
import DraggableComponent from "./DraggableComponent";
import TollBoxAcoord from "./TollBoxAcoord";
import ToolBoxYT from "./ToolBoxYT";
import VideoDragComp from "./videoDragComp";
import ToolBoxChordPlayer from "./ToolBoxChordPlayer";

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
  setSelectContenttoShow,
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
}) {
  const [linktoplay, setLinktoplay] = useState("");
  const [videoModalStatus, setVideoModalStatus] = useState(false);
  const [chordModalStatus, setChordModalStatus] = useState(false);
  const [chordPreviewData, setChordPreviewData] = useState(null);

  // dimensões aproximadas apenas para layout; não afetam o drag
  const BOX_WIDTH = 180;

  if (!toolBoxBtnStatus) return null;

  return (
    <>
      {linktoplay && videoModalStatus ? (
        <div className="fixed right-4 bottom-4 z-[60]">
          <VideoDragComp toolBoxBtnStatus={toolBoxBtnStatus}>
            <ToolBoxYT
              embedLinks={embedLinks}
              linktoplay={linktoplay}
              setVideoModalStatus={setVideoModalStatus}
              setLinktoplay={setLinktoplay}
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

      {/* 👇 Wrapper FIXO fora do fluxo: não empurra o conteúdo */}
      <div
        className="fixed z-[50]"
        style={{
          right: 16, // canto inferior direito
          bottom: 16,
          width: BOX_WIDTH, // ajuda a prever o tamanho na posição inicial
        }}
      >
        {/* defaultPosition = {0,0} pois já estamos no lugar certo (right/bottom) */}
        <DraggableComponent
          handle=".drag-handle"
          defaultPosition={{ x: 0, y: 0 }}
        >
          {/* REMOVIDO qualquer 'fixed/right/bottom' daqui para não conflitar */}
          <div className="w-40 flex flex-col justify-between neuphormism-b p-2">
            <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between py-2 drag-handle cursor-move select-none">
              <h1 className="text-sm font-bold">ToolBox</h1>
              <button
                className="text-2xl font-semibold hover:font-black"
                onClick={() =>
                  toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
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
              setSelectContenttoShow={setSelectContenttoShow}
              isEditing={isEditing}
              isSavingCifra={isSavingCifra}
              hasDraftChanges={hasDraftChanges}
              songCifraData={songCifraData}
              handleSaveCifra={handleSaveCifra}
              handleDiscardDraft={handleDiscardDraft}
              startEditingCifra={startEditingCifra}
            />

            <div className="text-[6pt] font-bold text-center mx-auto w-full bg-gray-500 text-white drag-handle cursor-move select-none">
              Click and hold to drag
            </div>
          </div>
        </DraggableComponent>
      </div>
    </>
  );
}

export default ToolBox;
