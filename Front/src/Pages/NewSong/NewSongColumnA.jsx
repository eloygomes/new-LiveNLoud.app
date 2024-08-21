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

    console.log(`dataFromUrl:`, dataFromUrl); // Confere o tipo de dataFromUrl

    // Função para capitalizar palavras e remover hífens
    const capitalizeAndFormat = (str) => {
      return str
        ? str
            .split("-") // Separa as palavras pelos hífens
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza a primeira letra de cada palavra
            .join(" ") // Junta as palavras com espaço
        : ""; // Retorna uma string vazia se `str` for undefined ou null
    };

    const formattedArtist = artistExtractedFromUrl
      ? capitalizeAndFormat(artistExtractedFromUrl)
      : "";
    const formattedSong = songExtractedFromUrl
      ? capitalizeAndFormat(songExtractedFromUrl)
      : "";

    console.log(`Artista formatado: ${formattedArtist}`);
    console.log(`Música formatada: ${formattedSong}`);

    if (typeof dataFromUrl === "string" && dataFromUrl.length > 0) {
      try {
        const parsedData = JSON.parse(dataFromUrl); // Converte a string em objeto
        if (parsedData && Array.isArray(parsedData.userdata)) {
          const dataFromURLuserdata = parsedData.userdata;

          console.log(dataFromURLuserdata);

          // somente me adora da pitty esta correta, agora precisa apronfundar as regras para as outras cifras, nao esquecer dos acentos

          console.log(typeof dataFromURLuserdata); // object

          const filteredData = dataFromURLuserdata.find((item) => {
            console.log(item); // Exibe o item atual
            // Adicione a lógica de filtragem aqui se necessário
            return (
              item.artist === formattedArtist && item.song === formattedSong
            );
          });

          console.log(filteredData); // Exibe o resultado filtrado

          console.log(`filteredData: ${filteredData}`);

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
  }, [dataFromUrl, songExtractedFromUrl, artistExtractedFromUrl]);

  // eslint-disable-next-line no-unused-vars
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
      let userdata = userRecord?.userdata || [];

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

      <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
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
        <button className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard">
          Discard
        </button>
      </div>
    </>
  );
}

export default NewSongColumnA;
