/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import NewSongSongData from "./NewSongSongData";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { deleteOneSong } from "../../Tools/Controllers";

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

  const navigate = useNavigate();
  const hasSaved = useRef(false); // Track if the song has been saved
  const addedSongName = useRef(null); // Track the song that was added

  useEffect(() => {
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

        console.log(actualSongData);

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

    // Cleanup function to handle unmounting
    // return () => {
    //   if (!hasSaved.current && addedSongName.current) {
    //     deleteOneSong(artistName, addedSongName.current);
    //   }
    // };
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

  const createNewSong = async ({ instrumentName, geralPercentage }) => {
    const userEmail = localStorage.getItem("userEmail");

    if (songName && artistName) {
      try {
        const userdata = {
          song: songName,
          artist: artistName,
          progressBar: geralPercentage || 0,
          instruments: {
            guitar01: instrumentName === "guitar01" ? true : false,
            guitar02: instrumentName === "guitar02" ? true : false,
            bass: instrumentName === "bass" ? true : false,
            keys: instrumentName === "keys" ? true : false,
            drums: instrumentName === "drums" ? true : false,
            voice: instrumentName === "voice" ? true : false,
          },
          guitar01: {
            active: instrActiveStatus,
            capo: instCapo,
            lastPlay: instLastPlayed,
            link: instLink,
            progress: instProgressBar,
            songCifra: songCifra,
            tuning: instTuning,
          },
          guitar02: {
            active: instrActiveStatus,
            capo: instCapo,
            lastPlay: instLastPlayed,
            link: instLink,
            progress: instProgressBar,
            songCifra: songCifra,
            tuning: instTuning,
          },
          bass: {
            active: instrActiveStatus,
            capo: instCapo,
            lastPlay: instLastPlayed,
            link: instLink,
            progress: instProgressBar,
            songCifra: songCifra,
            tuning: instTuning,
          },
          keys: {
            active: instrActiveStatus,
            capo: instCapo,
            lastPlay: instLastPlayed,
            link: instLink,
            progress: instProgressBar,
            songCifra: songCifra,
            tuning: instTuning,
          },
          drums: {
            active: instrActiveStatus,
            capo: instCapo,
            lastPlay: instLastPlayed,
            link: instLink,
            progress: instProgressBar,
            songCifra: songCifra,
            tuning: instTuning,
          },
          voice: {
            active: instrActiveStatus,
            capo: instCapo,
            lastPlay: instLastPlayed,
            link: instLink,
            progress: instProgressBar,
            songCifra: songCifra,
            tuning: instTuning,
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

        console.log(userdata);

        await axios.post(
          // `https://www.api.live.eloygomes.com.br/api/newsong`,
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
      <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
          onClick={() => {
            createNewSong({
              instrumentName,
              instrument, // link
              geralPercentage,
            });
          }}
        >
          Save
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard"
          onClick={() => {
            deleteOneSong(artistName, songName);
            hasSaved.current = true; // Mark as saved to prevent deletion on unmount
            addedSongName.current = null; // Clear the added song name
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
