/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import NewSongSongData from "./NewSongSongData";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { deleteOneSong } from "../../Tools/Controllers";
import NewSongSetlist from "./NewSongSetlist";

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
  const hasSaved = useRef(false); // Track if the song has been saved
  const addedSongName = useRef(null); // Track the song that was added

  // Detectar qual instrumento foi passado (guitar01, guitar02 etc.)
  useEffect(() => {
    // 1) Limpa estados antigos
    setSongName("");
    setArtistName("");
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

    // Se parse deu certo, preenche estados
    if (actualSongData) {
      setArtistName(actualSongData.artist || "");
      setSongName(actualSongData.song || "");
      setCapoData(actualSongData.capo);
      setTomData(actualSongData.tom);
      setTunerData(actualSongData.tuning);
      setAddedInDATE(actualSongData.addedIn);
      setGeralPercentage(actualSongData.progressBar);
      setEmbedLink(actualSongData.embed || []);

      // Exemplo para guitar01; repita lógica para outros instrumentos
      if (instrumentName === "guitar01" && actualSongData.guitar01?.active) {
        setSongCifra(actualSongData.guitar01.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.guitar01.capo);
        setInstTuning(actualSongData.guitar01.tuning);
        setInstLastPlayed(actualSongData.guitar01.lastPlay);
        setInstLink(actualSongData.guitar01.link);
        setInstProgressBar(actualSongData.guitar01.progress);
        setGeralPercentage(
          actualSongData.guitar01.progress || parseInt(progBarG01 / 6) || 0
        );
      }

      if (instrumentName === "guitar02" && actualSongData.guitar02?.active) {
        setSongCifra(actualSongData.guitar02.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.guitar02.capo);
        setInstTuning(actualSongData.guitar02.tuning);
        setInstLastPlayed(actualSongData.guitar02.lastPlay);
        setInstLink(actualSongData.guitar02.link);
        setInstProgressBar(actualSongData.guitar02.progress);
        setGeralPercentage(
          actualSongData.guitar02.progress || parseInt(progBarG02 / 6) || 0
        );
      }

      if (instrumentName === "bass" && actualSongData.bass?.active) {
        setSongCifra(actualSongData.bass.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.bass.capo);
        setInstTuning(actualSongData.bass.tuning);
        setInstLastPlayed(actualSongData.bass.lastPlay);
        setInstLink(actualSongData.bass.link);
        setInstProgressBar(actualSongData.bass.progress);
        setGeralPercentage(
          actualSongData.bass.progress || parseInt(progBarBass / 6) || 0
        );
      }

      if (instrumentName === "keys" && actualSongData.keys?.active) {
        setSongCifra(actualSongData.keys.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.keys.capo);
        setInstTuning(actualSongData.keys.tuning);
        setInstLastPlayed(actualSongData.keys.lastPlay);
        setInstLink(actualSongData.keys.link);
        setInstProgressBar(actualSongData.keys.progress);
        setGeralPercentage(
          actualSongData.keys.progress || parseInt(progBarKey / 6) || 0
        );
      }

      if (instrumentName === "drums" && actualSongData.drums?.active) {
        setSongCifra(actualSongData.drums.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.drums.capo);
        setInstTuning(actualSongData.drums.tuning);
        setInstLastPlayed(actualSongData.drums.lastPlay);
        setInstLink(actualSongData.drums.link);
        setInstProgressBar(actualSongData.drums.progress);
        setGeralPercentage(
          actualSongData.drums.progress || parseInt(progBarDrums / 6) || 0
        );
      }

      if (instrumentName === "voice" && actualSongData.voice?.active) {
        setSongCifra(actualSongData.voice.songCifra);
        setInstrActiveStatus(true);
        setInstCapo(actualSongData.voice.capo);
        setInstTuning(actualSongData.voice.tuning);
        setInstLastPlayed(actualSongData.voice.lastPlay);
        setInstLink(actualSongData.voice.link);
        setInstProgressBar(actualSongData.voice.progress);
        setGeralPercentage(
          actualSongData.voice.progress || parseInt(progBarVoice / 6) || 0
        );
      }

      addedSongName.current = actualSongData.song;
    }

    // Finaliza loading em todo caso
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

  // Sincroniza extração de link para estados
  useEffect(() => {
    if (artistExtractedFromUrl) setArtistName(artistExtractedFromUrl);
    if (songExtractedFromUrl) setSongName(songExtractedFromUrl);
  }, [artistExtractedFromUrl, songExtractedFromUrl]);

  const createNewSong = async ({
    instrumentName,
    geralPercentage,
    setlist,
  }) => {
    const userEmail = localStorage.getItem("userEmail");
    if (songName && artistName) {
      try {
        const userdata = {
          song: songName,
          artist: artistName,
          progressBar: geralPercentage || 0,
          setlist,
          instruments: {
            guitar01: instrumentName === "guitar01",
            guitar02: instrumentName === "guitar02",
            bass: instrumentName === "bass",
            keys: instrumentName === "keys",
            drums: instrumentName === "drums",
            voice: instrumentName === "voice",
          },
          guitar01: {
            active: `${instrumentName === "guitar01" ? instrActiveStatus : ""}`,
            capo: `${instrumentName === "guitar01" ? instCapo : ""}`,
            lastPlay: `${instrumentName === "guitar01" ? instLastPlayed : ""}`,
            link: `${instrumentName === "guitar01" ? instLink : ""}`,
            progress: `${instrumentName === "guitar01" ? instProgressBar : ""}`,
            songCifra: `${instrumentName === "guitar01" ? songCifra : ""}`,
            tuning: `${instrumentName === "guitar01" ? instTuning : ""}`,
          },
          // ... idem para guitar02, bass, keys, drums, voice
          embedVideos: embedLink || [],
          addedIn: new Date().toISOString().split("T")[0],
          updateIn: new Date().toISOString().split("T")[0],
          email: userEmail,
          username: "",
          fullName: "",
        };

        const payload = JSON.stringify({
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata,
        });

        await axios.post(
          `https://api.live.eloygomes.com.br/api/newsong`,
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        hasSaved.current = true;
        addedSongName.current = null;
        setSongName("");
        setArtistName("");
        setGeralPercentage(0);
        setSetlist([]);
        navigate("/");
      } catch (error) {
        console.error("Error saving data:", error);
      }
    }
  };

  return (
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
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
          onClick={() =>
            createNewSong({ instrumentName, geralPercentage, setlist })
          }
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
  );
}

export default NewSongColumnA;
