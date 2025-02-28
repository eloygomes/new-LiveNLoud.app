/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import EditSongEmbed from "./EditSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import EditSongSongData from "./EditSongSongData";
import { deleteOneSong, updateSongData } from "../../Tools/Controllers"; // Sua função que salva/atualiza no backend
import { useNavigate } from "react-router-dom";
import EditSongSetlist from "./EditSongSetlist";

function EditSongColumnA({
  dataFromAPI,
  progGuitar01,
  progGuitar02,
  progBass,
  progKey,
  progDrums,
  progVoice,
}) {
  // Dados principais da música
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [capoData, setCapoData] = useState("");
  const [tomData, setTomData] = useState("");
  const [tunerData, setTunerData] = useState("");
  const [geralPercentage, setGeralPercentage] = useState(0);
  // const [geralPercentageEdit, setGeralPercentageEdit] = useState("");
  const [embedLink, setEmbedLink] = useState([]);
  const [firstPlay, setFirstPlay] = useState("");
  const [lastPlay, setLastPlay] = useState("");

  // Array de setlists que esta música já possui (será enviado na atualização)
  const [setlist, setSetlist] = useState([]);
  // Array com TODAS as opções de setlists existentes (para exibir como "tags")
  const [setListOptions, setSetListOptions] = useState([]);

  // guitar01
  const [songCifraguitar01, setSongCifraguitar01] = useState(null);
  const [instrActiveStatusguitar01, setInstrActiveStatusguitar01] =
    useState(false);
  const [instCapoguitar01, setInstCapoguitar01] = useState("");
  const [instTuningguitar01, setInstTuningguitar01] = useState("");
  const [instLastPlayedguitar01, setInstLastPlayedguitar01] = useState("");
  const [instLinkguitar01, setInstLinkguitar01] = useState("");
  const [instProgressBarguitar01, setInstProgressBarguitar01] = useState(0);

  // guitar02
  const [songCifraguitar02, setSongCifraguitar02] = useState(null);
  const [instrActiveStatusguitar02, setInstrActiveStatusguitar02] =
    useState(false);
  const [instCapoguitar02, setInstCapoguitar02] = useState("");
  const [instTuningguitar02, setInstTuningguitar02] = useState("");
  const [instLastPlayedguitar02, setInstLastPlayedguitar02] = useState("");
  const [instLinkguitar02, setInstLinkguitar02] = useState("");
  const [instProgressBarguitar02, setInstProgressBarguitar02] = useState(0);

  // bass
  const [songCifrabass, setSongCifrabass] = useState(null);
  const [instrActiveStatusbass, setInstrActiveStatusbass] = useState(false);
  const [instCapobass, setInstCapobass] = useState("");
  const [instTuningbass, setInstTuningbass] = useState("");
  const [instLastPlayedbass, setInstLastPlayedbass] = useState("");
  const [instLinkbass, setInstLinkbass] = useState("");
  const [instProgressBarbass, setInstProgressBarbass] = useState(0);

  // keyboard
  const [songCifrakeyboard, setSongCifrakeyboard] = useState(null);
  const [instrActiveStatuskeyboard, setInstrActiveStatuskeyboard] =
    useState(false);
  const [instCapokeyboard, setInstCapokeyboard] = useState("");
  const [instTuningkeyboard, setInstTuningkeyboard] = useState("");
  const [instLastPlayedkeyboard, setInstLastPlayedkeyboard] = useState("");
  const [instLinkkeyboard, setInstLinkkeyboard] = useState("");
  const [instProgressBarkeyboard, setInstProgressBarkeyboard] = useState(0);

  // drums
  const [songCifradrums, setSongCifradrums] = useState(null);
  const [instrActiveStatusdrums, setInstrActiveStatusdrums] = useState(false);
  const [instCapodrums, setInstCapodrums] = useState("");
  const [instTuningdrums, setInstTuningdrums] = useState("");
  const [instLastPlayeddrums, setInstLastPlayeddrums] = useState("");
  const [instLinkdrums, setInstLinkdrums] = useState("");
  const [instProgressBardrums, setInstProgressBardrums] = useState(0);

  // voice
  const [songCifravoice, setSongCifravoice] = useState(null);
  const [instrActiveStatusvoice, setInstrActiveStatusvoice] = useState(false);
  const [instCapovoice, setInstCapovoice] = useState("");
  const [instTuningvoice, setInstTuningvoice] = useState("");
  const [instLastPlayedvoice, setInstLastPlayedvoice] = useState("");
  const [instLinkvoice, setInstLinkvoice] = useState("");
  const [instProgressBarvoice, setInstProgressBarvoice] = useState(0);

  const navigate = useNavigate();

  // Calcula a média de progress das instruments
  useEffect(() => {
    setGeralPercentage(
      Math.round(
        (Number(progGuitar01) +
          Number(progGuitar02) +
          Number(progBass) +
          Number(progKey) +
          Number(progDrums) +
          Number(progVoice)) /
          6
      )
    );
  }, [progGuitar01, progGuitar02, progBass, progKey, progDrums, progVoice]);

  // Carregar TODAS as opções de setlists do backend (para exibir como "tags")
  useEffect(() => {
    async function fetchAllSetlists() {
      try {
        // Ajuste para seu endpoint real, se houver
        const response = await fetch(
          "https://api.seudominio.com.br/allSetlists"
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setSetListOptions(data);
        }
      } catch (error) {
        console.error("Erro ao buscar lista global de setlists:", error);
      }
    }
    fetchAllSetlists();
  }, []);

  // Quando dataFromAPI chega, parse e preenche
  useEffect(() => {
    if (dataFromAPI && typeof dataFromAPI === "string") {
      try {
        const parsedData = JSON.parse(dataFromAPI);
        console.log("Parsed data:", parsedData);

        setArtistName(parsedData.artist || "");
        setSongName(parsedData.song || "");
        setCapoData(parsedData.capo || "N/A");
        setTomData(parsedData.tom || "N/A");
        setTunerData(parsedData.tuning || "N/A");
        setGeralPercentage(parsedData.progressBar || 0);
        setEmbedLink(parsedData.embedVideos || []);
        setFirstPlay(parsedData.addedIn);
        setLastPlay(parsedData.lastPlayed);

        // Se o backend já tiver um array de setlists, salve no estado
        if (parsedData.setlist && Array.isArray(parsedData.setlist)) {
          setSetlist(parsedData.setlist);
        }

        if (parsedData.guitar01?.active) {
          setSongCifraguitar01(parsedData.guitar01.songCifra);
          setInstrActiveStatusguitar01(true);
          setInstCapoguitar01(parsedData.guitar01.capo);
          setInstTuningguitar01(parsedData.guitar01.tuning);
          setInstLastPlayedguitar01(parsedData.guitar01.lastPlay);
          setInstLinkguitar01(parsedData.guitar01.link);
          setInstProgressBarguitar01(parsedData.guitar01.progress);
        }

        if (parsedData.guitar02?.active) {
          setSongCifraguitar02(parsedData.guitar02.songCifra);
          setInstrActiveStatusguitar02(true);
          setInstCapoguitar02(parsedData.guitar02.capo);
          setInstTuningguitar02(parsedData.guitar02.tuning);
          setInstLastPlayedguitar02(parsedData.guitar02.lastPlay);
          setInstLinkguitar02(parsedData.guitar02.link);
          setInstProgressBarguitar02(parsedData.guitar02.progress);
        }

        if (parsedData.bass?.active) {
          setSongCifrabass(parsedData.bass.songCifra);
          setInstrActiveStatusbass(true);
          setInstCapobass(parsedData.bass.capo);
          setInstTuningbass(parsedData.bass.tuning);
          setInstLastPlayedbass(parsedData.bass.lastPlay);
          setInstLinkbass(parsedData.bass.link);
          setInstProgressBarbass(parsedData.bass.progress);
        }

        if (parsedData.keys?.active) {
          setSongCifrakeyboard(parsedData.keys.songCifra);
          setInstrActiveStatuskeyboard(true);
          setInstCapokeyboard(parsedData.keys.capo);
          setInstTuningkeyboard(parsedData.keys.tuning);
          setInstLastPlayedkeyboard(parsedData.keys.lastPlay);
          setInstLinkkeyboard(parsedData.keys.link);
          setInstProgressBarkeyboard(parsedData.keys.progress);
        }

        if (parsedData.drums?.active) {
          setSongCifradrums(parsedData.drums.songCifra);
          setInstrActiveStatusdrums(true);
          setInstCapodrums(parsedData.drums.capo);
          setInstTuningdrums(parsedData.drums.tuning);
          setInstLastPlayeddrums(parsedData.drums.lastPlay);
          setInstLinkdrums(parsedData.drums.link);
          setInstProgressBardrums(parsedData.drums.progress);
        }

        if (parsedData.voice?.active) {
          setSongCifravoice(parsedData.voice.songCifra);
          setInstrActiveStatusvoice(true);
          setInstCapovoice(parsedData.voice.capo);
          setInstTuningvoice(parsedData.voice.tuning);
          setInstLastPlayedvoice(parsedData.voice.lastPlay);
          setInstLinkvoice(parsedData.voice.link);
          setInstProgressBarvoice(parsedData.voice.progress);
        }
      } catch (error) {
        console.error("Failed to parse dataFromAPI:", error);
      }
    }
  }, [dataFromAPI]);

  // Atualiza no banco
  const handleUpdate = async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");

      const updatedData = {
        song: songName,
        artist: artistName,
        progressBar: geralPercentage || 0,
        setlist: setlist, // Array de setlists atualizado (tags escolhidas)
        instruments: {
          guitar01: instrActiveStatusguitar01
            ? {
                active: true,
                capo: instCapoguitar01,
                lastPlay: instLastPlayedguitar01,
                link: instLinkguitar01,
                progress: instProgressBarguitar01,
                songCifra: songCifraguitar01,
                tuning: instTuningguitar01,
              }
            : false,
          guitar02: instrActiveStatusguitar02
            ? {
                active: true,
                capo: instCapoguitar02,
                lastPlay: instLastPlayedguitar02,
                link: instLinkguitar02,
                progress: instProgressBarguitar02,
                songCifra: songCifraguitar02,
                tuning: instTuningguitar02,
              }
            : false,
          bass: instrActiveStatusbass
            ? {
                active: true,
                capo: instCapobass,
                lastPlay: instLastPlayedbass,
                link: instLinkbass,
                progress: instProgressBarbass,
                songCifra: songCifrabass,
                tuning: instTuningbass,
              }
            : false,
          keys: instrActiveStatuskeyboard
            ? {
                active: true,
                capo: instCapokeyboard,
                lastPlay: instLastPlayedkeyboard,
                link: instLinkkeyboard,
                progress: instProgressBarkeyboard,
                songCifra: songCifrakeyboard,
                tuning: instTuningkeyboard,
              }
            : false,
          drums: instrActiveStatusdrums
            ? {
                active: true,
                capo: instCapodrums,
                lastPlay: instLastPlayeddrums,
                link: instLinkdrums,
                progress: instProgressBardrums,
                songCifra: songCifradrums,
                tuning: instTuningdrums,
              }
            : false,
          voice: instrActiveStatusvoice
            ? {
                active: true,
                capo: instCapovoice,
                lastPlay: instLastPlayedvoice,
                link: instLinkvoice,
                progress: instProgressBarvoice,
                songCifra: songCifravoice,
                tuning: instTuningvoice,
              }
            : false,
        },
        embedVideos: embedLink || [],
        updateIn: new Date().toISOString().split("T")[0],
        email: userEmail,
      };

      await updateSongData(updatedData);
      console.log("Song data updated successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error updating song data:", error);
    }
  };

  // Deletar a música
  const handleDelete = async () => {
    try {
      await deleteOneSong(artistName, songName);
      console.log("Song data deleted successfully:", artistName, songName);
      navigate("/");
    } catch (error) {
      console.error("Error deleting song data:", error);
    }
  };

  return (
    <>
      <EditSongSongData
        songName={songName}
        artistName={artistName}
        capoData={capoData}
        tomData={tomData}
        tunerData={tunerData}
        fistTime={firstPlay}
        lastTime={lastPlay}
        setSongName={setSongName}
        setArtistName={setArtistName}
        setCapoData={setCapoData}
        setTomData={setTomData}
        setTunerData={setTunerData}
      />

      <GeralProgressBar geralPercentage={geralPercentage} />

      <EditSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

      {/* Exibe as tags de setlist: 
          setListOptions: array global de opções,
          setlist: array com as tags selecionadas para esta música */}
      <EditSongSetlist
        setlist={setlist}
        setSetlist={setSetlist}
        setlistOptions={setListOptions}
        setSetListOptions={setSetListOptions}
      />

      <div className="flex flex-row neuphormism-b p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleUpdate}
        >
          Update
        </button>

        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded neuphormism-b-btn-red-discard ml-5"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </>
  );
}

export default EditSongColumnA;
