// /* eslint-disable no-unused-vars */
// /* eslint-disable react/prop-types */
// import { useEffect, useState } from "react";
// import axios from "axios";

// function NewSongInputLinkBox({
//   instrumentName,
//   instrument,
//   setInstrument,
//   progress,
//   setProgress,

//   // Recebendo do pai, caso já tenhamos
//   artistName,
//   setArtistName,
//   songName,
//   setSongName,

//   gettingSongData,
//   setShowSnackBar,
//   setSnackbarMessage,

//   // Caso ainda precise extrair do link. Se for false, ignora extração
//   useLinkExtraction = false,

//   setSongScrapado,
//   setArtistScrapado,
//   cifraExiste,
//   setCifraExiste,

//   cifraFROMDB,
//   setCifraFROMDB,
// }) {
//   // Guardamos o doc encontrado, se houver
//   const [foundDocument, setFoundDocument] = useState(null);

//   // Apenas se quisermos extrair de URL
//   function extractArtistAndSong(url) {
//     if (!url) {
//       throw new Error("URL is undefined or empty");
//     }
//     const parts = url.split("/").filter(Boolean);
//     const artist = parts[parts.length - 2];
//     const song = parts[parts.length - 1];

//     // console.log("Extracted artist:", artist);
//     // console.log("Extracted song:", song);

//     if (!artist || !song) {
//       setShowSnackBar(true);
//       setSnackbarMessage({
//         title: "Error",
//         message: "Could not extract artist and song from the URL",
//       });
//       throw new Error("Could not extract artist and song from the URL");
//     }
//     return { artistFromUrl: artist, songFromUrl: song };
//   }

//   // checkIfCifraExists retorna { exists: boolean, document: objetoOuNull }
//   const checkIfCifraExists = async (inst, userLink) => {
//     try {
//       const response = await axios.post(
//         "https://api.live.eloygomes.com.br/api/generalCifra",
//         {
//           instrument: inst, // ex. 'guitar01'
//           link: userLink, // ex. 'https://cifraclub...'
//         }
//       );
//       // Se 200, existe:
//       return {
//         exists: true,
//         document: response.data,
//       };
//     } catch (error) {
//       if (error.response && error.response.status === 404) {
//         return { exists: false, document: null };
//       }
//       throw error; // outro erro
//     }
//   };

//   const handledata = async () => {
//     // Limpa valores anteriores para não carregar música antiga enquanto espera o scrape

//     // 1) Validar link
//     if (!instrument || typeof instrument !== "string" || !instrument.trim()) {
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

//     // 2) Se não tivermos artistName e songName, e quisermos extrair do link:
//     let finalArtist = artistName;
//     let finalSong = songName;

//     if (useLinkExtraction && (!artistName || !songName)) {
//       try {
//         const { artistFromUrl, songFromUrl } = extractArtistAndSong(instrument);
//         // Aqui você poderia normalizar p/ o formato do banco
//         finalArtist = artistFromUrl;
//         finalSong = songFromUrl;

//         console.log("Extracted from URL:", {
//           artist: finalArtist,
//           song: finalSong,
//         });
//       } catch (err) {
//         console.error(err);
//         return;
//       }
//     }

//     // 3) Verificar se existe no banco
//     let cifraExiste;
//     try {
//       // instrumentName = 'guitar01'
//       // instrument = 'https://www.cifraclub.com.br/...'
//       // console.log("instrumentName:", instrumentName);
//       // console.log("instrument:", instrument);
//       cifraExiste = await checkIfCifraExists(instrumentName, instrument);
//     } catch (error) {
//       console.error("Erro ao verificar se cifra existe:", error);
//       // Exibir snackbar etc.
//       return;
//     }

//     if (cifraExiste.exists) {
//       // Document existe
//       // console.log("Song found in DB, doc:", cifraExiste.document);

//       localStorage.setItem("cifraFROMDB", JSON.stringify(cifraExiste.document));
//       localStorage.setItem("fromWHERE", "DB");

//       return;
//     }

//     // 4) Se já existe, usa os dados do doc
//     if (cifraExiste.exists && cifraExiste.document) {
//       setFoundDocument(cifraExiste.document);

//       // Opcional: atualizar os states locais
//       if (cifraExiste.document.song) {
//         setSongName(cifraExiste.document.song);
//       }
//       if (cifraExiste.document.artist) {
//         setArtistName(cifraExiste.document.artist);
//       }

//       // console.log("Song found in DB, doc:", cifraExiste.document);

//       setShowSnackBar(true);
//       setSnackbarMessage({
//         title: "Info",
//         message: "This song already exists in your library.",
//       });
//       // Se quiser pular o scrape: return
//       return;
//     }

//     // 5) Se não existe, chamamos /scrape
//     try {
//       // Para garantir que os valores estejam atualizados e válidos, use uma função async separada para os consoles.log:
//       await (async () => {
//         console.log("finalArtist", finalArtist);
//         console.log("finalSong", finalSong);
//         console.log("userEmail", userEmail);
//       })();

//       // GPT, porque esses consoles.log acima somente o userEmail é valido(os outros retornam underfined), mas no axios aqui em baixo o finalArtist e finalSong são válidos?

//       await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
//         artist: finalArtist,
//         song: finalSong,
//         email: userEmail,
//         instrument: instrumentName,
//         instrument_progressbar: progress,
//         link: instrument,
//       });
//       // Se deu tudo certo, atualiza
//       await gettingSongData();
//       localStorage.setItem("fromWHERE", "URL");

//       console.log("Song created successfully via /scrape");
//     } catch (error) {
//       console.error("Error registering user in API:", error);
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

//   // Sempre que trocar instrument ou progress, chamamos handledata
//   useEffect(() => {
//     handledata().catch((error) => console.error(error));
//     // eslint-disable-next-line
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
//             onChange={(e) => setProgress(Number.parseInt(e.target.value, 10))}
//             className="w-1/2"
//           />
//         </div>
//         <div className="relative flex flex-row pt-1 w-1/2">
//           <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
//             <div
//               style={{ width: `${progress}%` }}
//               className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
//             ></div>
//           </div>
//           <div className="w-1/3 pl-4 py-3 ml-5 text-right">
//             <span className="text-sm ml-auto">{progress}%</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default NewSongInputLinkBox;

/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useCallback } from "react";
import axios from "axios";

/**
 * NewSongInputLinkBox
 * ----------------------------------------------------------------------------
 * Props:
 * - instrumentName, instrument, setInstrument
 * - progress, setProgress
 * - artistName, setArtistName
 * - songName, setSongName
 * - gettingSongData
 * - setShowSnackBar, setSnackbarMessage
 * - useLinkExtraction
 * - setSongScrapado, setArtistScrapado
 * - cifraExiste, setCifraExiste
 * - cifraFROMDB, setCifraFROMDB
 *
 * Fluxo:
 * 1) O usuário digita/ajusta e, ao sair do input ou mover o slider,
 *    chama handleSubmit().
 * 2) Validamos URL e email.
 * 3) Extraímos artista/música (se configurado).
 * 4) Checamos existência via /generalCifra.
 * 5) Se não existir, chamamos /scrape e atualizamos os dados do pai.
 */

function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  progress,
  setProgress,

  artistName,
  setArtistName,
  songName,
  setSongName,

  gettingSongData,
  setShowSnackBar,
  setSnackbarMessage,

  useLinkExtraction = false,

  setSongScrapado,
  setArtistScrapado,
  cifraExiste,
  setCifraExiste,

  cifraFROMDB,
  setCifraFROMDB,
}) {
  // __ handleSubmit: principal lógica de validação, extração, check e scrape
  const handleSubmit = useCallback(async () => {
    // 1) Validações básicas
    if (!instrument?.trim()) {
      setSnackbarMessage({ title: "Error", message: "Insira uma URL válida." });
      return;
    }
    const email = localStorage.getItem("userEmail");

    if (!email) {
      setShowSnackBar(true);
      setSnackbarMessage({
        title: "Error",
        message: "Email do usuário é obrigatório.",
      });
      return;
    }

    // 2) Extrair artista/música do link, se necessário
    let finalArtist = artistName;
    let finalSong = songName;
    if (useLinkExtraction && (!artistName || !songName)) {
      const parts = instrument.split("/").filter(Boolean);
      console.log("Parts extracted from URL:", parts);
      if (parts.length < 2) {
        setSnackbarMessage({
          title: "Error",
          message: "URL incompleta para extração.",
        });
        return;
      }
      finalArtist = parts.at(-2);
      finalSong = parts.at(-1);
      if (!finalArtist || !finalSong) {
        setSnackbarMessage({
          title: "Error",
          message: "Falha ao extrair artista e música.",
        });
        return;
      }
      setArtistName(finalArtist);
      setSongName(finalSong);
      // opcional: notificar pai
      setArtistScrapado?.(finalArtist);
      setSongScrapado?.(finalSong);
    }

    // 3) Checar se já existe no banco
    try {
      const res = await axios.post(
        "https://api.live.eloygomes.com.br/api/generalCifra",
        { instrument: instrumentName, link: instrument }
      );
      // se 200 → existe
      setCifraExiste?.(true);
      setCifraFROMDB?.(res.data);
      localStorage.setItem("cifraFROMDB", JSON.stringify(res.data));
      localStorage.setItem("fromWHERE", "DB");
      setSnackbarMessage({
        title: "Info",
        message: "Essa cifra já está na sua biblioteca.",
      });
      return;
    } catch (err) {
      // 404 = não existe; outros → erro
      if (!(err.response && err.response.status === 404)) {
        console.error("[generalCifra]", err);
        setSnackbarMessage({
          title: "Error",
          message: "Erro ao verificar cifra no servidor.",
        });
        return;
      }
    }

    // 4) Se não existe, pedir scrape
    try {
      await axios.post("https://api.live.eloygomes.com.br/api/scrape", {
        artist: finalArtist,
        song: finalSong,
        email,
        instrument: instrumentName,
        instrument_progressbar: progress,
        link: instrument,
      });
      await gettingSongData();
      localStorage.setItem("fromWHERE", "URL");
      setCifraExiste?.(false);
      setSnackbarMessage({
        title: "Success",
        message: "Cifra adicionada com sucesso!",
      });
    } catch (err) {
      console.error("[scrape]", err);
      setSnackbarMessage({
        title: "Error",
        message:
          err.response?.data?.message ||
          "Ocorreu um erro ao processar a requisição.",
      });
    }
  }, [
    instrument,
    instrumentName,
    artistName,
    songName,
    useLinkExtraction,
    progress,
    gettingSongData,
    setArtistName,
    setSongName,
    setShowSnackBar,
    setSnackbarMessage,
    setArtistScrapado,
    setSongScrapado,
    setCifraExiste,
    setCifraFROMDB,
  ]);

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      {/* Header */}
      <div className="flex justify-between">
        <span className="text-sm font-bold">
          {instrumentName[0].toUpperCase() + instrumentName.slice(1)}
        </span>
        <span
          className={`text-sm ${
            instrument ? "text-green-500" : "text-red-500"
          }`}
        >
          {instrument ? "Online" : "Offline"}
        </span>
      </div>

      {/* Link input */}
      <input
        type="text"
        placeholder="Insert your link here"
        className="w-full p-1 border border-gray-300 rounded-sm text-sm h-6 mt-2"
        value={instrument}
        onChange={(e) => setInstrument(e.target.value)}
        onBlur={handleSubmit}
      />

      {/* Slider progress */}
      <div className="flex items-center mt-3">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
            setProgress(Number(e.target.value));
            handleSubmit();
          }}
          className="flex-1"
        />
        <div className="w-14 text-right text-sm">{progress}%</div>
      </div>
    </div>
  );
}

export default NewSongInputLinkBox;
