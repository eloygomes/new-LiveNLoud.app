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
}) {
  const [songName, setSongName] = useState("Loading song...");
  const [artistName, setArtistName] = useState("Loading artist...");
  const [capoData, setCapoData] = useState("Loading capo...");
  const [tomData, setTomData] = useState("Loading tom...");
  const [tunerData, setTunerData] = useState("Loading tuner...");
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState(["Loading..."]);

  const [instrumentName, setInstrumentName] = useState("");
  const [instrument, setInstrument] = useState();

  useEffect(() => {
    console.log("AAAAAAAAA");

    // Verifica se algum instrumento foi passado e define o instrument
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
      console.error("Nenhum instrumento válido foi fornecido.");
      return; // Sai cedo do efeito se `instrument` estiver indefinido
    }

    // Verifica se `instrument` foi corretamente definido
    if (!instrument) {
      console.error("Instrument ainda é indefinido após a configuração.");
      return;
    }

    if (typeof dataFromUrl === "string" && dataFromUrl.length > 0) {
      try {
        const parsedData = JSON.parse(dataFromUrl);
        if (parsedData && Array.isArray(parsedData.userdata)) {
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
            console.log("Música encontrada:", filteredData);
            setSongName(filteredData.song || "Unknown Song");
            setArtistName(filteredData.artist || "Unknown Artist");
            setCapoData(filteredData.guitar01?.capo || "No Capo");
            setTomData(filteredData.guitar01?.tom || "No Tom");
            setTunerData(filteredData.guitar01?.tuning || "Standard Tuning");
            setGeralPercentage(filteredData.progressBar || 0);
            setEmbedLink(
              filteredData.embedVideos.length > 0
                ? filteredData.embedVideos
                : ["No videos available"]
            );
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
  ]);

  // Função createNewSong
  const createNewSong = async ({ instrumentName, progress }) => {
    const userEmail = localStorage.getItem("userEmail");

    try {
      const existingRecordResponse = await axios.get(
        `https://www.api.live.eloygomes.com.br/api/alldata`,
        {
          params: {
            email: userEmail,
          },
        }
      );

      console.log("API response:", existingRecordResponse.data);

      const userRecord = existingRecordResponse.data.find(
        (record) => record.email === userEmail
      );

      let userdata = userRecord?.userdata || [];

      if (Array.isArray(userdata)) {
        let existingRecord = userdata.find(
          (record) =>
            record.song === songExtractedFromUrl &&
            record.artist === artistExtractedFromUrl
        );

        if (existingRecord) {
          existingRecord.progressBar = progress / 6;
          existingRecord.instruments[instrumentName.toLowerCase()] = true;
          existingRecord[instrumentName.toLowerCase()] = {
            active: true,
            capo: capoData,
            tuning: tunerData,
            lastPlay: new Date().toISOString().split("T")[0],
            songCifra: "",
            progress: progress,
          };
          existingRecord.updateIn = new Date().toISOString().split("T")[0];

          await axios.put(`https://www.api.live.eloygomes.com.br/api/update`, {
            databaseComing: "liveNloud_",
            collectionComing: "data",
            userdata: existingRecord,
          });
        } else {
          const newId = userdata.length + 1;

          const newRecord = {
            id: newId,
            song: songExtractedFromUrl,
            artist: artistExtractedFromUrl,
            progressBar: progress / 6,
            instruments: {
              guitar01: instrumentName === "guitar01",
              guitar02: instrumentName === "guitar02",
              bass: instrumentName === "bass",
              keys: instrumentName === "keys",
              drums: instrumentName === "drums",
              voice: instrumentName === "voice",
            },
            guitar01: {
              active: instrumentName === "guitar01",
              capo: capoData,
              tuning: tunerData,
              lastPlay: new Date().toISOString().split("T")[0],
              songCifra: "",
              progress: instrumentName === "guitar01" ? progress : null,
            },
            embedVideos: embedLink,
            addedIn: new Date().toISOString().split("T")[0],
            updateIn: new Date().toISOString().split("T")[0],
            email: userEmail,
          };

          await axios.post(
            `https://www.api.live.eloygomes.com.br/api/newsong`,
            {
              databaseComing: "liveNloud_",
              collectionComing: "data",
              userdata: newRecord,
            }
          );
        }
      } else {
        console.error("userdata is not an array or is undefined");
        throw new Error("Invalid userdata structure from API");
      }
    } catch (error) {
      console.error("Error registering user in API:", error);
      throw new Error("API registration failed");
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
      <NewSongEmbed ytEmbedSongList={embedLink} />
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
