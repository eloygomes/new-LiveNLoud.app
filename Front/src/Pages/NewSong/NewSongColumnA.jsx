/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import NewSongSongData from "./NewSongSongData";
import axios from "axios";

function NewSongColumnA({
  dataFromUrl,
  artistExtractedFromUrl,
  songExtractedFromUrl,
  guitar01,
  guitar02,
  bass,
  keyboard,
  drums,
  voice,
  progBarG01,
  progBarG02,
  progBarBass,
  progBarKey,
  progBarDrums,
  progBarVoice,
}) {
  const [songName, setSongName] = useState("Loading...");
  const [artistName, setArtistName] = useState("Loading...");
  const [capoData, setCapoData] = useState("Loading...");
  const [tomData, setTomData] = useState("Loading...");
  const [tunerData, setTunerData] = useState("Loading...");
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState([
    "https://www.youtube.com/watch?v=EaPYSQvMQno",
    "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    "https://www.youtube.com/watch?v=ms1N6Sr660U",
  ]);
  const [instrumentName, setInstrumentName] = useState("");
  const [instrument, setInstrument] = useState();

  useEffect(() => {
    let isMounted = true; // Flag para evitar execução após o componente ser desmontado

    if (guitar01) {
      setInstrumentName("guitar01");
      setInstrument(guitar01);
    } else if (guitar02) {
      setInstrumentName("guitar02");
      setInstrument(guitar02);
    } else if (bass) {
      setInstrumentName("bass");
      setInstrument(bass);
    } else if (keyboard) {
      setInstrumentName("keys");
      setInstrument(keyboard);
    } else if (drums) {
      setInstrumentName("drums");
      setInstrument(drums);
    } else if (voice) {
      setInstrumentName("voice");
      setInstrument(voice);
    } else {
      return;
    }

    if (!instrument) {
      console.error("Instrument ainda é indefinido após a configuração.");
      return;
    }

    if (typeof dataFromUrl === "string" && dataFromUrl.length > 0) {
      try {
        const parsedData = JSON.parse(dataFromUrl);
        if (parsedData && Array.isArray(parsedData.userdata) && isMounted) {
          const dataFromURLuserdata = parsedData.userdata;

          const filteredData = dataFromURLuserdata.find((item) => {
            const instruments = [
              "guitar01",
              "guitar02",
              "bass",
              "keys",
              "drums",
              "voice",
            ];

            return instruments.some((instrumentName) => {
              const instrumentData = item[instrumentName];
              const userLink =
                typeof instrument?.link === "function"
                  ? instrument.link()
                  : instrument?.link;

              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = userLink;
              const userLinkContent =
                tempDiv.querySelector("a")?.textContent || "Link inválido";

              const dbLink =
                typeof instrumentData?.link === "function"
                  ? instrumentData.link()
                  : instrumentData?.link;

              return (
                typeof dbLink === "string" &&
                typeof userLinkContent === "string" &&
                dbLink === userLinkContent
              );
            });
          });

          if (filteredData) {
            setSongName(filteredData.song || "Unknown Song");
            setArtistName(filteredData.artist || "Unknown Artist");
            setCapoData(filteredData.guitar01?.capo || "No Capo");
            setTomData(filteredData.guitar01?.tom || "No Tom");
            setTunerData(filteredData.guitar01?.tuning || "Standard ");
            setGeralPercentage(filteredData.progressBar || 0);

            // Só atualiza o embedLink se o valor for diferente do atual
            if (filteredData.embedVideos.length > 0) {
              setEmbedLink(filteredData.embedVideos);
            }
          } else {
            console.log("Música e artista não encontrados");
          }
        } else {
          console.error("JSON inválido ou userdata não é um array.");
        }
      } catch (error) {
        console.error("Erro ao analisar dataFromUrl:", error);
      }
    } else {
      console.log("dataFromUrl não contém userdata válida.");
    }

    if (
      progBarG01 |
      progBarG02 |
      progBarBass |
      progBarKey |
      progBarDrums |
      progBarVoice
    ) {
      setGeralPercentage(
        parseInt(
          (parseInt(progBarG01, 10) +
            parseInt(progBarG02, 10) +
            parseInt(progBarBass, 10) +
            parseInt(progBarKey, 10) +
            parseInt(progBarDrums, 10) +
            parseInt(progBarVoice, 10)) /
            6
        )
      );
    }

    return () => {
      isMounted = false; // Define como falso ao desmontar para evitar setState
    };
  }, [
    dataFromUrl,
    songExtractedFromUrl,
    artistExtractedFromUrl,
    instrument,
    guitar01,
    guitar02,
    bass,
    keyboard,
    drums,
    voice,
    progBarG01,
    progBarG02,
    progBarBass,
    progBarKey,
    progBarDrums,
    progBarVoice,
  ]);

  const createNewSong = async ({ instrumentName, progress }) => {
    const userEmail = localStorage.getItem("userEmail");

    try {
      const userdata = {
        // song: songExtractedFromUrl,
        song: songName,
        artist: artistName,
        progressBar: progress ? progress : 0,
        instruments: {
          guitar01: instrumentName === "guitar01",
          guitar02: instrumentName === "guitar02",
          bass: instrumentName === "bass",
          keys: instrumentName === "keys",
          drums: instrumentName === "drums",
          voice: instrumentName === "voice",
        },
        [instrumentName]: {
          active: true,
          capo: capoData,
          tuning: tunerData,
          lastPlay: new Date().toISOString().split("T")[0],
          // songCifra: "",
          progress: progress,
        },
        embedVideos: embedLink,
        updateIn: new Date().toISOString().split("T")[0],
        email: userEmail,
      };

      const response = await axios.post(
        `https://www.api.live.eloygomes.com.br/api/newsong`,
        {
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: userdata,
        }
      );

      console.log("Dados salvos com sucesso:", response.data);
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
    }
  };

  return (
    <>
      <NewSongSongData
        songName={songName}
        artistName={artistName}
        capoData={capoData}
        tomData={tomData}
        tunerData={tunerData}
        fistTime={"2024-08-16"}
        lastTime={"2024-08-16"}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />
      <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />
      <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
          onClick={() =>
            createNewSong({
              instrumentName,
              instrument,
              progress: geralPercentage,
            })
          }
        >
          Save
        </button>
        <button className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard">
          Discard
        </button>
      </div>
    </>
  );
}

export default NewSongColumnA;
