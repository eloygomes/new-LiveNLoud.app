// /* eslint-disable react/prop-types */
// import { useState, useEffect } from "react";
// import EditSongEmbed from "./EditSongEmbed";
// import GeralProgressBar from "./GeralProgressBar";
// import EditSongSongData from "./EditSongSongData";

// function EditSongColumnA({ dataFromAPI }) {
//   const [songName, setSongName] = useState("");
//   const [artistName, setArtistName] = useState("");
//   const [capoData, setCapoData] = useState("");
//   const [tomData, setTomData] = useState("");
//   const [tunerData, setTunerData] = useState("");
//   const [geralPercentage, setGeralPercentage] = useState(0);
//   const [embedLink, setEmbedLink] = useState([]);

//   useEffect(() => {
//     if (dataFromAPI) {
//       console.log(dataFromAPI);
//       setSongName(dataFromAPI.song || "lllllll");
//       setArtistName(dataFromAPI.artist || "");
//       setCapoData(dataFromAPI.guitar01?.capo || "N/A");
//       setTomData(dataFromAPI.guitar01?.tom || "N/A");
//       setTunerData(dataFromAPI.guitar01?.tuning || "N/A");
//       setGeralPercentage(dataFromAPI.progressBar || 0);
//       setEmbedLink(dataFromAPI.embedVideos || []);
//     }
//   }, [dataFromAPI]);

//   return (
//     <>
//       <EditSongSongData
//         songName={songName}
//         artistName={artistName}
//         capoData={capoData}
//         tomData={tomData}
//         tunerData={tunerData}
//         fistTime={dataFromAPI?.addedIn || "N/A"}
//         lastTime={dataFromAPI?.guitar01?.lastPlay || "N/A"}
//       />
//       <GeralProgressBar geralPercentage={geralPercentage} />

//       <EditSongEmbed ytEmbedSongList={embedLink} />

//       <div className="flex flex-row neuphormism-b p-5 my-5 mr-5 justify-start">
//         <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
//           Update
//         </button>
//         <button className="bg-red-500 hover:bg-blue-700 text-white font-bold ml-5 py-2 px-4 rounded">
//           Discard
//         </button>
//       </div>
//     </>
//   );
// }

// export default EditSongColumnA;

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
        fistTime={dataFromAPI?.addedIn || "N/A"}
        lastTime={dataFromAPI?.guitar01?.lastPlay || "N/A"}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />

      <EditSongEmbed ytEmbedSongList={embedLink} />

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
