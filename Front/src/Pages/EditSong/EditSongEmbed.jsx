import { useState, useEffect } from "react";

/* eslint-disable react/prop-types */
const EditSongEmbed = ({ ytEmbedSongList = [], setEmbedLink }) => {
  const [inputValue, setInputValue] = useState("");
  const [videoItems, setVideoItems] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

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
    setSelectedVideo(url); // Define o vídeo selecionado para ser exibido
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
    <div className="my-5 flex flex-col rounded-[30px] neuphormism-b p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod] pb-5">
        Videos
      </p>

      {selectedVideo && (
        <div className="mb-4 rounded-[18px] neuphormism-b-se p-3">
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
            height="315"
            src={`https://www.youtube.com/embed/${getVideoId(selectedVideo)}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      <div className="flex flex-row gap-2">
        <input
          type="text"
          name="ytlink"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-md text-sm"
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
          className="neuphormism-b-btn flex h-9 min-w-[4.5rem] items-center justify-center rounded-[12px] px-3 text-xs font-bold uppercase text-black"
          onClick={handleAddVideo}
        >
          Add
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <div className="my-3">
        <ul className="flex flex-col gap-2">
          {videoItems.map(({ title, url }, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-left neuphormism-b-se"
            >
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium text-black">{title}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteVideo(url)}
                  className="neuphormism-b-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold text-red-700"
                  aria-label="Delete video"
                >
                  X
                </button>
              </div>
              <button
                type="button"
                onClick={() => handlePlayClick(url)}
                className="rounded-[12px] px-3 py-2 text-xs font-bold uppercase text-black neuphormism-b-btn"
              >
                PLAY
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EditSongEmbed;
