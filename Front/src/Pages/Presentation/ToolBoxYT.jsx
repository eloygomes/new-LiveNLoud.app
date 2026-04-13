// /* eslint-disable react/jsx-key */
// import Accordion from "@mui/material/Accordion";
// import AccordionSummary from "@mui/material/AccordionSummary";
// import AccordionDetails from "@mui/material/AccordionDetails";
// import { useState, useEffect } from "react";
// import CloseIcon from "@mui/icons-material/Close"; // X icon for closing
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Default expand icon

// export default function ToolBoxYT({
//   embedLinks = [],
//   linktoplay,
//   setVideoModalStatus,
// }) {
//   const [selectedVideo, setSelectedVideo] = useState(null);
//   const [isAccordionOpen, setIsAccordionOpen] = useState(false);

//   useEffect(() => {
//     if (linktoplay) {
//       setSelectedVideo(linktoplay); // Atualiza o vídeo ao receber o linktoplay como prop
//       setIsAccordionOpen(true); // Abre o acordeão quando houver um link válido
//     } else {
//       setIsAccordionOpen(false); // Fecha o acordeão quando não houver link
//     }
//   }, [linktoplay]);

//   const getVideoIdFromUrl = (url) => {
//     try {
//       const videoUrl = new URL(url);
//       return videoUrl.searchParams.get("v");
//     } catch (error) {
//       console.error("URL inválida", error);
//       return null;
//     }
//   };

//   const handleCloseAccordion = (e) => {
//     e.stopPropagation(); // Prevent the click from propagating to AccordionSummary
//     setIsAccordionOpen(false); // Fecha o acordeão
//     setVideoModalStatus(false); // Fecha o modal de vídeo
//   };

//   return (
//     <>
//       <Accordion expanded={isAccordionOpen}>
//         <AccordionSummary
//           aria-controls="panel1-content"
//           id="panel1-header"
//           className={`neuphormism-b text-sm font-semibold py-1 rounded-lg ${
//             isAccordionOpen ? "fixed" : "hidden"
//           }`}
//         >
//           <span>Player</span>
//           {/* Only X icon is clickable to close */}
//           {isAccordionOpen && (
//             <CloseIcon
//               onClick={handleCloseAccordion} // Chama a função handleCloseAccordion corretamente
//               className="ml-auto cursor-pointer"
//             />
//           )}
//         </AccordionSummary>
//         {isAccordionOpen && (
//           <AccordionDetails className="neuphormism-b text-sm font-semibold">
//             {/* Player de vídeo dinâmico */}
//             {selectedVideo && (
//               <div className="mb-4 p-3 border border-gray-300 rounded-md bg-gray-100">
//                 <iframe
//                   width="100%"
//                   height="315"
//                   src={`https://www.youtube.com/embed/${getVideoIdFromUrl(
//                     selectedVideo
//                   )}`}
//                   title="YouTube video player"
//                   frameBorder="0"
//                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                   allowFullScreen
//                 ></iframe>
//               </div>
//             )}
//             <h1 className="flex flex-row text-[6pt] font-bold items-center justify-center mx-auto w-full bg-gray-500 text-white">
//               Click and hold to drag
//             </h1>
//           </AccordionDetails>
//         )}
//       </Accordion>
//     </>
//   );
// }

/* eslint-disable react/jsx-key */
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CloseIcon from "@mui/icons-material/Close"; // X icon for closing
import { useState, useEffect } from "react";

export default function ToolBoxYT({
  embedLinks = [],
  linktoplay,
  setVideoModalStatus,
  setLinktoplay, // Adiciona para limpar o linktoplay
  isTouchLayout = false,
  onVideoModalChange,
}) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  useEffect(() => {
    if (linktoplay) {
      setSelectedVideo(linktoplay); // Atualiza o vídeo ao receber o linktoplay como prop
      setIsAccordionOpen(true); // Abre o acordeão quando houver um link válido
      onVideoModalChange?.(true);
    } else {
      setIsAccordionOpen(false); // Fecha o acordeão quando não houver link
      onVideoModalChange?.(false);
    }
  }, [linktoplay, onVideoModalChange]);

  const getVideoIdFromUrl = (url) => {
    try {
      const videoUrl = new URL(url);
      return videoUrl.searchParams.get("v");
    } catch (error) {
      console.error("URL inválida", error);
      return null;
    }
  };

  const handleCloseAccordion = (e) => {
    e?.stopPropagation?.(); // Impede a propagação do clique
    setIsAccordionOpen(false); // Fecha o acordeão
    setVideoModalStatus(false); // Fecha o modal de vídeo
    setLinktoplay(null); // Limpa o linktoplay
    onVideoModalChange?.(false);
  };

  if (isTouchLayout && isAccordionOpen) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/30">
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={handleCloseAccordion}
          aria-label="Close video modal"
        />
        <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[1.6rem] font-black tracking-tight text-black">
              Video
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
              onClick={handleCloseAccordion}
            >
              <CloseIcon />
            </button>
          </div>
          {selectedVideo ? (
            <div className="overflow-hidden rounded-[18px] bg-black">
              <iframe
                width="100%"
                height="260"
                src={`https://www.youtube.com/embed/${getVideoIdFromUrl(
                  selectedVideo
                )}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Accordion expanded={isAccordionOpen}>
      <AccordionSummary
        aria-controls="panel1-content"
        id="panel1-header"
        className={`neuphormism-b text-sm font-semibold py-1 rounded-lg ${
          isAccordionOpen ? "fixed" : "hidden"
        }`}
      >
        <span>Player</span>
        {/* Apenas o ícone de X é clicável para fechar */}
        {isAccordionOpen && (
          <CloseIcon
            onClick={handleCloseAccordion} // Chama a função handleCloseAccordion corretamente
            className="ml-auto cursor-pointer"
          />
        )}
      </AccordionSummary>
      {isAccordionOpen && (
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          {selectedVideo && (
            <div className="mb-4 p-3 border border-gray-300 rounded-md bg-gray-100">
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${getVideoIdFromUrl(
                  selectedVideo
                )}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
          <h1 className="flex flex-row text-[6pt] font-bold items-center justify-center mx-auto w-full bg-gray-500 text-white">
            Click and hold to drag
          </h1>
        </AccordionDetails>
      )}
    </Accordion>
  );
}
