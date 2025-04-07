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

  // Buscar setlists existentes do backend ao montar o componente
  // useEffect(() => {
  //   async function fetchSetlists() {
  //     try {
  //       // Exemplo de GET. Ajuste para o seu endpoint real:
  //       const response = await axios.get(
  //         "https://api.seudominio.com.br/setlists"
  //       );
  //       // Supondo que venha algo como ["Setlist A", "Setlist B", ...]
  //       if (response.data) {
  //         // Armazena as opções no estado 'setListOptions'
  //         setSetListOptions(response.data);
  //       }
  //     } catch (error) {
  //       console.error("Erro ao buscar setlists:", error);
  //     }
  //   }

  //   fetchSetlists();
  // }, []);

  // Detectar qual instrumento foi passado (guitar01, guitar02 etc.)
  useEffect(() => {
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

    const cifraFROMDB = localStorage.getItem("cifraFROMDB") || "";
    const fromWHERE = localStorage.getItem("fromWHERE") || "";
    if (fromWHERE.length > 0 || cifraFROMDB.length > 0) {
      try {
        // console.log(typeof cifraFROMDB); // string
        // console.log(parsedData);
        // console.log("dataFromUrl", dataFromUrl);
        // console.log("papa", papa[papa.length - 1]);

        let actualSongData;

        if (fromWHERE === "DB") {
          const parsedData = JSON.parse(cifraFROMDB);
          actualSongData = parsedData; // works with cifraFROMDB, song from db
        }

        if (fromWHERE === "URL") {
          const papa = JSON.parse(dataFromUrl);
          actualSongData = papa[papa.length - 1]; // works with dataFromUrl, song scrapped
        }

        console.log("actualSongData", actualSongData.artist);

        setArtistName(actualSongData.artist);
        setSongName(actualSongData.song); // Immediately set the new song name
        setCapoData(actualSongData.capo);
        setTomData(actualSongData.tom);
        setTunerData(actualSongData.tuning);
        setAddedInDATE(actualSongData.addedIn);

        setGeralPercentage(actualSongData.progressBar);
        setEmbedLink(actualSongData.embed);

        if (actualSongData.guitar01.active) {
          setSongCifra(actualSongData.guitar01.songCifra);
          setInstrActiveStatus(true);
          setInstCapo(actualSongData.guitar01.capo);
          setInstTuning(actualSongData.guitar01.tuning);
          setInstLastPlayed(actualSongData.guitar01.lastPlay);
          setInstLink(actualSongData.guitar01.link);
          setInstProgressBar(actualSongData.guitar01.progress);
        }

        if (actualSongData.guitar02.active) {
          setSongCifra(actualSongData.guitar02.songCifra);
          setInstrActiveStatus(true);
          setInstCapo(actualSongData.guitar02.capo);
          setInstTuning(actualSongData.guitar02.tuning);
          setInstLastPlayed(actualSongData.guitar02.lastPlay);
          setInstLink(actualSongData.guitar02.link);
          setInstProgressBar(actualSongData.guitar02.progress);
        }

        if (actualSongData.bass.active) {
          setSongCifra(actualSongData.bass.songCifra);
          setInstrActiveStatus(true);
          setInstCapo(actualSongData.bass.capo);
          setInstTuning(actualSongData.bass.tuning);
          setInstLastPlayed(actualSongData.bass.lastPlay);
          setInstLink(actualSongData.bass.link);
          setInstProgressBar(actualSongData.bass.progress);
        }

        if (actualSongData.keys.active) {
          setSongCifra(actualSongData.keys.songCifra);
          setInstrActiveStatus(true);
          setInstCapo(actualSongData.keys.capo);
          setInstTuning(actualSongData.keys.tuning);
          setInstLastPlayed(actualSongData.keys.lastPlay);
          setInstLink(actualSongData.keys.link);
          setInstProgressBar(actualSongData.keys.progress);
        }

        if (actualSongData.drums.active) {
          setSongCifra(actualSongData.drums.songCifra);
          setInstrActiveStatus(true);
          setInstCapo(actualSongData.drums.capo);
          setInstTuning(actualSongData.drums.tuning);
          setInstLastPlayed(actualSongData.drums.lastPlay);
          setInstLink(actualSongData.drums.link);
          setInstProgressBar(actualSongData.drums.progress);
        }

        if (actualSongData.voice.active) {
          setSongCifra(actualSongData.voice.songCifra);
          setInstrActiveStatus(true);
          setInstCapo(actualSongData.voice.capo);
          setInstTuning(actualSongData.voice.tuning);
          setInstLastPlayed(actualSongData.voice.lastPlay);
          setInstLink(actualSongData.voice.link);
          setInstProgressBar(actualSongData.voice.progress);
        }

        // Track the added song
        addedSongName.current = actualSongData.song;
      } catch (error) {
        console.error("Error parsing dataFromUrl:", error);
      }
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
    cifraExiste,
  ]);

  const createNewSong = async ({
    instrumentName,
    geralPercentage,
    setlist,
  }) => {
    const userEmail = localStorage.getItem("userEmail");

    console.log("o valor atual de setlist é: ", setlist);

    if (songName && artistName) {
      try {
        const userdata = {
          song: songName,
          artist: artistName,
          progressBar: geralPercentage || 0,
          // Este array 'setlist' representa o que o usuário escolheu/adicionou
          setlist: setlist,
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
          guitar02: {
            active: `${instrumentName === "guitar02" ? instrActiveStatus : ""}`,
            capo: `${instrumentName === "guitar02" ? instCapo : ""}`,
            lastPlay: `${instrumentName === "guitar02" ? instLastPlayed : ""}`,
            link: `${instrumentName === "guitar02" ? instLink : ""}`,
            progress: `${instrumentName === "guitar02" ? instProgressBar : ""}`,
            songCifra: `${instrumentName === "guitar02" ? songCifra : ""}`,
            tuning: `${instrumentName === "guitar02" ? instTuning : ""}`,
          },
          bass: {
            active: `${instrumentName === "bass" ? instrActiveStatus : ""}`,
            capo: `${instrumentName === "bass" ? instCapo : ""}`,
            lastPlay: `${instrumentName === "bass" ? instLastPlayed : ""}`,
            link: `${instrumentName === "bass" ? instLink : ""}`,
            progress: `${instrumentName === "bass" ? instProgressBar : ""}`,
            songCifra: `${instrumentName === "bass" ? songCifra : ""}`,
            tuning: `${instrumentName === "bass" ? instTuning : ""}`,
          },
          keys: {
            active: `${instrumentName === "keys" ? instrActiveStatus : ""}`,
            capo: `${instrumentName === "keys" ? instCapo : ""}`,
            lastPlay: `${instrumentName === "keys" ? instLastPlayed : ""}`,
            link: `${instrumentName === "keys" ? instLink : ""}`,
            progress: `${instrumentName === "keys" ? instProgressBar : ""}`,
            songCifra: `${instrumentName === "keys" ? songCifra : ""}`,
            tuning: `${instrumentName === "keys" ? instTuning : ""}`,
          },
          drums: {
            active: `${instrumentName === "drums" ? instrActiveStatus : ""}`,
            capo: `${instrumentName === "drums" ? instCapo : ""}`,
            lastPlay: `${instrumentName === "drums" ? instLastPlayed : ""}`,
            link: `${instrumentName === "drums" ? instLink : ""}`,
            progress: `${instrumentName === "drums" ? instProgressBar : ""}`,
            songCifra: `${instrumentName === "drums" ? songCifra : ""}`,
            tuning: `${instrumentName === "drums" ? instTuning : ""}`,
          },
          voice: {
            active: `${instrumentName === "voice" ? instrActiveStatus : ""}`,
            capo: `${instrumentName === "voice" ? instCapo : ""}`,
            lastPlay: `${instrumentName === "voice" ? instLastPlayed : ""}`,
            link: `${instrumentName === "voice" ? instLink : ""}`,
            progress: `${instrumentName === "voice" ? instProgressBar : ""}`,
            songCifra: `${instrumentName === "voice" ? songCifra : ""}`,
            tuning: `${instrumentName === "voice" ? instTuning : ""}`,
          },
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
          userdata: userdata,
        });

        console.log("Enviando payload:", userdata);

        await axios.post(
          `https://api.live.eloygomes.com.br/api/newsong`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        hasSaved.current = true; // Mark as saved
        addedSongName.current = null; // Clear the added song name
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
        songName={songName}
        artistName={artistName}
        capoData={capoData}
        tomData={tomData}
        tunerData={tunerData}
        fistTime={addedInDATE}
        lastTime={addedInDATE}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />
      <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

      {/*
        Passamos:
          1) setListOptions = array com as opções do backend
          2) setlist = array que o usuário está montando para a nova música
      */}
      <NewSongSetlist
        setlistOptions={setListOptions}
        setSetlistOptions={setSetListOptions}
        setlist={setlist}
        setSetlist={setSetlist}
      />

      <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
          onClick={() => {
            createNewSong({
              instrumentName,
              instrument, // link
              geralPercentage,
              setlist,
            });
          }}
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
