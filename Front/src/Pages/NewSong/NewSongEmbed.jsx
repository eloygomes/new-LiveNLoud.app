import { useState, useEffect } from "react";

/* eslint-disable react/prop-types */
const NewSongEmbed = ({ ytEmbedSongList = [], setEmbedLink }) => {
  const [btnStatus, setBtnStatus] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [videoTitles, setVideoTitles] = useState([]);
  const [videoLinks, setVideoLinks] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null); // Estado para o vídeo selecionado

  useEffect(() => {
    // Função para carregar os títulos dos vídeos existentes em ytEmbedSongList
    const loadExistingVideos = async () => {
      if (ytEmbedSongList && ytEmbedSongList.length > 0) {
        const titles = await Promise.all(
          ytEmbedSongList.map(async (url) => {
            const title = await fetchYouTubeTitle(url);
            return title ? title : "Título não disponível";
          })
        );
        setVideoTitles(titles);
        setVideoLinks(ytEmbedSongList);
      }
    };

    loadExistingVideos();
  }, [ytEmbedSongList]);

  const isValidYouTubeLink = (url) => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };

  const fetchYouTubeTitle = async (url) => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=${url}`);
      const data = await response.json();
      if (data.title) {
        return data.title;
      } else {
        throw new Error("O título não foi encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar título do vídeo:", error);
      setError("Failed to fetch video title.");
      return null;
    }
  };

  const handleInputChange = async (e) => {
    const url = e.target.value;
    setInputValue(url);

    if (isValidYouTubeLink(url)) {
      setBtnStatus(true);
      const title = await fetchYouTubeTitle(url);
      if (title) {
        const truncatedTitle =
          title.length > 50 ? `${title.substring(0, 47)}...` : title;
        setVideoTitles((prevTitles) => [...prevTitles, truncatedTitle]);
        setVideoLinks((prevLinks) => [...prevLinks, url]);
        setEmbedLink((prevLinks = []) => [...prevLinks, url]); // Default to an empty array if prevLinks is undefined
        setInputValue(""); // Limpa o campo de input após adicionar o título
        setBtnStatus(false); // Desativa o botão até que um novo link seja adicionado
      }
    } else {
      setBtnStatus(false);
    }
  };

  const handlePlayClick = (url) => {
    setSelectedVideo(url); // Define o vídeo selecionado para ser exibido no box
  };

  return (
    <div className="flex flex-col neuphormism-b p-5 my-5 mr-5">
      <h1 className="text-xl pb-2 font-bold">Videos</h1>

      {selectedVideo && (
        <div className="mb-4 p-3 border border-gray-300 rounded-md bg-gray-100">
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${new URL(
              selectedVideo
            ).searchParams.get("v")}`}
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
          onChange={handleInputChange}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <div className="flex flex-col px-1 py-2 my-2 m-0">
        <ul className="flex flex-col">
          {videoTitles.map((title, index) => (
            <li
              key={index}
              className="flex justify-between text-[6pt] py-3 px-1 my-2 neuphormism-b-btn"
            >
              <span>{title}</span>
              <button
                onClick={() => handlePlayClick(videoLinks[index])}
                className="hover:font-black px-1"
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
