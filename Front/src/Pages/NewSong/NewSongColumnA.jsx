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
  // Estados iniciais com valores padrão
  const [songName, setSongName] = useState("Loading song...");
  const [artistName, setArtistName] = useState("Loading artist...");
  const [capoData, setCapoData] = useState("Loading capo...");
  const [tomData, setTomData] = useState("Loading tom...");
  const [tunerData, setTunerData] = useState("Loading tuner...");
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState(["Loading..."]);

  const [instrumentName, setinstrumentName] = useState("");
  const [instument, setinstument] = useState();

  // Definindo variáveis para instrumento

  useEffect(() => {
    if (guitar01) {
      setinstrumentName("guitar01");
      setinstument(guitar01);
    } else if (guitar02) {
      setinstrumentName("guitar02");
      setinstument(guitar02);
    } else if (bass) {
      setinstrumentName("bass");
      setinstument(bass);
    } else if (keyboard) {
      setinstrumentName("keys");
      setinstument(keyboard);
    } else if (drums) {
      setinstrumentName("drums");
      setinstument(drums);
    } else if (voice) {
      setinstrumentName("voice");
      setinstument(voice);
    }

    console.log(`instrumentName: ${instrumentName}`);

    if (
      dataFromUrl &&
      dataFromUrl.userdata &&
      dataFromUrl.userdata.length > 0
    ) {
      const userData = dataFromUrl.userdata[0];
      setSongName(userData.song || "Unknown Song");
      setArtistName(userData.artist || "Unknown Artist");
      setCapoData(userData.guitar01?.capo || "No Capo");
      setTomData(userData.guitar01?.tom || "No Tom");
      setTunerData(userData.guitar01?.tuning || "Standard Tuning");
      setGeralPercentage(userData.progressBar || 0);
      setEmbedLink(
        userData.embedVideos.length > 0
          ? userData.embedVideos
          : ["No videos available"]
      );
    }
  }, [dataFromUrl]);

  const createNewSong = async ({ instrumentName, instument, progress }) => {
    const userEmail = localStorage.getItem("userEmail");

    try {
      // Primeiro, busca para ver se já existe um registro com a música e o artista
      const existingRecordResponse = await axios.get(
        `https://www.api.live.eloygomes.com.br/api/alldata`,
        {
          params: {
            email: userEmail,
          },
        }
      );

      console.log("API response:", existingRecordResponse.data);

      // Encontre o objeto correto dentro da resposta que corresponde ao email do usuário
      const userRecord = existingRecordResponse.data.find(
        (record) => record.email === userEmail
      );

      // Verifica se o userdata existe e é um array
      let userdata = userRecord?.userdata;

      if (Array.isArray(userdata)) {
        let existingRecord = userdata.find(
          (record) =>
            record.song === songExtractedFromUrl &&
            record.artist === artistExtractedFromUrl
        );

        if (existingRecord) {
          // Se existir, atualiza o registro existente
          existingRecord.progressBar = progress / 6;
          existingRecord.instruments[instrumentName.toLowerCase()] = true;
          existingRecord[instrumentName.toLowerCase()] = {
            active: true,
            capo: capoData,
            tuning: tunerData,
            lastPlay: new Date().toISOString().split("T")[0],
            songCifra: "", // Assumindo que você pode querer modificar isso
            progress: progress,
          };
          existingRecord.updateIn = new Date().toISOString().split("T")[0];

          // Envia a atualização para a API
          await axios.put(`https://www.api.live.eloygomes.com.br/api/update`, {
            databaseComing: "liveNloud_",
            collectionComing: "data",
            userdata: existingRecord,
          });
        } else {
          // Se não existir, cria um novo registro
          const newId = userdata.length + 1; // Calcula um novo ID com base no tamanho do array

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
            // Adicione os outros instrumentos de forma similar
            embedVideos: embedLink,
            addedIn: new Date().toISOString().split("T")[0],
            updateIn: new Date().toISOString().split("T")[0],
            email: userEmail,
          };

          // Envia o novo registro para a API
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

      <div className="flex flex-row neuphormism-b-se p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() =>
            createNewSong({
              instrumentName,
              instument,
              progress: geralPercentage,
            })
          }
        >
          Save
        </button>
        <button className="bg-red-500 hover:bg-blue-700 text-white font-bold ml-5 py-2 px-4 rounded">
          Discard
        </button>
      </div>
    </>
  );
}

export default NewSongColumnA;
