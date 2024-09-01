/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import NewSongSongData from "./NewSongSongData";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    let isMounted = true; // Flag to avoid executing after the component is unmounted

    // Set instrument based on the available data
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

    if (typeof dataFromUrl === "string" && dataFromUrl.length > 0) {
      try {
        const parsedData = JSON.parse(dataFromUrl);

        const actualSongData = parsedData[parsedData.length - 1];
        console.log("actualSongData", actualSongData.song);
        setArtistName(actualSongData.artist);
        setSongName(actualSongData.song);
        setCapoData(actualSongData.capo);
        setTomData(actualSongData.tom);
        setTunerData(actualSongData.tuning);
        setGeralPercentage(actualSongData.progressBar);
        setEmbedLink(actualSongData.embed);
      } catch (error) {
        console.error("Error parsing dataFromUrl:", error);
      }
    } else {
      console.log("dataFromUrl does not contain valid userdata.");
    }

    if (
      progBarG01 ||
      progBarG02 ||
      progBarBass ||
      progBarKey ||
      progBarDrums ||
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
      isMounted = false; // Set to false when unmounting to avoid setState
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

  // const createNewSong = async ({ instrumentName, progress }) => {
  //   const userEmail = localStorage.getItem("userEmail");

  //   console.log("songName", songName);
  //   console.log("artistName", artistName);
  //   console.log("instrumentName", instrumentName);
  //   console.log("progress", progress);
  //   console.log("geralPercentage", geralPercentage);

  //   if (songName !== "Loading..." && artistName !== "Loading...") {
  //     try {
  //       const userdata = {
  //         song: songName,
  //         artist: artistName,
  //         progressBar: geralPercentage ? geralPercentage : 0, // Certifique-se de que progressBar está definido
  //         instruments: {
  //           guitar01: instrumentName === "guitar01",
  //           guitar02: instrumentName === "guitar02",
  //           bass: instrumentName === "bass",
  //           keys: instrumentName === "keys",
  //           drums: instrumentName === "drums",
  //           voice: instrumentName === "voice",
  //         },
  //         guitar01: {
  //           active: instrumentName === "guitar01",
  //           capo: instrumentName === "guitar01" ? capoData : null,
  //           tuning: instrumentName === "guitar01" ? tunerData : null,
  //           lastPlay:
  //             instrumentName === "guitar01"
  //               ? new Date().toISOString().split("T")[0]
  //               : null,
  //         },
  //         guitar02: {
  //           active: instrumentName === "guitar02",
  //           capo: instrumentName === "guitar02" ? capoData : null,
  //           tuning: instrumentName === "guitar02" ? tunerData : null,
  //           lastPlay:
  //             instrumentName === "guitar02"
  //               ? new Date().toISOString().split("T")[0]
  //               : null,
  //         },
  //         bass: {
  //           active: instrumentName === "bass",
  //           capo: instrumentName === "bass" ? capoData : "None",
  //           tuning: instrumentName === "bass" ? tunerData : "Standard",
  //           lastPlay:
  //             instrumentName === "bass"
  //               ? new Date().toISOString().split("T")[0]
  //               : "2024-07-25",
  //         },
  //         keys: {
  //           active: instrumentName === "keys",
  //           capo: null,
  //           tuning: null,
  //           lastPlay: null,
  //         },
  //         drums: {
  //           active: instrumentName === "drums",
  //           capo: null,
  //           tuning: null,
  //           lastPlay: null,
  //         },
  //         voice: {
  //           active: instrumentName === "voice",
  //           capo: null,
  //           tuning: null,
  //           lastPlay: null,
  //         },
  //         embedVideos: embedLink,
  //         addedIn: "2024-08-16", // Defina a data de adição inicial
  //         updateIn: new Date().toISOString().split("T")[0], // Define a data atual para a última atualização
  //         email: userEmail,
  //       };

  //       console.log("userdata", userdata); // Verifique os dados antes de enviar

  //       const response = await axios.post(
  //         `https://www.api.live.eloygomes.com.br/api/newsong`, // Certifique-se de que a URL está correta
  //         {
  //           databaseComing: "liveNloud_",
  //           collectionComing: "data",
  //           userdata: userdata,
  //         }
  //       );

  //       console.log("Data saved successfully:", response.data);
  //     } catch (error) {
  //       console.error("Error saving data:", error);
  //     }
  //     // navigate("/");
  //   }
  // };

  const createNewSong = async ({ instrumentName, progress }) => {
    const userEmail = localStorage.getItem("userEmail");

    console.log("songName", songName);
    console.log("artistName", artistName);
    console.log("instrumentName", instrumentName);
    console.log("progress", progress);
    console.log("geralPercentage", geralPercentage);

    if (songName !== "Loading..." && artistName !== "Loading...") {
      try {
        const userdata = {
          song: songName,
          artist: artistName,
          progressBar: geralPercentage ? geralPercentage : 0, // Certifique-se de que progressBar está definido
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
            capo: instrumentName === "guitar01" ? capoData : null,
            tuning: instrumentName === "guitar01" ? tunerData : null,
            lastPlay:
              instrumentName === "guitar01"
                ? new Date().toISOString().split("T")[0]
                : null,
          },
          guitar02: {
            active: instrumentName === "guitar02",
            capo: instrumentName === "guitar02" ? capoData : null,
            tuning: instrumentName === "guitar02" ? tunerData : null,
            lastPlay:
              instrumentName === "guitar02"
                ? new Date().toISOString().split("T")[0]
                : null,
          },
          bass: {
            active: instrumentName === "bass",
            capo: instrumentName === "bass" ? capoData : "None",
            tuning: instrumentName === "bass" ? tunerData : "Standard",
            lastPlay:
              instrumentName === "bass"
                ? new Date().toISOString().split("T")[0]
                : "2024-07-25",
          },
          keys: {
            active: instrumentName === "keys",
            capo: null,
            tuning: null,
            lastPlay: null,
          },
          drums: {
            active: instrumentName === "drums",
            capo: null,
            tuning: null,
            lastPlay: null,
          },
          voice: {
            active: instrumentName === "voice",
            capo: null,
            tuning: null,
            lastPlay: null,
          },
          embedVideos: embedLink || [],
          addedIn: "2024-08-16", // Defina a data de adição inicial
          updateIn: new Date().toISOString().split("T")[0], // Define a data atual para a última atualização
          email: userEmail,
        };

        // Converte o objeto para uma string JSON
        const payload = JSON.stringify({
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: userdata,
        });

        console.log("Payload JSON:", payload); // Verifique os dados antes de enviar

        const response = await axios.post(
          `https://www.api.live.eloygomes.com.br/api/newsong`,
          payload, // Envia a string JSON como o corpo da requisição
          {
            headers: {
              "Content-Type": "application/json", // Certifique-se de definir o cabeçalho Content-Type
            },
          }
        );

        console.log("Data saved successfully:", response.data);
      } catch (error) {
        console.error("Error saving data:", error);
      }
      navigate("/");
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
        <button
          className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard"
          onClick={() => navigate("/")}
        >
          Discard
        </button>
      </div>
    </>
  );
}

export default NewSongColumnA;
