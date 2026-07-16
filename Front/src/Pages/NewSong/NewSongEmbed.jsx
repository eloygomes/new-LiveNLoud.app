import { useState, useEffect } from "react";
import { FaPlus, FaVideo } from "react-icons/fa";

/* eslint-disable react/prop-types */
const NewSongEmbed = ({ ytEmbedSongList = [], setEmbedLink, compact = false }) => {
  const [inputValue, setInputValue] = useState("");
  const [videoItems, setVideoItems] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null); // Estado para o vídeo selecionado

  const isValidYouTubeLink = (url) => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };

  const getVideoId = (url) => {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.replace("www.", "");

      if (host === "youtu.be") {
        return parsedUrl.pathname.slice(1) || null;
      }

      if (host === "youtube.com" || host === "m.youtube.com") {
        if (parsedUrl.pathname === "/watch") {
          return parsedUrl.searchParams.get("v");
        }

        if (parsedUrl.pathname.startsWith("/shorts/")) {
          return parsedUrl.pathname.split("/")[2] || null;
        }

        if (parsedUrl.pathname.startsWith("/embed/")) {
          return parsedUrl.pathname.split("/")[2] || null;
        }
      }
    } catch (parseError) {
      console.error("Invalid YouTube URL:", parseError);
    }

    return null;
  };

  const normalizeYouTubeUrl = (url) => {
    const videoId = getVideoId(url);
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  };

  const fetchYouTubeTitle = async (url) => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=${url}`);
      const data = await response.json();
      return data.title || null;
    } catch (error) {
      console.warn("Unable to fetch YouTube title:", error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadExistingVideos = async () => {
      const safeList = Array.isArray(ytEmbedSongList) ? ytEmbedSongList : [];
      const items = await Promise.all(
        safeList.map(async (url) => {
          const title = await fetchYouTubeTitle(url);
          const fallbackTitle = getVideoId(url)
            ? `YouTube video (${getVideoId(url)})`
            : "YouTube video";

          return {
            url,
            title:
              title && title.length > 50
                ? `${title.substring(0, 47)}...`
                : title || fallbackTitle,
          };
        }),
      );

      if (isMounted) {
        setVideoItems(items);
      }
    };

    loadExistingVideos();

    return () => {
      isMounted = false;
    };
  }, [ytEmbedSongList]);

  const handleAddVideo = async () => {
    const normalizedUrl = normalizeYouTubeUrl(inputValue.trim());

    if (!normalizedUrl || !isValidYouTubeLink(normalizedUrl)) {
      setError("Insert a valid YouTube link.");
      return;
    }

    if (ytEmbedSongList.includes(normalizedUrl)) {
      setError("This video is already in the list.");
      return;
    }

    setError(null);
    setEmbedLink((prevLinks = []) => [...prevLinks, normalizedUrl]);
    setInputValue("");
  };

  const handlePlayClick = (url) => {
    setSelectedVideo(url); // Define o vídeo selecionado para ser exibido no box
  };

  const handleDeleteVideo = (urlToDelete) => {
    if (!window.confirm("Delete this video from the song?")) return;
    setEmbedLink((prevLinks = []) =>
      prevLinks.filter((link) => link !== urlToDelete),
    );

    if (selectedVideo === urlToDelete) {
      setSelectedVideo(null);
    }
  };

  return (
    <div className={compact ? "my-0 flex flex-col rounded-[18px] border border-black/5 bg-white/60 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]" : "my-5 flex flex-col rounded-[30px] neuphormism-b p-5"}>
      <div className={`${compact ? "mb-3" : "pb-5"} flex items-center justify-between gap-3`}>
        <p className={`${compact ? "text-[10px] tracking-[0.22em]" : "text-[11px] tracking-[0.24em]"} font-bold uppercase text-[goldenrod]`}>
          Videos
        </p>
        {compact ? (
          <span className="flex items-center gap-1.5 rounded-full bg-black/[0.035] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-gray-500">
            <FaVideo className="text-[9px]" aria-hidden="true" />
            {videoItems.length} {videoItems.length === 1 ? "video" : "videos"}
          </span>
        ) : null}
      </div>

      {selectedVideo && (
        <div className={`${compact ? "mb-3 rounded-[13px] border border-black/5 bg-white/70 p-2.5" : "mb-4 rounded-[18px] neuphormism-b-se p-3"}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
              Preview
            </span>
            <button
              type="button"
              className="rounded-[10px] px-3 py-1 text-xs font-bold neuphormism-b-btn"
              onClick={() => setSelectedVideo(null)}
            >
              Close
            </button>
          </div>
          <iframe
            width="100%"
            height={compact ? "190" : "315"}
            src={`https://www.youtube.com/embed/${getVideoId(selectedVideo)}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      <div className={`${compact ? "rounded-[13px] border border-black/5 bg-white/75 p-2 shadow-[0_5px_14px_rgba(0,0,0,0.04)]" : ""} grid grid-cols-[minmax(0,1fr)_auto] gap-2`}>
        <input
          type="text"
          name="ytlink"
          placeholder="Insert your link here"
          className={`${compact ? "h-10 rounded-[10px] px-3 text-[12px] font-semibold" : "p-1 rounded-md text-sm"} w-full border border-gray-300 bg-white outline-none focus:border-[goldenrod]`}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddVideo();
            }
          }}
        />
        <button
          type="button"
          className={`${compact ? "h-10 min-w-[4.25rem] rounded-[10px] bg-[goldenrod]/15 text-[11px] shadow-[0_4px_12px_rgba(218,165,32,0.12)]" : "h-9 min-w-[4.5rem] rounded-[12px] text-xs neuphormism-b-btn"} flex items-center justify-center gap-1.5 px-3 font-bold uppercase text-black`}
          onClick={handleAddVideo}
        >
          {compact ? <FaPlus className="text-[9px]" aria-hidden="true" /> : null}
          Add
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {videoItems.length ? (
      <div className={compact ? "mt-2.5" : "my-3"}>
        <ul className={`${compact ? "gap-2" : "gap-2"} flex flex-col`}>
          {videoItems.map(({ title, url }, index) => (
            <li
              key={`${url}-${index}`}
              className={`${compact ? "rounded-[12px] border border-black/5 bg-white/70 px-2.5 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.04)]" : "rounded-[14px] px-3 py-2 neuphormism-b-se"} flex items-center justify-between gap-2 text-left`}
            >
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className={`${compact ? "text-[11px] font-bold" : "text-sm font-medium"} min-w-0 truncate text-black`}>{title}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteVideo(url)}
                  className={`${compact ? "h-7 w-7 rounded-[9px] bg-red-50 text-[10px]" : "h-8 w-8 rounded-[10px] text-xs neuphormism-b-btn"} flex shrink-0 items-center justify-center font-bold text-red-700`}
                  aria-label="Delete video"
                >
                  X
                </button>
              </div>
              <button
                type="button"
                onClick={() => handlePlayClick(url)}
                className={`${compact ? "rounded-[9px] bg-black px-2.5 py-1.5 text-[9px] text-white" : "rounded-[12px] px-3 py-2 text-xs text-black neuphormism-b-btn"} font-bold uppercase`}
              >
                PLAY
              </button>
            </li>
          ))}
        </ul>
      </div>
      ) : null}
    </div>
  );
};

export default NewSongEmbed;
