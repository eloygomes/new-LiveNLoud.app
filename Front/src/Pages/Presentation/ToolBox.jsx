// /* eslint-disable react/prop-types */
// import { useState } from "react";
// import DraggableComponent from "./DraggableComponent";
// import TollBoxAcoord from "./TollBoxAcoord";
// import ToolBoxYT from "./ToolBoxYT";
// import VideoDragComp from "./videoDragComp";

// function ToolBox({
//   toolBoxBtnStatus,
//   setToolBoxBtnStatus,
//   toolBoxBtnStatusChange,
//   embedLinks,
//   songFromURL,
//   artistFromURL,
//   instrumentSelected,
//   songDataFetched,
//   toggleTabsVisibility,
//   hideChords,
//   setHideChords,
//   setSelectContenttoShow,
// }) {
//   const [linktoplay, setLinktoplay] = useState("");
//   const [videoModalStatus, setVideoModalStatus] = useState(false);

//   return (
//     <>
//       {/* Renderiza o player apenas quando houver um linktoplay e o videoModalStatus for true */}
//       {linktoplay && videoModalStatus ? (
//         <div className="fixed">
//           <VideoDragComp toolBoxBtnStatus={toolBoxBtnStatus}>
//             <ToolBoxYT
//               embedLinks={embedLinks}
//               linktoplay={linktoplay}
//               setVideoModalStatus={setVideoModalStatus}
//               setLinktoplay={setLinktoplay} // Mantém o link para o player
//             />
//           </VideoDragComp>
//         </div>
//       ) : null}

//       <DraggableComponent toolBoxBtnStatus={toolBoxBtnStatus}>
//         <div className={`${toolBoxBtnStatus ? "flex" : "hidden"}`}>
//           <div className="w-40 flex flex-col justify-between neuphormism-b fixed right-16 bottom-3 p-2">
//             <div>
//               <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between py-2">
//                 <h1 className="flex flex-row text-sm font-bold">ToolBox</h1>
//                 <div
//                   className="flex flex-row text-2xl font-semibold hover:font-black cursor-pointer"
//                   onClick={() =>
//                     toolBoxBtnStatusChange(
//                       toolBoxBtnStatus,
//                       setToolBoxBtnStatus
//                     )
//                   }
//                 >
//                   X
//                 </div>
//               </div>
//               <TollBoxAcoord
//                 embedLinks={embedLinks}
//                 setLinktoplay={setLinktoplay} // Define o linktoplay ao clicar em um vídeo
//                 setVideoModalStatus={setVideoModalStatus} // Abre o modal do player ao clicar em um vídeo
//                 songFromURL={songFromURL}
//                 artistFromURL={artistFromURL}
//                 instrumentSelected={instrumentSelected}
//                 songDataFetched={songDataFetched}
//                 toggleTabsVisibility={toggleTabsVisibility}
//                 hideChords={hideChords}
//                 setHideChords={setHideChords}
//                 setSelectContenttoShow={setSelectContenttoShow}
//               />
//             </div>
//             <h1 className="flex flex-row text-[6pt] font-bold items-center justify-center mx-auto w-full bg-gray-500 text-white">
//               Click and hold to drag
//             </h1>
//           </div>
//         </div>
//       </DraggableComponent>
//     </>
//   );
// }

// export default ToolBox;

/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
import { useState } from "react";
import DraggableComponent from "./DraggableComponent";
import TollBoxAcoord from "./TollBoxAcoord";
import ToolBoxYT from "./ToolBoxYT";
import VideoDragComp from "./videoDragComp";

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
}) {
  const [linktoplay, setLinktoplay] = useState("");
  const [videoModalStatus, setVideoModalStatus] = useState(false);

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
              songFromURL={songFromURL}
              artistFromURL={artistFromURL}
              instrumentSelected={instrumentSelected}
              songDataFetched={songDataFetched}
              toggleTabsVisibility={toggleTabsVisibility}
              hideChords={hideChords}
              setHideChords={setHideChords}
              setSelectContenttoShow={setSelectContenttoShow}
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
