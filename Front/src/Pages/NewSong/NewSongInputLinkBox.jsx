import axios from "axios";

/* eslint-disable react/prop-types */
function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  progress,
  setProgress,
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

    // const artistFromUrl = artist.replace(/-/g, " ");
    const artistFromUrl = artist;
    // const songFromUrl = song.replace(/-/g, " ");
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

    // Extraindo artista e música da URL
    try {
      const { artistFromUrl, songFromUrl } = extractArtistAndSong(instrument);

      // ENVIANDO OS DADOS REGISTRANDO A MÚSICA
      await axios.post("https://www.api.live.eloygomes.com.br/api/scrape", {
        artist: artistFromUrl,
        song: songFromUrl,
        email: userEmail,
        instrument: `${instrumentName}`, // Formato correto: guitar01
      });
      // Sucesso ao registrar na API
    } catch (error) {
      console.error("Error registering user in API:", error);
      alert("Failed to register the song. Please check the URL and try again.");
    }
  };

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-se px-5 py-3">
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
          name="guitar01link"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-sm text-sm"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
        />
        <button
          className="px-1 ml-1 bg-blue-500 text-white rounded-sm"
          onClick={() => {
            handledata().catch((error) => console.error(error)); // Adicionando tratamento de erro
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
