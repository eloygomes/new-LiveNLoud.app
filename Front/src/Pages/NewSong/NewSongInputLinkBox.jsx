/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";

function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  progress,
  setProgress,

  // Recebendo do pai, caso já tenhamos
  artistName,
  setArtistName,
  songName,
  setSongName,

  gettingSongData,
  setShowSnackBar,
  setSnackbarMessage,

  // Caso ainda precise extrair do link. Se for false, ignora extração
  useLinkExtraction = false,

  setSongScrapado,
  setArtistScrapado,
  cifraExiste,
  setCifraExiste,

  cifraFROMDB,
  setCifraFROMDB,
}) {
  // Guardamos o doc encontrado, se houver
  const [foundDocument, setFoundDocument] = useState(null);

  // Apenas se quisermos extrair de URL
  function extractArtistAndSong(url) {
    if (!url) {
      throw new Error("URL is undefined or empty");
    }
    const parts = url.split("/").filter(Boolean);
    const artist = parts[parts.length - 2];
    const song = parts[parts.length - 1];

    if (!artist || !song) {
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: "Could not extract artist and song from the URL",
      });
      throw new Error("Could not extract artist and song from the URL");
    }
    return { artistFromUrl: artist, songFromUrl: song };
  }

  // checkIfCifraExists retorna { exists: boolean, document: objetoOuNull }
  const checkIfCifraExists = async (inst, userLink) => {
    try {
      const response = await axios.post(
        "https://api.live.eloygomes.com.br/api/generalCifra",
        {
          instrument: inst, // ex. 'guitar01'
          link: userLink, // ex. 'https://cifraclub...'
        }
      );
      // Se 200, existe:
      return {
        exists: true,
        document: response.data,
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { exists: false, document: null };
      }
      throw error; // outro erro
    }
  };

  const handledata = async () => {
    // 1) Validar link
    if (!instrument || typeof instrument !== "string" || !instrument.trim()) {
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

    // 2) Se não tivermos artistName e songName, e quisermos extrair do link:
    let finalArtist = artistName;
    let finalSong = songName;

    if (useLinkExtraction && (!artistName || !songName)) {
      try {
        const { artistFromUrl, songFromUrl } = extractArtistAndSong(instrument);
        // Aqui você poderia normalizar p/ o formato do banco
        finalArtist = artistFromUrl;
        finalSong = songFromUrl;
      } catch (err) {
        console.error(err);
        return;
      }
    }

    // 3) Verificar se existe no banco
    let cifraExiste;
    try {
      // instrumentName = 'guitar01'
      // instrument = 'https://www.cifraclub.com.br/...'
      // console.log("instrumentName:", instrumentName);
      // console.log("instrument:", instrument);
      cifraExiste = await checkIfCifraExists(instrumentName, instrument);
    } catch (error) {
      console.error("Erro ao verificar se cifra existe:", error);
      // Exibir snackbar etc.
      return;
    }

    if (cifraExiste.exists) {
      // Document existe
      console.log("Song found in DB, doc:", cifraExiste.document);

      localStorage.setItem("cifraFROMDB", JSON.stringify(cifraExiste.document));
      localStorage.setItem("fromWHERE", "DB");
      return;
    }

    // 4) Se já existe, usa os dados do doc
    if (cifraExiste.exists && cifraExiste.document) {
      setFoundDocument(cifraExiste.document);

      // Opcional: atualizar os states locais
      if (cifraExiste.document.song) {
        setSongName(cifraExiste.document.song);
      }
      if (cifraExiste.document.artist) {
        setArtistName(cifraExiste.document.artist);
      }

      console.log("Song found in DB, doc:", cifraExiste.document);

      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Info",
        message: "This song already exists in your library.",
      });
      // Se quiser pular o scrape: return
      return;
    }

    // 5) Se não existe, chamamos /scrape
    try {
      await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
        artist: finalArtist,
        song: finalSong,
        email: userEmail,
        instrument: instrumentName,
        instrument_progressbar: progress,
        link: instrument,
      });
      // Se deu tudo certo, atualiza
      await gettingSongData();
      localStorage.setItem("fromWHERE", "URL");
      console.log("Song created successfully via /scrape");
    } catch (error) {
      console.error("Error registering user in API:", error);
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: error.response
          ? error.response.data.message ||
            "An error occurred while processing your request."
          : "An error occurred while processing your request.",
      });
    }
  };

  // Sempre que trocar instrument ou progress, chamamos handledata
  useEffect(() => {
    handledata().catch((error) => console.error(error));
    // eslint-disable-next-line
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
            handledata();
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
            onChange={(e) => setProgress(Number.parseInt(e.target.value, 10))}
            className="w-1/2"
          />
        </div>
        <div className="relative flex flex-row pt-1 w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
            ></div>
          </div>
          <div className="w-1/3 pl-4 py-3 ml-5 text-right">
            <span className="text-sm ml-auto">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
