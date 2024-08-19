/* eslint-disable no-unused-vars */
import { useState } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import FAKEDATA from "../../../FAKEDATA";
import NewSongSongData from "./NewSongSongData";
import axios from "axios";

function NewSongColumnA() {
  const [songName, setSongName] = useState("Can’t Help Falling in Love");
  const [artistName, setArtistName] = useState("Elvis Presley");
  const [capoData, setCapoData] = useState("2 Casa");
  const [tomData, setTomData] = useState("C Major");
  const [tunerData, setTunerData] = useState("Eb");
  const [geralPercentage, setGeralPercentage] = useState("90");
  const [embedLink, setEmbedLink] = useState([
    "Elvis Presley - Cant Help Falling In Love (Official Audio)",
    "Elvis Presley - Cant Help Falling in Love - Bass Cover with tabs",
  ]);

  console.log(FAKEDATA[0].FirstPlay);

  const createNewSong = async ({ instrumentName, instument, progress }) => {
    console.log(`instrumentName: ${instrumentName}`);
    console.log(`instrumentName: ${instument}`);
    console.log(`progress: ${progress}`);

    //  SCRAPPER

    // ENVIANDO OS DADOS REGISTRANDO A MUSIC
    try {
      const response = await axios.post(
        "https://www.api.live.eloygomes.com.br/api/newsong",
        {
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: {
            id: 1,
            song: "",
            artist: "",
            progressBar: 85,
            instruments: {
              guitar01: `${instrumentName === "GUITAR 01" ? true : false}`,
              guitar02: `${instrumentName === "GUITAR 02" ? true : false}`,
              bass: `${instrumentName === "BASS" ? true : false}`,
              keys: `${instrumentName === "KEYS" ? true : false}`,
              drums: `${instrumentName === "DRUMS" ? true : false}`,
              voice: `${instrumentName === "VOICE" ? true : false}`,
            },
            guitar01: {
              active: `${instrumentName === "GUITAR 01" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            guitar02: {
              active: `${instrumentName === "GUITAR 02" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            bass: {
              active: `${instrumentName === "BASS" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            keys: {
              active: `${instrumentName === "KEYS" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            drums: {
              active: `${instrumentName === "DRUMS" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            voice: {
              active: `${instrumentName === "VOICE" ? true : false}`,
              capo: "",
              tuning: "",
              lastPlay: "2024-08-01",
              songCifra: "",
            },
            embedVideos: [],
            addedIn: "2024-08-16",
            updateIn: "2024-08-16",
            email: "cachorroni@email.com",
          },
        }
      );
      // console.log("User registered in API:", response.data);
    } catch (error) {
      console.error("Error registering user in API:", error);
      throw new Error("API registration failed");
    }
  };

  return (
    <>
      <NewSongSongData
        songName={FAKEDATA[0].Song}
        artistName={FAKEDATA[0].Artist}
        capoData={FAKEDATA[0].guitar01.capo}
        tomData={FAKEDATA[0].guitar01.tom}
        tunerData={FAKEDATA[0].guitar01.tuner}
        fistTime={FAKEDATA[0].AddedIn}
        lastTime={FAKEDATA[0].guitar01.lastPlay}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />

      <NewSongEmbed ytEmbedSongList={embedLink} />

      <div className="flex flex-row neuphormism-b-se p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => createNewSong()}
        >
          Save
        </button>
        <button className="bg-red-500 hover:bg-blue-700 text-white font-bold ml-5 py-2 px-4 rounded">
          Discard
        </button>
      </div>
    </>
  );
}

export default NewSongColumnA;
