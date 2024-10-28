import axios from "axios";
import { useEffect, useState } from "react";

/* eslint-disable react/prop-types */
function EditSongInputLinkBox({
  instrumentName,
  link,
  setInstrument,
  progress,
  setProgress,
  dataFromAPI,
}) {
  const [dataFromAPIParsed, setDataFromAPIParsed] = useState(null);

  useEffect(() => {
    try {
      if (typeof dataFromAPI === "string" && dataFromAPI.trim() !== "") {
        const dataToLoad = JSON.parse(dataFromAPI);
        setDataFromAPIParsed(dataToLoad);
      } else if (typeof dataFromAPI === "object" && dataFromAPI !== null) {
        setDataFromAPIParsed(dataFromAPI);
      } else {
        console.warn("Invalid or empty dataFromAPI:", dataFromAPI);
        setDataFromAPIParsed({});
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      setDataFromAPIParsed({});
    }
  }, [dataFromAPI]);

  useEffect(() => {
    if (dataFromAPIParsed) {
      const instrumentData = dataFromAPIParsed[instrumentName];
      if (instrumentData && instrumentData.link) {
        setInstrument(instrumentData.link);
        setProgress(instrumentData.progress);
      }
    }
  }, [dataFromAPIParsed, instrumentName, setInstrument, setProgress]);

  // console.log(progress);

  const handledata = async () => {
    // if (!instrument || typeof instrument !== "string" || !instrument.trim()) {
    //   // setShowSnackBar(true);
    //   setSnackbarMessage({
    //     title: "Error",
    //     message: "Please insert a valid URL before proceeding.",
    //   });
    //   return;
    // }

    const userEmail = localStorage.getItem("userEmail");
    const artistFromUrl = localStorage.getItem("artist");
    const songFromUrl = localStorage.getItem("song");

    // console.log("userEmail", userEmail);
    // console.log("artistFromUrl", artistFromUrl);
    // console.log("songFromUrl", songFromUrl);
    // console.log("instrument", instrumentName);
    // console.log("instrument_progressbar", progress);
    // console.log("link", link);

    const url = link;
    const parts = url.split("/").filter(Boolean); // Filtra partes vazias
    const artist = parts[parts.length - 2]; // Penúltima parte
    const song = parts[parts.length - 1]; // Última parte

    // console.log("artist", artist);
    // console.log("song", song);

    try {
      // ENVIANDO OS DADOS REGISTRANDO A MÚSICA (POST)
      await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
        artist: artist,
        song: song,
        email: userEmail,
        instrument: `${instrumentName}`,
        instrument_progressbar: `${progress}`,
        link: link,
      });

      // Após o POST, realiza o GET para atualizar os dados
      // await gettingSongData();
    } catch (error) {
      console.error(
        "Error registering user in API:",
        error.response ? error.response.data : error.message
      );
    }
  };

  useEffect(() => {
    handledata().catch((error) => console.error(error));
  }, [link, progress]);

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      <div className="flex flex-row justify-between">
        <span className="text-sm pb-2 font-bold">
          {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
        </span>
        <h6>{}</h6>
        <div className="flex flex-row">
          <span
            className={`${
              link ? "text-green-500" : "text-red-500"
            } text-sm rounded-sm`}
          >
            {link ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex flex-row h-6">
        <input
          type="text"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-sm text-sm"
          value={link}
          onChange={(e) => setInstrument(e.target.value)}
          onBlur={() => {
            handledata();
            // console.log(`instrumentName: ${instrumentName}`);
            // console.log(`instrument:${instrument}`);
            // console.log(progress);
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
        <div className="relative flex flex-row pt-1 w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
            <div
              style={{ width: `${progress || 0}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
            ></div>
          </div>
          <div className="w-1/3 pl-4 py-3 ml-5 text-right">
            <span className="text-sm ml-auto">{progress || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSongInputLinkBox;
