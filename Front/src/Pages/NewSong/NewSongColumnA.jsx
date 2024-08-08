import { useState } from "react";
import NewSongEmbed from "./NewSongEmbed";
import GeralProgressBar from "./GeralProgressBar";

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

  return (
    <>
      <div className="flex flex-row neuphormism-b p-5 my-5 mr-5">
        <div className="flex flex-col w-full">
          <h1 className="text-2xl font-bold">Song Data</h1>
          <div className="flex flex-col mt-5 w-full neuphormism-b p-5">
            <span className="text-sm py-2 font-bold ">SONG</span>
            <input
              type="text"
              name="songName"
              placeholder="Song's name"
              className="placeholder-text-sx w-full input-neumorfismo p-1"
              defaultValue={songName}
              readOnly
            />
          </div>
          <div className="flex flex-col my-5 w-full neuphormism-b p-5">
            <span className="text-sm py-2 font-bold ">ARTIST</span>
            <input
              type="text"
              name="artistName"
              placeholder="Artist's name"
              className="placeholder-text-sx w-full input-neumorfismo p-1"
              defaultValue={artistName}
              readOnly
            />
          </div>
          <div className="flex flex-row py-5 justify-between">
            <div className="w-full flex flex-col pr-2 neuphormism-b p-5 mr-5">
              <p className="text-sm font-semibold">CAPO</p>
              <input
                type="text"
                name="artistName"
                placeholder="Artist's name"
                className="placeholder-text-sx w-full input-neumorfismo p-1"
                defaultValue={capoData}
                readOnly
              />
            </div>
            <div className="w-full flex flex-col pr-2 neuphormism-b p-5 mr-5">
              <p className="text-sm font-semibold">TOM</p>
              <input
                type="text"
                name="artistName"
                placeholder="Artist's name"
                className="placeholder-text-sx w-full input-neumorfismo p-1"
                defaultValue={tomData}
                readOnly
              />
            </div>
            <div className="w-full flex flex-col pr-2 neuphormism-b p-5 ">
              <p className="text-sm font-semibold">TUNER</p>
              <input
                type="text"
                name="artistName"
                placeholder="Artist's name"
                className="placeholder-text-sx w-full input-neumorfismo p-1"
                defaultValue={tunerData}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      <GeralProgressBar geralPercentage={geralPercentage} />

      <NewSongEmbed ytEmbedSongList={embedLink} />

      <div className="flex flex-row neuphormism-b p-5 my-5 mr-5 justify-end">
        <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Save
        </button>
        <button className="bg-red-500 hover:bg-blue-700 text-white font-bold ml-5 py-2 px-4 rounded">
          Delete
        </button>
      </div>
    </>
  );
}

export default NewSongColumnA;
