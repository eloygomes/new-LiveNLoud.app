import { useState, useEffect } from "react";

/* eslint-disable react/prop-types */
const NewSongEmbed = ({ ytEmbedSongList = [], setEmbedLink }) => {
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
        })
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
    setEmbedLink((prevLinks = []) =>
      prevLinks.filter((link) => link !== urlToDelete)
    );

    if (selectedVideo === urlToDelete) {
      setSelectedVideo(null);
    }
  };

  return (
    <div className="flex flex-col neuphormism-b p-5 my-5 mr-5">
      <h1 className="text-xl pb-2 font-bold">Videos</h1>

      {selectedVideo && (
        <div className="mb-4 p-3 border border-gray-300 rounded-md bg-gray-100">
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

      <div className="flex flex-row">
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
          className="ml-2 px-3 py-1 neuphormism-b-btn text-xs"
          onClick={handleAddVideo}
        >
          Add
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <div className="flex flex-col px-1 py-2 my-2 m-0">
        <ul className="flex flex-col">
          {videoItems.map(({ title, url }, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center justify-between text-[6pt] py-3 px-1 my-2 neuphormism-b-btn"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => handleDeleteVideo(url)}
                  className="px-1 text-red-600 font-bold hover:text-red-800"
                  aria-label="Delete video"
                >
                  X
                </button>
                <span className="truncate">{title}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePlayClick(url)}
                className="px-1 font-extrabold tracking-wide hover:font-black"
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

export default NewSongEmbed;
