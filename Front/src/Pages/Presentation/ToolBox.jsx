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
// }) {
//   const [linktoplay, setLinktoplay] = useState("");
//   const [videoModalStatus, setVideoModalStatus] = useState(false);
//   console.log("linktoplay", linktoplay);
//   console.log("videoModalStatus", videoModalStatus);
//   return (
//     <>
//       {linktoplay ? (
//         <div className={`${videoModalStatus ? "fixed" : "hidden"}`}>
//           <VideoDragComp toolBoxBtnStatus={toolBoxBtnStatus}>
//             <ToolBoxYT
//               embedLinks={embedLinks}
//               linktoplay={linktoplay}
//               setVideoModalStatus={setVideoModalStatus}
//             />
//           </VideoDragComp>
//         </div>
//       ) : null}
//       <DraggableComponent toolBoxBtnStatus={toolBoxBtnStatus}>
//         <div className={`${toolBoxBtnStatus ? "flex" : "hidden"}`}>
//           <div className=" w-40  flex flex-col justify-between neuphormism-b fixed right-16 bottom-3 p-2">
//             <div>
//               <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between  py-2">
//                 <h1 className="flex flex-row text-sm font-bold">ToolBox</h1>
//                 <div
//                   className="flex flex-row text-2xl font-semibold hover:font-black"
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
//                 setLinktoplay={setLinktoplay}
//                 setVideoModalStatus={setVideoModalStatus}
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
}) {
  const [linktoplay, setLinktoplay] = useState("");
  const [videoModalStatus, setVideoModalStatus] = useState(false);

  return (
    <>
      {/* Renderiza o player apenas quando houver um linktoplay e o videoModalStatus for true */}
      {linktoplay && videoModalStatus ? (
        <div className="fixed">
          <VideoDragComp toolBoxBtnStatus={toolBoxBtnStatus}>
            <ToolBoxYT
              embedLinks={embedLinks}
              linktoplay={linktoplay}
              setVideoModalStatus={setVideoModalStatus}
              setLinktoplay={setLinktoplay} // Mantém o link para o player
            />
          </VideoDragComp>
        </div>
      ) : null}

      <DraggableComponent toolBoxBtnStatus={toolBoxBtnStatus}>
        <div className={`${toolBoxBtnStatus ? "flex" : "hidden"}`}>
          <div className="w-40 flex flex-col justify-between neuphormism-b fixed right-16 bottom-3 p-2">
            <div>
              <div className="border-b-2 border-gray-300 w-full flex flex-row justify-between py-2">
                <h1 className="flex flex-row text-sm font-bold">ToolBox</h1>
                <div
                  className="flex flex-row text-2xl font-semibold hover:font-black cursor-pointer"
                  onClick={() =>
                    toolBoxBtnStatusChange(
                      toolBoxBtnStatus,
                      setToolBoxBtnStatus
                    )
                  }
                >
                  X
                </div>
              </div>
              <TollBoxAcoord
                embedLinks={embedLinks}
                setLinktoplay={setLinktoplay} // Define o linktoplay ao clicar em um vídeo
                setVideoModalStatus={setVideoModalStatus} // Abre o modal do player ao clicar em um vídeo
              />
            </div>
            <h1 className="flex flex-row text-[6pt] font-bold items-center justify-center mx-auto w-full bg-gray-500 text-white">
              Click and hold to drag
            </h1>
          </div>
        </div>
      </DraggableComponent>
    </>
  );
}

export default ToolBox;
