/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import EditSongEmbed from "./EditSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import EditSongSongData from "./EditSongSongData";
import { deleteOneSong, updateSongData } from "../../Tools/Controllers"; // Função que você vai criar para atualizar
import { useNavigate } from "react-router-dom";

function EditSongColumnA({ dataFromAPI }) {
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [capoData, setCapoData] = useState("");
  const [tomData, setTomData] = useState("");
  const [tunerData, setTunerData] = useState("");
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState([]);
  const [firstPlay, setFirstPlay] = useState("");
  const [lastPlay, setLastPlay] = useState("");

  // guitar01
  const [songCifraguitar01, setSongCifraguitar01] = useState(null);
  const [instrActiveStatusguitar01, setInstrActiveStatusguitar01] =
    useState(null);
  const [instCapoguitar01, setInstCapoguitar01] = useState(null);
  const [instTuningguitar01, setInstTuningguitar01] = useState(null);
  const [instLastPlayedguitar01, setInstLastPlayedguitar01] = useState(null);
  const [instLinkguitar01, setInstLinkguitar01] = useState(null);
  const [instProgressBarguitar01, setInstProgressBarguitar01] = useState(null);

  // guitar02
  const [songCifraguitar02, setSongCifraguitar02] = useState(null);
  const [instrActiveStatusguitar02, setInstrActiveStatusguitar02] =
    useState(null);
  const [instCapoguitar02, setInstCapoguitar02] = useState(null);
  const [instTuningguitar02, setInstTuningguitar02] = useState(null);
  const [instLastPlayedguitar02, setInstLastPlayedguitar02] = useState(null);
  const [instLinkguitar02, setInstLinkguitar02] = useState(null);
  const [instProgressBarguitar02, setInstProgressBarguitar02] = useState(null);

  //bass
  const [songCifrabass, setSongCifrabass] = useState(null);
  const [instrActiveStatusbass, setInstrActiveStatusbass] = useState(null);
  const [instCapobass, setInstCapobass] = useState(null);
  const [instTuningbass, setInstTuningbass] = useState(null);
  const [instLastPlayedbass, setInstLastPlayedbass] = useState(null);
  const [instLinkbass, setInstLinkbass] = useState(null);
  const [instProgressBarbass, setInstProgressBarbass] = useState(null);

  //keyboard
  const [songCifrakeyboard, setSongCifrakeyboard] = useState(null);
  const [instrActiveStatuskeyboard, setInstrActiveStatuskeyboard] =
    useState(null);
  const [instCapokeyboard, setInstCapokeyboard] = useState(null);
  const [instTuningkeyboard, setInstTuningkeyboard] = useState(null);
  const [instLastPlayedkeyboard, setInstLastPlayedkeyboard] = useState(null);
  const [instLinkkeyboard, setInstLinkkeyboard] = useState(null);
  const [instProgressBarkeyboard, setInstProgressBarkeyboard] = useState(null);

  //drums
  const [songCifradrums, setSongCifradrums] = useState(null);
  const [instrActiveStatusdrums, setInstrActiveStatusdrums] = useState(null);
  const [instCapodrums, setInstCapodrums] = useState(null);
  const [instTuningdrums, setInstTuningdrums] = useState(null);
  const [instLastPlayeddrums, setInstLastPlayeddrums] = useState(null);
  const [instLinkdrums, setInstLinkdrums] = useState(null);
  const [instProgressBardrums, setInstProgressBardrums] = useState(null);

  //voice
  const [songCifravoice, setSongCifravoice] = useState(null);
  const [instrActiveStatusvoice, setInstrActiveStatusvoice] = useState(null);
  const [instCapovoice, setInstCapovoice] = useState(null);
  const [instTuningvoice, setInstTuningvoice] = useState(null);
  const [instLastPlayedvoice, setInstLastPlayedvoice] = useState(null);
  const [instLinkvoice, setInstLinkvoice] = useState(null);
  const [instProgressBarvoice, setInstProgressBarvoice] = useState(null);

  const navigator = useNavigate();

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

        if (parsedData.guitar01.active) {
          setSongCifraguitar01(parsedData.guitar01.songCifra);
          setInstrActiveStatusguitar01(true);
          setInstCapoguitar01(parsedData.guitar01.capo);
          setInstTuningguitar01(parsedData.guitar01.tuning);
          setInstLastPlayedguitar01(parsedData.guitar01.lastPlay);
          setInstLinkguitar01(parsedData.guitar01.link);
          setInstProgressBarguitar01(parsedData.guitar01.progress);
        }

        if (parsedData.guitar02.active) {
          setSongCifraguitar02(parsedData.guitar02.songCifra);
          setInstrActiveStatusguitar02(true);
          setInstCapoguitar02(parsedData.guitar02.capo);
          setInstTuningguitar02(parsedData.guitar02.tuning);
          setInstLastPlayedguitar02(parsedData.guitar02.lastPlay);
          setInstLinkguitar02(parsedData.guitar02.link);
          setInstProgressBarguitar02(parsedData.guitar02.progress);
        }

        if (parsedData.bass.active) {
          setSongCifrabass(parsedData.bass.songCifra);
          setInstrActiveStatusbass(true);
          setInstCapobass(parsedData.bass.capo);
          setInstTuningbass(parsedData.bass.tuning);
          setInstLastPlayedbass(parsedData.bass.lastPlay);
          setInstLinkbass(parsedData.bass.link);
          setInstProgressBarbass(parsedData.bass.progress);
        }

        if (parsedData.keys.active) {
          setSongCifrakeyboard(parsedData.keys.songCifra);
          setInstrActiveStatuskeyboard(true);
          setInstCapokeyboard(parsedData.keys.capo);
          setInstTuningkeyboard(parsedData.keys.tuning);
          setInstLastPlayedkeyboard(parsedData.keys.lastPlay);
          setInstLinkkeyboard(parsedData.keys.link);
          setInstProgressBarkeyboard(parsedData.keys.progress);
        }

        if (parsedData.drums.active) {
          setSongCifradrums(parsedData.drums.songCifra);
          setInstrActiveStatusdrums(true);
          setInstCapodrums(parsedData.drums.capo);
          setInstTuningdrums(parsedData.drums.tuning);
          setInstLastPlayeddrums(parsedData.drums.lastPlay);
          setInstLinkdrums(parsedData.drums.link);
          setInstProgressBardrums(parsedData.drums.progress);
        }

        if (parsedData.voice.active) {
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

  const handleUpdate = async () => {
    // const updatedData = {
    //   artist: artistName,
    //   song: songName,
    //   capo: capoData,
    //   tom: tomData,
    //   tuning: tunerData,
    //   progressBar: geralPercentage,
    //   embedVideos: embedLink,
    //   addedIn: firstPlay,
    //   lastPlayed: lastPlay,
    // };

    try {
      const userEmail = localStorage.getItem("userEmail");
      const updatedData = {
        song: songName,
        artist: artistName,
        progressBar: geralPercentage || 0,
        instruments: {
          guitar01: instrActiveStatusguitar01 ? true : false,
          guitar02: instrActiveStatusguitar02 ? true : false,
          bass: instrActiveStatusbass ? true : false,
          keys: instrActiveStatuskeyboard ? true : false,
          drums: instrActiveStatusdrums ? true : false,
          voice: instrActiveStatusvoice ? true : false,
        },
        guitar01: {
          active: instrActiveStatusguitar01,
          capo: instCapoguitar01,
          lastPlay: instLastPlayedguitar01,
          link: instLinkguitar01,
          progress: instProgressBarguitar01,
          songCifra: songCifraguitar01,
          tuning: instTuningguitar01,
        },
        guitar02: {
          active: instrActiveStatusguitar02,
          capo: instCapoguitar02,
          lastPlay: instLastPlayedguitar02,
          link: instLinkguitar02,
          progress: instProgressBarguitar02,
          songCifra: songCifraguitar02,
          tuning: instTuningguitar02,
        },
        bass: {
          active: instrActiveStatusbass,
          capo: instCapobass,
          lastPlay: instLastPlayedbass,
          link: instLinkbass,
          progress: instProgressBarbass,
          songCifra: songCifrabass,
          tuning: instTuningbass,
        },
        keys: {
          active: instrActiveStatuskeyboard,
          capo: instCapokeyboard,
          lastPlay: instLastPlayedkeyboard,
          link: instLinkkeyboard,
          progress: instProgressBarkeyboard,
          songCifra: songCifrakeyboard,
          tuning: instTuningkeyboard,
        },
        drums: {
          active: instrActiveStatusdrums,
          capo: instCapodrums,
          lastPlay: instLastPlayeddrums,
          link: instLinkdrums,
          progress: instProgressBardrums,
          songCifra: songCifradrums,
          tuning: instTuningdrums,
        },
        voice: {
          active: instrActiveStatusvoice,
          capo: instCapovoice,
          lastPlay: instLastPlayedvoice,
          link: instLinkvoice,
          progress: instProgressBarvoice,
          songCifra: songCifravoice,
          tuning: instTuningvoice,
        },

        embedVideos: embedLink || [],
        // addedIn: new Date().toISOString().split("T")[0],
        updateIn: new Date().toISOString().split("T")[0],
        email: userEmail,
      };

      // Chame a função que você criará para atualizar os dados no banco
      await updateSongData(updatedData);
      console.log("Song data updated successfully.");
    } catch (error) {
      console.error("Error updating song data:", error);
    }
  };

  const handleDelete = async () => {
    try {
      // Chame a função que você criará para deletar os dados no banco
      await deleteOneSong(artistName, songName);
      console.log("Song data deleted successfully.", artistName, songName);
      // Redirecionar para a página inicial
      navigator("/");
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
      <GeralProgressBar
        geralPercentage={geralPercentage}
        setGeralPercentage={setGeralPercentage}
      />
      <EditSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

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
