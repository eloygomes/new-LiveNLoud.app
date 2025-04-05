/* eslint-disable react/prop-types */
// /* eslint-disable react/prop-types */
// import { useEffect } from "react";
// import axios from "axios";

// function NewSongInputLinkBox({
//   instrumentName,
//   instrument,
//   setInstrument,
//   progress,
//   setProgress,
//   setArtistExtractedFromUrl,
//   setSongExtractedFromUrl,
//   gettingSongData,
//   setShowSnackBar,
//   setSnackbarMessage,
//   // dataFromUrl,
// }) {
//   function extractArtistAndSong(url) {
//     if (!url) {
//       throw new Error("URL is undefined or empty");
//     }

//     const parts = url.split("/").filter(Boolean); // Filtra partes vazias
//     const artist = parts[parts.length - 2]; // Penúltima parte
//     const song = parts[parts.length - 1]; // Última parte

//     if (!artist || !song) {
//       setShowSnackBar(true);
//       setSnackbarMessage({
//         title: "Error",
//         message: "Could not extract artist and song from the URL",
//       });
//       throw new Error("Could not extract artist and song from the URL");
//     }

//     const artistFromUrl = artist;
//     const songFromUrl = song;

//     return { artistFromUrl, songFromUrl };
//   }

//   const handledata = async () => {
//     if (!instrument || typeof instrument !== "string" || !instrument.trim()) {
//       // setShowSnackBar(true);
//       setSnackbarMessage({
//         title: "Error",
//         message: "Please insert a valid URL before proceeding.",
//       });
//       return;
//     }

//     const userEmail = localStorage.getItem("userEmail");
//     if (!userEmail) {
//       setShowSnackBar(true);
//       setSnackbarMessage({
//         title: "Error",
//         message: "User email is required to register the song.",
//       });
//       return;
//     }

//     const checkIfCifraExists = async (artist, song, inst) => {
//       // Verificar se a cifra existe
//       await axios.post("https://api.live.eloygomes.com.br/api/generalCifra", {
//         artist: artist,
//         song: song,
//         instrument: inst,
//       });

//       // Se vier 200, significa que temos a cifra
//       // Se vier 404, significa que não temos
//     };

//     const { artistFromUrl, songFromUrl } = extractArtistAndSong(instrument);
//     setArtistExtractedFromUrl(artistFromUrl);
//     setSongExtractedFromUrl(songFromUrl);

//     const existOrNot = checkIfCifraExists(
//       artistFromUrl,
//       songFromUrl,
//       instrumentName
//     );
//     console.log("existOrNot", existOrNot);

//     if (!existOrNot) {
//       try {
//         // ENVIANDO OS DADOS REGISTRANDO A MÚSICA (POST)
//         // await axios.post("https://www.api.live.eloygomes.com.br/api/scrape", {
//         await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
//           artist: artistFromUrl,
//           song: songFromUrl,
//           email: userEmail,
//           instrument: `${instrumentName}`,
//           instrument_progressbar: `${progress}`,
//           link: instrument,
//         });

//         // Após o POST, realiza o GET para atualizar os dados
//         await gettingSongData();
//       } catch (error) {
//         console.error(
//           "Error registering user in API:",
//           error.response ? error.response.data : error.message
//         );
//         setShowSnackBar(true);
//         setSnackbarMessage({
//           title: "Error",
//           message: error.response
//             ? error.response.data.message ||
//               "An error occurred while processing your request."
//             : "An error occurred while processing your request.",
//         });
//       }
//     }

//     try {
//       // ENVIANDO OS DADOS REGISTRANDO A MÚSICA (POST)
//       // await axios.post("https://www.api.live.eloygomes.com.br/api/scrape", {
//       await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
//         artist: artistFromUrl,
//         song: songFromUrl,
//         email: userEmail,
//         instrument: `${instrumentName}`,
//         instrument_progressbar: `${progress}`,
//         link: instrument,
//       });

//       // Após o POST, realiza o GET para atualizar os dados
//       await gettingSongData();
//     } catch (error) {
//       console.error(
//         "Error registering user in API:",
//         error.response ? error.response.data : error.message
//       );
//       setShowSnackBar(true);
//       setSnackbarMessage({
//         title: "Error",
//         message: error.response
//           ? error.response.data.message ||
//             "An error occurred while processing your request."
//           : "An error occurred while processing your request.",
//       });
//     }
//   };

//   useEffect(() => {
//     handledata().catch((error) => console.error(error));
//   }, [instrument, progress]);

//   return (
//     <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
//       <div className="flex flex-row justify-between">
//         <span className="text-sm pb-2 font-bold">
//           {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
//         </span>
//         <div className="flex flex-row">
//           <span
//             className={`${
//               instrument ? "text-green-500" : "text-red-500"
//             } text-sm rounded-sm`}
//           >
//             {instrument ? "Online" : "Offline"}
//           </span>
//         </div>
//       </div>
//       <div className="flex flex-row h-6">
//         <input
//           type="text"
//           placeholder="Insert your link here"
//           className="w-full p-1 border border-gray-300 rounded-sm text-sm"
//           value={instrument}
//           onChange={(e) => setInstrument(e.target.value)}
//           onBlur={() => {
//             handledata();
//             // console.log(`instrumentName: ${instrumentName}`);
//             // console.log(`instrument:${instrument}`);
//             // console.log(progress);
//           }}
//         />
//       </div>
//       <div className="flex flex-row">
//         <div className="flex flex-row items-center mt-1 w-1/2">
//           <input
//             type="range"
//             min="0"
//             max="100"
//             value={progress}
//             onChange={(e) => setProgress(Number(parseInt(e.target.value, 10)))}
//             className="w-1/2"
//           />
//         </div>
//         <div className="relative flex flex-row pt-1  w-1/2">
//           <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
//             <div
//               style={{ width: `${progress}%` }}
//               className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
//             ></div>
//           </div>
//           <div className="w-1/3 pl-4 py-3 ml-5 text-right">
//             <span className=" text-sm ml-auto">{progress}%</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default NewSongInputLinkBox;

// Observação: se precisar que a música seja atualizada mesmo existindo no banco,
// você pode ajustar a lógica abaixo. Mas aqui vamos seguir a ideia de só criar
// via /scrape se ela não existir no banco.

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
  // setDataFromUrl,
}) {
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

  // Função auxiliar para checar se a cifra já existe (retorna true ou false).
  const checkIfCifraExists = async (artist, song, inst) => {
    console.log("artist", artist);
    console.log("song", song);
    console.log("inst", inst);
    console.log("dataFromUrl", dataFromUrl);

    try {
      const response = await axios.post(
        "https://api.live.eloygomes.com.br/api/generalCifra",
        {
          // artist: "O Rappa",
          // song: "Anjos",
          // instrument: "guitar01",
          artist,
          song,
          instrument: inst,
        }
      );
      // Se deu 200, significa que a cifra existe
      if (response.status === 200) {
        return true;
      }
      // Caso não seja 200 nem caia no catch,
      // é um caso “indefinido”; retornamos false por segurança
      return false;
    } catch (error) {
      // Se for 404, significa que não existe
      if (error.response && error.response.status === 404) {
        return false;
      }
      // Se for outro erro, jogamos para quem chamar a função tratar
      throw error;
    }
  };

  const handledata = async () => {
    // 1. Validações locais
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

    // 2. Extrair artista e música da URL
    let artistFromUrl, songFromUrl;
    try {
      const result = extractArtistAndSong(instrument);
      artistFromUrl = result.artistFromUrl;
      songFromUrl = result.songFromUrl;
      setArtistExtractedFromUrl(artistFromUrl);
      setSongExtractedFromUrl(songFromUrl);
    } catch (error) {
      // Se cair no erro do extract, já para por aqui
      console.error(error);
      return;
    }

    // 3. Verificar se existe no banco antes de criar
    let cifraExiste;
    try {
      cifraExiste = await checkIfCifraExists(
        artistFromUrl,
        songFromUrl,
        instrumentName
      );
    } catch (error) {
      console.error("Erro ao verificar se cifra existe:", error);
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message:
          "An error occurred while checking if the song already exists. Try again later.",
      });
      return;
    }

    // 4. Se não existir, chamamos a rota /scrape
    if (!cifraExiste) {
      try {
        await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
          artist: artistFromUrl,
          song: songFromUrl,
          email: userEmail,
          instrument: instrumentName,
          instrument_progressbar: progress,
          link: instrument,
        });
        // Atualiza os dados no front após criar
        await gettingSongData();
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
    } else {
      // Se a cifra já existe, você pode querer atualizar ou só notificar o usuário
      console.log("A música já existe no banco. Pulando criação via /scrape.");
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Info",
        message: "This song already exists in your library.",
      });
    }
  };

  // Dispara handledata quando "instrument" ou "progress" mudarem
  useEffect(() => {
    handledata().catch((error) => console.error(error));
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
