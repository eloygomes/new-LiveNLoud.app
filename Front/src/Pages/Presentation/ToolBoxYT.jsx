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
import { useState, useEffect, useMemo } from "react";

const isIosWebKitBrowser = () => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isWebKit = /AppleWebKit/i.test(ua);

  return isIOS && isWebKit;
};

export default function ToolBoxYT({
  embedLinks = [],
  linktoplay,
  setVideoModalStatus,
  setLinktoplay, // Adiciona para limpar o linktoplay
  isTouchLayout = false,
  onVideoModalChange,
  renderInline = false,
  iframeHeight,
}) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
  const usesIosWebKit = useMemo(() => isIosWebKitBrowser(), []);

  useEffect(() => {
    if (linktoplay) {
      setSelectedVideo(linktoplay); // Atualiza o vídeo ao receber o linktoplay como prop
      setIsAccordionOpen(true); // Abre o acordeão quando houver um link válido
      setShouldLoadPlayer(false);
      onVideoModalChange?.(true);
    } else {
      setIsAccordionOpen(false); // Fecha o acordeão quando não houver link
      setShouldLoadPlayer(false);
      onVideoModalChange?.(false);
    }
  }, [linktoplay, onVideoModalChange]);

  const getVideoIdFromUrl = (url) => {
    try {
      const normalizedValue = String(url || "").trim();
      if (!normalizedValue) return null;

      if (
        /^[a-zA-Z0-9_-]{11}$/.test(normalizedValue) &&
        !normalizedValue.includes("http")
      ) {
        return normalizedValue;
      }

      const videoUrl = new URL(
        normalizedValue.startsWith("http")
          ? normalizedValue
          : `https://${normalizedValue}`,
      );
      const host = videoUrl.hostname.replace(/^www\./, "");

      if (host === "youtu.be" && videoUrl.pathname.length > 1) {
        return videoUrl.pathname.slice(1);
      }
      if (host === "youtube.com" || host === "m.youtube.com") {
        if (videoUrl.pathname === "/watch") {
          return videoUrl.searchParams.get("v");
        }
        if (videoUrl.pathname.startsWith("/shorts/")) {
          return videoUrl.pathname.split("/")[2] || null;
        }
        if (videoUrl.pathname.startsWith("/embed/")) {
          return videoUrl.pathname.split("/")[2] || null;
        }
      }
      return videoUrl.searchParams.get("v");
    } catch (error) {
      const fallbackMatch = String(url || "")
        .trim()
        .match(/(?:v=|embed\/|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (fallbackMatch?.[1]) {
        return fallbackMatch[1];
      }
      return null;
    }
  };

  const selectedVideoId = useMemo(
    () => getVideoIdFromUrl(selectedVideo),
    [selectedVideo],
  );

  const previewEmbedSrc = useMemo(() => {
    if (!selectedVideoId) return "";

    const params = new URLSearchParams({
      autoplay: renderInline && isTouchLayout ? "1" : "0",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });

    if (typeof window !== "undefined" && window.location.origin) {
      params.set("origin", window.location.origin);
    }

    const embedBaseUrl = usesIosWebKit
      ? "https://www.youtube.com/embed"
      : "https://www.youtube-nocookie.com/embed";

    return `${embedBaseUrl}/${selectedVideoId}?${params.toString()}`;
  }, [isTouchLayout, renderInline, selectedVideoId, usesIosWebKit]);

  const previewImageSources = useMemo(() => {
    if (!selectedVideoId) return [];

    return [
      `https://i.ytimg.com/vi_webp/${selectedVideoId}/maxresdefault.webp`,
      `https://i.ytimg.com/vi_webp/${selectedVideoId}/hqdefault.webp`,
      `https://i.ytimg.com/vi/${selectedVideoId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${selectedVideoId}/hqdefault.jpg`,
    ];
  }, [selectedVideoId]);

  const canonicalWatchUrl = selectedVideoId
    ? `https://www.youtube.com/watch?v=${selectedVideoId}`
    : "";

  const handleCloseAccordion = (e) => {
    e?.stopPropagation?.(); // Impede a propagação do clique
    setIsAccordionOpen(false); // Fecha o acordeão
    setVideoModalStatus(false); // Fecha o modal de vídeo
    setLinktoplay(null); // Limpa o linktoplay
    onVideoModalChange?.(false);
  };

  if (renderInline) {
    if (!isAccordionOpen) return null;

    return selectedVideoId ? (
      shouldLoadPlayer && !usesIosWebKit ? (
        <div className="overflow-hidden rounded-[20px] bg-black shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
          <iframe
            key={selectedVideoId}
            width="100%"
            height={iframeHeight || 210}
            src={previewEmbedSrc}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <a
          href={usesIosWebKit ? canonicalWatchUrl : undefined}
          target={usesIosWebKit ? "_blank" : undefined}
          rel={usesIosWebKit ? "noreferrer" : undefined}
          className="group relative block w-full overflow-hidden rounded-[20px] bg-black text-left shadow-[0_18px_40px_rgba(0,0,0,0.2)]"
          onClick={(event) => {
            if (usesIosWebKit) {
              return;
            }
            event.preventDefault();
            setShouldLoadPlayer(true);
          }}
          aria-label={
            usesIosWebKit ? "Open video on YouTube" : "Play video inline"
          }
        >
          <img
            src={previewImageSources[0]}
            alt="Video preview"
            className="h-[208px] w-full object-cover"
            loading="eager"
            onError={(event) => {
              const nextIndex = Number(
                event.currentTarget.dataset.fallbackIndex || "0",
              ) + 1;
              if (nextIndex < previewImageSources.length) {
                event.currentTarget.dataset.fallbackIndex = String(nextIndex);
                event.currentTarget.src = previewImageSources[nextIndex];
                return;
              }
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-black shadow-[0_10px_25px_rgba(0,0,0,0.28)] transition-transform duration-200 group-active:scale-95">
              <span className="ml-1 text-2xl leading-none">▶</span>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10">
            <div className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[goldenrod]">
              YouTube
            </div>
            <div className="mt-1 text-sm font-bold text-white">
              {usesIosWebKit ? "Tap to open on YouTube" : "Tap to play inline"}
            </div>
          </div>
        </a>
      )
    ) : selectedVideo ? (
      <div className="rounded-[20px] bg-white px-4 py-5 text-sm font-semibold text-black shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
        This video link cannot be previewed.
      </div>
    ) : null;
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
          {selectedVideoId && (
            <div className="mb-4 p-3 border border-gray-300 rounded-md bg-gray-100">
              <iframe
                key={selectedVideoId}
                width="100%"
                height="315"
                src={previewEmbedSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
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
