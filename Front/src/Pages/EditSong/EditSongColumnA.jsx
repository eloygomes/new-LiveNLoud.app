/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import EditSongEmbed from "./EditSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import EditSongSongData from "./EditSongSongData";

function EditSongColumnA({ dataFromAPI }) {
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [capoData, setCapoData] = useState("");
  const [tomData, setTomData] = useState("");
  const [tunerData, setTunerData] = useState("");
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState([]);
  const [firstPlay, setFirstPlay] = useState(false);
  const [lastPlay, setLastPlay] = useState(false);

  useEffect(() => {
    if (dataFromAPI && typeof dataFromAPI === "string") {
      try {
        const parsedData = JSON.parse(dataFromAPI);

        setSongName(parsedData.song || "");
        setArtistName(parsedData.artist || "");
        setCapoData(parsedData.guitar01?.capo || "N/A");
        setTomData(parsedData.guitar01?.tuning || "N/A");
        setTunerData(parsedData.guitar01?.tuning || "N/A");
        setGeralPercentage(parsedData.progressBar || 0);
        setEmbedLink(parsedData.embedVideos || []);
        setFirstPlay(parsedData.guitar01?.firstPlay || false);
        setLastPlay(parsedData.guitar01?.lastPlay || false);
      } catch (error) {
        console.error("Failed to parse dataFromAPI:", error);
      }
    }
  }, [dataFromAPI]);

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
      />
      <GeralProgressBar geralPercentage={geralPercentage} />

      {/* Passando setEmbedLink corretamente */}
      <EditSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />

      <div className="flex flex-row neuphormism-b p-5 my-5 mr-5 justify-start">
        <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Update
        </button>
        <button className="bg-red-500 hover:bg-blue-700 text-white font-bold ml-5 py-2 px-4 rounded">
          Discard
        </button>
      </div>
    </>
  );
}

export default EditSongColumnA;
