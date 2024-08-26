/* eslint-disable react/prop-types */

import axios from "axios";

function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  progress,
  setProgress,
  setArtistExtractedFromUrl,
  setSongExtractedFromUrl,
  gettingSongData, // Recebe a função do pai para atualizar os dados
}) {
  function extractArtistAndSong(url) {
    if (!url) {
      throw new Error("URL is undefined or empty");
    }

    const parts = url.split("/").filter(Boolean); // Filtra partes vazias
    const artist = parts[parts.length - 2]; // Penúltima parte
    const song = parts[parts.length - 1]; // Última parte

    if (!artist || !song) {
      throw new Error("Could not extract artist and song from the URL");
    }

    const artistFromUrl = artist;
    const songFromUrl = song;

    return { artistFromUrl, songFromUrl };
  }

  const handledata = async () => {
    if (!instrument) {
      console.error("Instrument URL is empty");
      alert("Please insert a valid URL before proceeding.");
      return;
    }

    const userEmail = localStorage.getItem("userEmail");

    try {
      const { artistFromUrl, songFromUrl } = extractArtistAndSong(instrument);
      setArtistExtractedFromUrl(artistFromUrl);
      setSongExtractedFromUrl(songFromUrl);

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
      console.error("Error registering user in API:", error);
      alert("Failed to register the song. Please check the URL and try again.");
    }
  };

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      <div className="flex flex-row justify-between">
        <span className="text-sm pb-2 font-bold">{instrumentName}</span>
        <div className="flex flex-row">
          <span className="text-sm pb-2">STATUS:</span>
          <span className="text-sm pb-2">OFFLINE</span>
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
          }}
        />
        <button
          className="px-1 ml-1 bg-blue-500 text-white rounded-sm"
          onClick={() => {
            console.log("clicado");
            console.log(`instrumentName: ${instrumentName}`);
            console.log(`instrument:${instrument}`);
            console.log(progress);
          }}
        >
          +
        </button>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-row items-center mt-1 w-1/2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-1/2"
          />
          <span className="ml-2 text-sm">{progress}%</span>
        </div>
        <div className="relative pt-1 mt-6 w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
