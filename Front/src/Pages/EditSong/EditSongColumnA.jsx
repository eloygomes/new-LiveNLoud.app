import { useState, useEffect } from "react";
import EditSongEmbed from "./EditSongEmbed";
import GeralProgressBar from "./GeralProgressBar";
import EditSongSongData from "./EditSongSongData";
import { updateSongData } from "../../Tools/Controllers"; // Função que você vai criar para atualizar

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

  useEffect(() => {
    if (dataFromAPI && typeof dataFromAPI === "string") {
      try {
        const parsedData = JSON.parse(dataFromAPI);

        setArtistName(parsedData.artist || "");
        setSongName(parsedData.song || "");
        setCapoData(parsedData.capo || "N/A");
        setTomData(parsedData.tom || "N/A");
        setTunerData(parsedData.tuning || "N/A");
        setGeralPercentage(parsedData.progressBar || 0);
        setEmbedLink(parsedData.embedVideos || []);
        setFirstPlay(parsedData.addedIn);
        setLastPlay(parsedData.lastPlayed);
      } catch (error) {
        console.error("Failed to parse dataFromAPI:", error);
      }
    }
  }, [dataFromAPI]);

  const handleUpdate = async () => {
    const updatedData = {
      artist: artistName,
      song: songName,
      capo: capoData,
      tom: tomData,
      tuning: tunerData,
      progressBar: geralPercentage,
      embedVideos: embedLink,
      addedIn: firstPlay,
      lastPlayed: lastPlay,
    };

    try {
      // Chame a função que você criará para atualizar os dados no banco
      await updateSongData(updatedData);
      console.log("Song data updated successfully.");
    } catch (error) {
      console.error("Error updating song data:", error);
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
      </div>
    </>
  );
}

export default EditSongColumnA;
