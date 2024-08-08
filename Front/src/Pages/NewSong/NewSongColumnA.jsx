import { useState } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import FAKEDATA from "../../../FAKEDATA";
import NewSongSongData from "./NewSongSongData";

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
        <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
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
