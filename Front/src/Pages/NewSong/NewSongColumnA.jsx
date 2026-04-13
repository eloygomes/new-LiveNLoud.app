// /* eslint-disable no-unused-vars */
// /* eslint-disable react/prop-types */
// import { useEffect, useState, useRef } from "react";
// import NewSongEmbed from "./NewSongEmbed";
// import GeralProgressBar from "./GeralProgressBar";
// import NewSongSongData from "./NewSongSongData";
// import { useNavigate } from "react-router-dom";
// import NewSongSetlist from "./NewSongSetlist";
// import {
//   deleteOneSong,
//   getAllUserSetlists,
//   createNewSongOnServer,
// } from "../../Tools/Controllers";

// function NewSongColumnA({
//   dataFromUrl,
//   artistExtractedFromUrl,
//   songExtractedFromUrl,
//   guitar01,
//   guitar02,
//   bass,
//   keyboard,
//   drums,
//   voice,
//   progBarG01,
//   progBarG02,
//   progBarBass,
//   progBarKey,
//   progBarDrums,
//   progBarVoice,
//   songScrapado,
//   artistScrapado,
//   cifraExiste,
//   setShowSnackBar,
//   setSnackbarMessage,
// }) {
//   const [songName, setSongName] = useState(null);
//   const [artistName, setArtistName] = useState(null);
//   const [capoData, setCapoData] = useState(null);
//   const [tomData, setTomData] = useState(null);
//   const [tunerData, setTunerData] = useState(null);
//   const [addedInDATE, setAddedInDATE] = useState(
//     new Date().toISOString().split("T")[0]
//   );

//   const [isLoadingData, setIsLoadingData] = useState(true);

//   const [geralPercentage, setGeralPercentage] = useState(0);
//   const [embedLink, setEmbedLink] = useState([]);
//   const [instrumentName, setInstrumentName] = useState("");
//   const [instrument, setInstrument] = useState(null);

//   const [songCifra, setSongCifra] = useState(null);
//   const [instrActiveStatus, setInstrActiveStatus] = useState(null);
//   const [instCapo, setInstCapo] = useState(null);
//   const [instTuning, setInstTuning] = useState(null);
//   const [instLastPlayed, setInstLastPlayed] = useState(null);
//   const [instLink, setInstLink] = useState(null);
//   const [instProgressBar, setInstProgressBar] = useState(null);

//   // 1) setListOptions = todas as opções carregadas do backend
//   const [setListOptions, setSetListOptions] = useState([]);
//   // 2) setlist = o array que realmente será usado/associado à nova música
//   const [setlist, setSetlist] = useState([]);

//   const navigate = useNavigate();
//   const hasSaved = useRef(false);
//   const addedSongName = useRef(null);

//   useEffect(() => {
//     // 1) Limpa estados antigos
//     // setSongName("");
//     // setArtistName("");
//     setCapoData(null);
//     setTomData(null);
//     setTunerData(null);
//     // 2) Inicia loading
//     setIsLoadingData(true);

//     // Define instrumentName/instrument conforme prop
//     if (guitar01) {
//       setInstrumentName("guitar01");
//       setInstrument(guitar01);
//     } else if (guitar02) {
//       setInstrumentName("guitar02");
//       setInstrument(guitar02);
//     } else if (bass) {
//       setInstrumentName("bass");
//       setInstrument(bass);
//     } else if (keyboard) {
//       setInstrumentName("keys");
//       setInstrument(keyboard);
//     } else if (drums) {
//       setInstrumentName("drums");
//       setInstrument(drums);
//     } else if (voice) {
//       setInstrumentName("voice");
//       setInstrument(voice);
//     } else {
//       setIsLoadingData(false);
//       return;
//     }

//     // --- parsing seguro de JSON ---
//     const rawDb = localStorage.getItem("cifraFROMDB");
//     const rawUrl = dataFromUrl;
//     const fromWHERE = localStorage.getItem("fromWHERE");

//     const localArtist = localStorage.getItem("artist");
//     const localSong = localStorage.getItem("song");

//     setArtistName(localArtist || "");
//     setSongName(localSong || "");

//     let actualSongData = null;

//     if (fromWHERE === "DB" && rawDb) {
//       try {
//         actualSongData = JSON.parse(rawDb);
//       } catch (err) {
//         console.warn("Failed to parse cifraFROMDB:", err);
//       }
//     } else if (fromWHERE === "URL" && rawUrl && rawUrl.trim()) {
//       try {
//         const arr = JSON.parse(rawUrl);
//         if (Array.isArray(arr) && arr.length > 0) {
//           actualSongData = arr[arr.length - 1];
//         }
//       } catch (err) {
//         console.warn("Failed to parse dataFromUrl:", err);
//       }
//     }

//     // Carrega as opções de setlist
//     (async () => {
//       try {
//         const lists = await getAllUserSetlists();
//         setSetListOptions(lists);
//       } catch (err) {
//         console.error("Erro ao buscar setlists:", err);
//       }
//     })();

//     const handlePercentage = () => {
//       const total =
//         (progBarG01 || 0) +
//         (progBarG02 || 0) +
//         (progBarBass || 0) +
//         (progBarKey || 0) +
//         (progBarDrums || 0) +
//         (progBarVoice || 0);
//       setGeralPercentage(parseInt(total / 6));
//     };

//     // Se parse deu certo, preenche estados
//     if (actualSongData) {
//       setArtistName(actualSongData.artist || "");
//       setSongName(actualSongData.song || "");
//       setCapoData(actualSongData.capo);
//       setTomData(actualSongData.tom);
//       setTunerData(actualSongData.tuning);
//       setAddedInDATE(actualSongData.addedIn);
//       handlePercentage();
//       setEmbedLink(actualSongData.embed || []);

//       if (instrumentName === "guitar01" && actualSongData.guitar01?.active) {
//         setSongCifra(actualSongData.guitar01.songCifra);
//         setInstrActiveStatus(true);
//         setInstCapo(actualSongData.guitar01.capo);
//         setInstTuning(actualSongData.guitar01.tuning);
//         setInstLastPlayed(actualSongData.guitar01.lastPlay);
//         setInstLink(actualSongData.guitar01.link);
//         setInstProgressBar(actualSongData.guitar01.progress);
//         handlePercentage();
//       }

//       if (instrumentName === "guitar02" && actualSongData.guitar02?.active) {
//         setSongCifra(actualSongData.guitar02.songCifra);
//         setInstrActiveStatus(true);
//         setInstCapo(actualSongData.guitar02.capo);
//         setInstTuning(actualSongData.guitar02.tuning);
//         setInstLastPlayed(actualSongData.guitar02.lastPlay);
//         setInstLink(actualSongData.guitar02.link);
//         setInstProgressBar(actualSongData.guitar02.progress);
//         handlePercentage();
//       }

//       if (instrumentName === "bass" && actualSongData.bass?.active) {
//         setSongCifra(actualSongData.bass.songCifra);
//         setInstrActiveStatus(true);
//         setInstCapo(actualSongData.bass.capo);
//         setInstTuning(actualSongData.bass.tuning);
//         setInstLastPlayed(actualSongData.bass.lastPlay);
//         setInstLink(actualSongData.bass.link);
//         setInstProgressBar(actualSongData.bass.progress);
//         handlePercentage();
//       }

//       if (instrumentName === "keys" && actualSongData.keys?.active) {
//         setSongCifra(actualSongData.keys.songCifra);
//         setInstrActiveStatus(true);
//         setInstCapo(actualSongData.keys.capo);
//         setInstTuning(actualSongData.keys.tuning);
//         setInstLastPlayed(actualSongData.keys.lastPlay);
//         setInstLink(actualSongData.keys.link);
//         setInstProgressBar(actualSongData.keys.progress);
//         handlePercentage();
//       }

//       if (instrumentName === "drums" && actualSongData.drums?.active) {
//         setSongCifra(actualSongData.drums.songCifra);
//         setInstrActiveStatus(true);
//         setInstCapo(actualSongData.drums.capo);
//         setInstTuning(actualSongData.drums.tuning);
//         setInstLastPlayed(actualSongData.drums.lastPlay);
//         setInstLink(actualSongData.drums.link);
//         setInstProgressBar(actualSongData.drums.progress);
//         handlePercentage();
//       }

//       if (instrumentName === "voice" && actualSongData.voice?.active) {
//         setSongCifra(actualSongData.voice.songCifra);
//         setInstrActiveStatus(true);
//         setInstCapo(actualSongData.voice.capo);
//         setInstTuning(actualSongData.voice.tuning);
//         setInstLastPlayed(actualSongData.voice.lastPlay);
//         setInstLink(actualSongData.voice.link);
//         setInstProgressBar(actualSongData.voice.progress);
//         handlePercentage();
//       }

//       addedSongName.current = actualSongData.song;
//     }

//     setIsLoadingData(false);
//   }, [
//     dataFromUrl,
//     artistExtractedFromUrl,
//     songExtractedFromUrl,
//     guitar01,
//     guitar02,
//     bass,
//     keyboard,
//     drums,
//     voice,
//     progBarG01,
//     progBarG02,
//     progBarBass,
//     progBarKey,
//     progBarDrums,
//     progBarVoice,
//     cifraExiste,
//   ]);

//   useEffect(() => {
//     if (artistExtractedFromUrl) setArtistName(artistExtractedFromUrl);
//     if (songExtractedFromUrl) setSongName(songExtractedFromUrl);
//   }, [artistExtractedFromUrl, songExtractedFromUrl]);

//   const createNewSong = async ({
//     instrumentName,
//     geralPercentage,
//     setlist,
//   }) => {
//     try {
//       await createNewSongOnServer({
//         songName,
//         artistName,
//         instrumentName,
//         geralPercentage,
//         setlist,
//         embedLink,
//         instrumentFields: {
//           active: instrActiveStatus,
//           capo: instCapo,
//           lastPlay: instLastPlayed,
//           link: instLink,
//           progress: instProgressBar,
//           songCifra,
//           tuning: instTuning,
//         },
//       });

//       hasSaved.current = true;
//       addedSongName.current = null;
//       setSongName("");
//       setArtistName("");
//       setGeralPercentage(0);
//       setSetlist([]);
//       navigate("/");
//     } catch (error) {
//       console.error("Error saving data:", error);
//     }
//   };

//   return (
//     <>
//       <NewSongSongData
//         songName={isLoadingData ? "Carregando..." : songName}
//         artistName={isLoadingData ? "Carregando..." : artistName}
//         capoData={capoData}
//         tomData={tomData}
//         tunerData={tunerData}
//         fistTime={addedInDATE}
//         lastTime={addedInDATE}
//       />
//       <GeralProgressBar geralPercentage={geralPercentage} />

//       <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

//       <NewSongSetlist
//         setlistOptions={setListOptions}
//         setSetlistOptions={setSetListOptions}
//         setlist={setlist}
//         setSetlist={setSetlist}
//       />

//       <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
//         <button
//           className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
//           onClick={() => {
//             createNewSong({ instrumentName, geralPercentage, setlist });
//             setShowSnackBar(true);
//             setSnackbarMessage({
//               title: "Success",
//               message: `Song "${songName}" by ${artistName} saved successfully!`,
//             });
//           }}
//         >
//           Save
//         </button>
//         <button
//           className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard"
//           onClick={() => {
//             deleteOneSong(artistName, songName);
//             hasSaved.current = true;
//             addedSongName.current = null;
//             navigate("/");
//           }}
//         >
//           Discard
//         </button>
//       </div>
//     </>
//   );
// }

// export default NewSongColumnA;

/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { FaChevronDown, FaChevronUp, FaListUl, FaTimes, FaVideo } from "react-icons/fa";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import NewSongSongData from "./NewSongSongData";
import { useNavigate } from "react-router-dom";
import NewSongSetlist from "./NewSongSetlist";
import {
  deleteOneSong,
  getAllUserSetlists,
  createNewSongOnServer,
} from "../../Tools/Controllers";

/* helper: transforma slug (pink-floyd) em "Pink Floyd" */
function slugToTitle(input = "") {
  const clean = decodeURIComponent(String(input).trim())
    .replace(/\/+$/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  return clean
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
  songScrapado,
  artistScrapado,
  cifraExiste,
  setShowSnackBar,
  setSnackbarMessage,
  scrapeStatus = {},
  touchLayout = false,
  songDataOpen = false,
  onToggleSongData,
  middleContent = null,
}) {
  const [songName, setSongName] = useState(null);
  const [artistName, setArtistName] = useState(null);
  const [capoData, setCapoData] = useState(null);
  const [tomData, setTomData] = useState(null);
  const [tunerData, setTunerData] = useState(null);
  const [addedInDATE, setAddedInDATE] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [isLoadingData, setIsLoadingData] = useState(true);

  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState([]);
  const [instrumentName, setInstrumentName] = useState("");
  const [instrument, setInstrument] = useState(null);

  const [songCifra, setSongCifra] = useState(null);
  const [instrActiveStatus, setInstrActiveStatus] = useState(null);
  const [instCapo, setInstCapo] = useState(null);
  const [instTuning, setInstTuning] = useState(null);
  const [instLastPlayed, setInstLastPlayed] = useState(null);
  const [instLink, setInstLink] = useState(null);
  const [instProgressBar, setInstProgressBar] = useState(null);

  // 1) setListOptions = todas as opções carregadas do backend
  const [setListOptions, setSetListOptions] = useState([]);
  // 2) setlist = o array que realmente será usado/associado à nova música
  const [setlist, setSetlist] = useState([]);

  const navigate = useNavigate();
  const hasSaved = useRef(false);
  const addedSongName = useRef(null);
  const [touchVideosOpen, setTouchVideosOpen] = useState(false);
  const [touchSetlistsOpen, setTouchSetlistsOpen] = useState(false);
  const hasInstrumentLinks = [
    guitar01,
    guitar02,
    bass,
    keyboard,
    drums,
    voice,
  ].some((link) => Boolean(link && link.trim()));
  const canSaveSong =
    Object.values(scrapeStatus || {}).some(Boolean) || hasInstrumentLinks;

  // Adicione este useEffect (fora do outro useEffect grandão)
  useEffect(() => {
    // garanta Number() pra impedir concatenação de strings
    const nums = [
      Number(progBarG01) || 0,
      Number(progBarG02) || 0,
      Number(progBarBass) || 0,
      Number(progBarKey) || 0,
      Number(progBarDrums) || 0,
      Number(progBarVoice) || 0,
    ];
    const total = nums.reduce((a, b) => a + b, 0);
    // arredonda como preferir (round, floor, etc.)
    setGeralPercentage(Math.round(total / 6));
  }, [
    progBarG01,
    progBarG02,
    progBarBass,
    progBarKey,
    progBarDrums,
    progBarVoice,
  ]);

  useEffect(() => {
    // console.log("progBarG01", progBarG01);
    // console.log("geralPercentage", geralPercentage);
    // 1) Limpa estados antigos
    // setSongName("");
    // setArtistName("");
    setCapoData(null);
    setTomData(null);
    setTunerData(null);
    // 2) Inicia loading
    setIsLoadingData(true);

    // Define instrumentName/instrument conforme prop
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
      setIsLoadingData(false);
      return;
    }

    // --- parsing seguro de JSON ---
    const rawDb = localStorage.getItem("cifraFROMDB");
    const rawUrl = dataFromUrl;
    const fromWHERE = localStorage.getItem("fromWHERE");

    const localArtist = localStorage.getItem("artist");
    const localSong = localStorage.getItem("song");

    // aplica formatação (tirar '-' e capitalizar)
    setArtistName(slugToTitle(localArtist || ""));
    setSongName(slugToTitle(localSong || ""));

    let actualSongData = null;

    if (fromWHERE === "DB" && rawDb) {
      try {
        actualSongData = JSON.parse(rawDb);
      } catch (err) {
        console.warn("Failed to parse cifraFROMDB:", err);
      }
    } else if (fromWHERE === "URL" && rawUrl && rawUrl.trim()) {
      try {
        const arr = JSON.parse(rawUrl);
        if (Array.isArray(arr) && arr.length > 0) {
          actualSongData = arr[arr.length - 1];
        }
      } catch (err) {
        console.warn("Failed to parse dataFromUrl:", err);
      }
    }

    // Carrega as opções de setlist
    (async () => {
      try {
        const lists = await getAllUserSetlists();
        setSetListOptions(lists);
      } catch (err) {
        console.error("Erro ao buscar setlists:", err);
      }
    })();

    const handlePercentage = () => {
      console.log("progBarG01", progBarG01);
      console.log("progBarG02", progBarG02);
      console.log("progBarBass", progBarBass);
      console.log("progBarKey", progBarKey);
      console.log("progBarDrums", progBarDrums);
      console.log("progBarVoice", progBarVoice);
      const total =
        (progBarG01 || 0) +
        (progBarG02 || 0) +
        (progBarBass || 0) +
        (progBarKey || 0) +
        (progBarDrums || 0) +
        (progBarVoice || 0);
      setGeralPercentage(parseInt(total / 6));
    };

    // Se parse deu certo, preenche estados
    if (actualSongData) {
      setArtistName(actualSongData.artist || "");
      setSongName(actualSongData.song || "");
      setCapoData(actualSongData.capo);
      setTomData(actualSongData.tom);
      setTunerData(actualSongData.tuning);
      setAddedInDATE(actualSongData.addedIn);
      handlePercentage();
      setEmbedLink(actualSongData.embed || []);

      if (instrumentName === "guitar01" && actualSongData.guitar01?.active) {
        setSongCifra(actualSongData.guitar01.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.guitar01.capo);
        setInstTuning(actualSongData.guitar01.tuning);
        setInstLastPlayed(actualSongData.guitar01.lastPlay);
        setInstLink(actualSongData.guitar01.link);
        setInstProgressBar(actualSongData.guitar01.progress);
        handlePercentage();
      }

      if (instrumentName === "guitar02" && actualSongData.guitar02?.active) {
        setSongCifra(actualSongData.guitar02.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.guitar02.capo);
        setInstTuning(actualSongData.guitar02.tuning);
        setInstLastPlayed(actualSongData.guitar02.lastPlay);
        setInstLink(actualSongData.guitar02.link);
        setInstProgressBar(actualSongData.guitar02.progress);
        handlePercentage();
      }

      if (instrumentName === "bass" && actualSongData.bass?.active) {
        setSongCifra(actualSongData.bass.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.bass.capo);
        setInstTuning(actualSongData.bass.tuning);
        setInstLastPlayed(actualSongData.bass.lastPlay);
        setInstLink(actualSongData.bass.link);
        setInstProgressBar(actualSongData.bass.progress);
        handlePercentage();
      }

      if (instrumentName === "keys" && actualSongData.keys?.active) {
        setSongCifra(actualSongData.keys.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.keys.capo);
        setInstTuning(actualSongData.keys.tuning);
        setInstLastPlayed(actualSongData.keys.lastPlay);
        setInstLink(actualSongData.keys.link);
        setInstProgressBar(actualSongData.keys.progress);
        handlePercentage();
      }

      if (instrumentName === "drums" && actualSongData.drums?.active) {
        setSongCifra(actualSongData.drums.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.drums.capo);
        setInstTuning(actualSongData.drums.tuning);
        setInstLastPlayed(actualSongData.drums.lastPlay);
        setInstLink(actualSongData.drums.link);
        setInstProgressBar(actualSongData.drums.progress);
        handlePercentage();
      }

      if (instrumentName === "voice" && actualSongData.voice?.active) {
        setSongCifra(actualSongData.voice.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.voice.capo);
        setInstTuning(actualSongData.voice.tuning);
        setInstLastPlayed(actualSongData.voice.lastPlay);
        setInstLink(actualSongData.voice.link);
        setInstProgressBar(actualSongData.voice.progress);
        handlePercentage();
      }

      addedSongName.current = actualSongData.song;
    }

    setIsLoadingData(false);
  }, [
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
    cifraExiste,
  ]);

  useEffect(() => {
    if (artistExtractedFromUrl)
      setArtistName(slugToTitle(artistExtractedFromUrl));
    if (songExtractedFromUrl) setSongName(slugToTitle(songExtractedFromUrl));
  }, [artistExtractedFromUrl, songExtractedFromUrl]);

  const createNewSong = async ({ geralPercentage, setlist }) => {
    try {
      const fallbackSongName = localStorage.getItem("song") || "";
      const fallbackArtistName = localStorage.getItem("artist") || "";
      const resolvedSongName = (songName || fallbackSongName || "").trim();
      const resolvedArtistName = (artistName || fallbackArtistName || "").trim();
      const savedSongName = resolvedSongName;
      const savedArtistName = resolvedArtistName;

      const instrumentsToSave = [
        { key: "guitar01", link: guitar01, progress: progBarG01 },
        { key: "guitar02", link: guitar02, progress: progBarG02 },
        { key: "bass", link: bass, progress: progBarBass },
        { key: "keys", link: keyboard, progress: progBarKey },
        { key: "drums", link: drums, progress: progBarDrums },
        { key: "voice", link: voice, progress: progBarVoice },
      ].filter((entry) => entry.link && entry.link.trim());

      if (!instrumentsToSave.length) {
        setShowSnackBar?.(true);
        setSnackbarMessage?.({
          title: "Error",
          message: "Adicione pelo menos um link antes de salvar.",
        });
        return;
      }

      if (!resolvedSongName || !resolvedArtistName) {
        setShowSnackBar?.(true);
        setSnackbarMessage?.({
          title: "Error",
          message: "Falha ao salvar a música. Tente novamente.",
        });
        return;
      }

      for (let index = 0; index < instrumentsToSave.length; index += 1) {
        const { key, link, progress } = instrumentsToSave[index];
        await createNewSongOnServer({
          songName: resolvedSongName,
          artistName: resolvedArtistName,
          instrumentName: key,
          geralPercentage,
          setlist,
          capo: capoData || "",
          tom: tomData || "",
          tuning: tunerData || "",
          embedLink,
          instrumentFields: {
            active: true,
            link: link.trim(),
            progress: progress ?? 0,
          },
        });
      }

      setShowSnackBar?.(true);
      setSnackbarMessage?.({
        title: "Success",
        message: `Song "${savedSongName}" by ${savedArtistName} saved successfully!`,
      });

      hasSaved.current = true;
      addedSongName.current = null;
      setSongName("");
      setArtistName("");
      setGeralPercentage(0);
      setSetlist([]);
      navigate("/");
    } catch (error) {
      console.error("Error saving data:", error);
      setShowSnackBar?.(true);
      setSnackbarMessage?.({
        title: "Error",
        message: "Falha ao salvar a música. Tente novamente.",
      });
    }
  };

  return (
    touchLayout ? (
      <>
        <div className="rounded-[20px] bg-[#e0e0e0] p-3 shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={onToggleSongData}
          >
            <h2 className="text-[1.55rem] font-black tracking-tight text-black">Song Data</h2>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f8f8] text-black">
              {songDataOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
            </span>
          </button>

          {songDataOpen ? (
            <div className="mt-3">
              <NewSongSongData
                songName={isLoadingData ? "Carregando..." : songName}
                artistName={isLoadingData ? "Carregando..." : artistName}
                capoData={capoData}
                tomData={tomData}
                tunerData={tunerData}
                fistTime={addedInDATE}
                lastTime={addedInDATE}
                touchLayout
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 [&_.neuphormism-b-btn-flat]:!m-0 [&_.neuphormism-b-btn-flat]:!rounded-[20px] [&_.neuphormism-b-btn-flat]:!border-0 [&_.neuphormism-b-btn-flat]:!bg-[#e0e0e0] [&_.neuphormism-b-btn-flat]:!px-3 [&_.neuphormism-b-btn-flat]:!py-3 [&_.neuphormism-b-btn-flat]:!shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
          <GeralProgressBar geralPercentage={geralPercentage} />
        </div>

        {middleContent}

        <div className="mt-4 rounded-[20px] bg-[#e0e0e0] p-3 shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
          <h2 className="text-[1.55rem] font-black tracking-tight text-black">Media & Setlist</h2>

          <div className="mt-3 space-y-3">
            <div className="rounded-[18px] bg-[#f8f8f8] p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setTouchVideosOpen((current) => !current)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ececec] text-black">
                    <FaVideo className="text-sm" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-black">Videos</div>
                    <div className="text-xs font-bold text-[#2f6f3e]">
                      {embedLink.length} videos added
                    </div>
                  </div>
                </div>
                {touchVideosOpen ? <FaChevronUp className="text-sm text-gray-500" /> : <FaChevronDown className="text-sm text-gray-500" />}
              </button>
            </div>

            <div className="rounded-[18px] bg-[#f8f8f8] p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setTouchSetlistsOpen((current) => !current)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ececec] text-black">
                    <FaListUl className="text-sm" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-black">Setlist</div>
                    <div className="text-xs font-bold text-[#2f6f3e]">
                      {setlist.length} setlists selected
                    </div>
                  </div>
                </div>
                {touchSetlistsOpen ? <FaChevronUp className="text-sm text-gray-500" /> : <FaChevronDown className="text-sm text-gray-500" />}
              </button>
            </div>
          </div>
        </div>

        {touchVideosOpen ? (
          <div className="fixed inset-0 z-[110] bg-black/25">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setTouchVideosOpen(false)}
              aria-label="Close videos modal"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-[2rem] font-black tracking-tight text-black">Videos</div>
                  <div className="mt-1 max-w-[18rem] text-sm font-medium text-gray-500">
                    Add a video URL for this song.
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                  onClick={() => setTouchVideosOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none [&_.neuphormism-b-btn]:!rounded-[14px] [&_.neuphormism-b-btn]:!bg-white [&_.neuphormism-b-btn]:!shadow-none">
                <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />
              </div>
            </div>
          </div>
        ) : null}

        {touchSetlistsOpen ? (
          <div className="fixed inset-0 z-[110] bg-black/25">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setTouchSetlistsOpen(false)}
              aria-label="Close setlist modal"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-[2rem] font-black tracking-tight text-black">Setlist</div>
                  <div className="mt-1 max-w-[18rem] text-sm font-medium text-gray-500">
                    Select existing tags or create a new one for this song.
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                  onClick={() => setTouchSetlistsOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none">
                <NewSongSetlist
                  setlistOptions={setListOptions}
                  setSetlistOptions={setSetListOptions}
                  setlist={setlist}
                  setSetlist={setSetlist}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            className="rounded-[16px] border border-[#f0b6ae] bg-[#fff4f2] px-4 py-3 text-lg font-black text-[#d13b2f]"
            onClick={() => {
              deleteOneSong(artistName, songName);
              hasSaved.current = true;
              addedSongName.current = null;
              navigate("/");
            }}
          >
            Discard
          </button>
          <button
            className="rounded-[16px] bg-[goldenrod] px-4 py-3 text-lg font-black text-black disabled:opacity-50"
            onClick={() => {
              createNewSong({ geralPercentage, setlist });
            }}
            disabled={!canSaveSong}
          >
            Save Song
          </button>
        </div>
      </>
    ) : (
      <>
      <NewSongSongData
        songName={isLoadingData ? "Carregando..." : songName}
        artistName={isLoadingData ? "Carregando..." : artistName}
        capoData={capoData}
        tomData={tomData}
        tunerData={tunerData}
        fistTime={addedInDATE}
        lastTime={addedInDATE}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />

      <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

      <NewSongSetlist
        setlistOptions={setListOptions}
        setSetlistOptions={setSetListOptions}
        setlist={setlist}
        setSetlist={setSetlist}
      />

      <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            createNewSong({ geralPercentage, setlist });
          }}
          disabled={!canSaveSong}
        >
          Save
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard"
          onClick={() => {
            deleteOneSong(artistName, songName);
            hasSaved.current = true;
            addedSongName.current = null;
            navigate("/");
          }}
        >
          Discard
        </button>
      </div>
      </>
    )
  );
}

export default NewSongColumnA;
