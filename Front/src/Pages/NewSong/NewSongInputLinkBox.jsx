/* eslint-disable react/prop-types */
import { useEffect } from "react";
import axios from "axios";

function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  progress,
  setProgress,
  setArtistExtractedFromUrl,
  setSongExtractedFromUrl,
  gettingSongData,
  setShowSnackBar,
  setSnackbarMessage,
  dataFromUrl,
}) {
  function extractArtistAndSong(url) {
    if (!url) {
      throw new Error("URL is undefined or empty");
    }

    const parts = url.split("/").filter(Boolean); // Filtra partes vazias
    const artist = parts[parts.length - 2]; // Penúltima parte
    const song = parts[parts.length - 1]; // Última parte

    if (!artist || !song) {
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: "Could not extract artist and song from the URL",
      });
      throw new Error("Could not extract artist and song from the URL");
    }

    const artistFromUrl = artist;
    const songFromUrl = song;

    return { artistFromUrl, songFromUrl };
  }

  const handledata = async () => {
    if (!instrument || typeof instrument !== "string" || !instrument.trim()) {
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: "Please insert a valid URL before proceeding.",
      });
      return;
    }

    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: "User email is required to register the song.",
      });
      return;
    }

    try {
      const { artistFromUrl, songFromUrl } = extractArtistAndSong(instrument);
      setArtistExtractedFromUrl(artistFromUrl);
      setSongExtractedFromUrl(songFromUrl);

      console.log("Sending data:", {
        artist: artistFromUrl,
        song: songFromUrl,
        email: userEmail,
        instrument: `${instrumentName}`,
        instrument_progressbar: `${progress}`,
        link: instrument,
      });

      // ENVIANDO OS DADOS REGISTRANDO A MÚSICA (POST)
      await axios.post("https://www.api.live.eloygomes.com.br/api/scrape", {
        artist: artistFromUrl,
        song: songFromUrl,
        email: userEmail,
        instrument: `${instrumentName}`,
        instrument_progressbar: `${progress}`,
        link: instrument,
      });

      // Após o POST, realiza o GET para atualizar os dados
      await gettingSongData();
    } catch (error) {
      console.error(
        "Error registering user in API:",
        error.response ? error.response.data : error.message
      );
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      handledata().catch((error) => console.error(error));
    }, 5000); // 5 segundos de intervalo

    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
  }, [instrument, progress]);

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      <div className="flex flex-row justify-between">
        <span className="text-sm pb-2 font-bold">
          {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
        </span>
        <div className="flex flex-row">
          <span
            className={`${
              instrument ? "text-green-500" : "text-red-500"
            } text-sm rounded-sm`}
          >
            {instrument ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      <div className="flex flex-row h-6">
        <input
          type="text"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-sm text-sm"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          onBlur={() => {
            handledata().catch((error) => console.error(error));
            console.log(`instrumentName: ${instrumentName}`);
            console.log(`instrument:${instrument}`);
            console.log(progress);
          }}
        />
      </div>
      <div className="flex flex-row">
        <div className="flex flex-row items-center mt-1 w-1/2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(parseInt(e.target.value, 10)))}
            className="w-1/2"
          />
        </div>
        <div className="relative flex flex-row pt-1  w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
            ></div>
          </div>
          <div className="w-1/3 pl-4 py-3 ml-5 text-right">
            <span className=" text-sm ml-auto">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
