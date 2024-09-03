// /* eslint-disable react/prop-types */
// import { useEffect, useState, useRef } from "react";
// import NewSongEmbed from "./NewSongEmbed";
// import GeralProgressBar from "./GeralProgressBar";
// import NewSongSongData from "./NewSongSongData";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { deleteOneSong } from "../../Tools/Controllers";

// function NewSongColumnA({
//   dataFromUrl,
//   artistExtractedFromUrl,
//   songExtractedFromUrl,
//   guitar01,
//   guitar02,
//   bass,
//   keyboard,
//   drums,
//   voice,
//   progBarG01,
//   progBarG02,
//   progBarBass,
//   progBarKey,
//   progBarDrums,
//   progBarVoice,
// }) {
//   const [songName, setSongName] = useState(null);
//   const [artistName, setArtistName] = useState(null);
//   const [capoData, setCapoData] = useState(null);
//   const [tomData, setTomData] = useState(null);
//   const [tunerData, setTunerData] = useState(null);
//   const [geralPercentage, setGeralPercentage] = useState(0);
//   const [embedLink, setEmbedLink] = useState([]);
//   const [instrumentName, setInstrumentName] = useState("");
//   const [instrument, setInstrument] = useState(null);

//   const navigate = useNavigate();
//   const hasSaved = useRef(false); // Track if the song has been saved

//   useEffect(() => {
//     // Set instrument based on the available data
//     if (guitar01) {
//       setInstrumentName("guitar01");
//       setInstrument(guitar01);
//     } else if (guitar02) {
//       setInstrumentName("guitar02");
//       setInstrument(guitar02);
//     } else if (bass) {
//       setInstrumentName("bass");
//       setInstrument(bass);
//     } else if (keyboard) {
//       setInstrumentName("keys");
//       setInstrument(keyboard);
//     } else if (drums) {
//       setInstrumentName("drums");
//       setInstrument(drums);
//     } else if (voice) {
//       setInstrumentName("voice");
//       setInstrument(voice);
//     } else {
//       return;
//     }

//     if (typeof dataFromUrl === "string" && dataFromUrl.length > 0) {
//       try {
//         const parsedData = JSON.parse(dataFromUrl);

//         const actualSongData = parsedData[parsedData.length - 1];

//         setArtistName(actualSongData.artist);
//         setSongName(actualSongData.song); // Immediately set the new song name
//         setCapoData(actualSongData.capo);
//         setTomData(actualSongData.tom);
//         setTunerData(actualSongData.tuning);
//         setGeralPercentage(actualSongData.progressBar);
//         setEmbedLink(actualSongData.embed);
//       } catch (error) {
//         console.error("Error parsing dataFromUrl:", error);
//       }
//     }

//     if (
//       progBarG01 ||
//       progBarG02 ||
//       progBarBass ||
//       progBarKey ||
//       progBarDrums ||
//       progBarVoice
//     ) {
//       setGeralPercentage(
//         parseInt(
//           (parseInt(progBarG01, 10) +
//             parseInt(progBarG02, 10) +
//             parseInt(progBarBass, 10) +
//             parseInt(progBarKey, 10) +
//             parseInt(progBarDrums, 10) +
//             parseInt(progBarVoice, 10)) /
//             6
//         )
//       );
//     }

//     // Cleanup function to handle unmounting
//     return () => {
//       if (!hasSaved.current && songName && artistName) {
//         deleteOneSong(artistName, songName);
//       }
//     };
//   }, [
//     dataFromUrl,
//     songExtractedFromUrl,
//     artistExtractedFromUrl,
//     instrument,
//     guitar01,
//     guitar02,
//     bass,
//     keyboard,
//     drums,
//     voice,
//     progBarG01,
//     progBarG02,
//     progBarBass,
//     progBarKey,
//     progBarDrums,
//     progBarVoice,
//   ]);

//   const createNewSong = async ({ instrumentName, progress }) => {
//     const userEmail = localStorage.getItem("userEmail");

//     if (songName && artistName) {
//       try {
//         const userdata = {
//           song: songName,
//           artist: artistName,
//           progressBar: geralPercentage || 0,
//           instruments: {
//             guitar01: instrumentName === "guitar01",
//             guitar02: instrumentName === "guitar02",
//             bass: instrumentName === "bass",
//             keys: instrumentName === "keys",
//             drums: instrumentName === "drums",
//             voice: instrumentName === "voice",
//           },
//           guitar01: {
//             active: instrumentName === "guitar01",
//             capo: instrumentName === "guitar01" ? capoData : null,
//             tuning: instrumentName === "guitar01" ? tunerData : null,
//             lastPlay:
//               instrumentName === "guitar01"
//                 ? new Date().toISOString().split("T")[0]
//                 : null,
//           },
//           guitar02: {
//             active: instrumentName === "guitar02",
//             capo: instrumentName === "guitar02" ? capoData : null,
//             tuning: instrumentName === "guitar02" ? tunerData : null,
//             lastPlay:
//               instrumentName === "guitar02"
//                 ? new Date().toISOString().split("T")[0]
//                 : null,
//           },
//           bass: {
//             active: instrumentName === "bass",
//             capo: instrumentName === "bass" ? capoData : "None",
//             tuning: instrumentName === "bass" ? tunerData : "Standard",
//             lastPlay:
//               instrumentName === "bass"
//                 ? new Date().toISOString().split("T")[0]
//                 : "2024-07-25",
//           },
//           keys: {
//             active: instrumentName === "keys",
//             capo: null,
//             tuning: null,
//             lastPlay: null,
//           },
//           drums: {
//             active: instrumentName === "drums",
//             capo: null,
//             tuning: null,
//             lastPlay: null,
//           },
//           voice: {
//             active: instrumentName === "voice",
//             capo: null,
//             tuning: null,
//             lastPlay: null,
//           },
//           embedVideos: embedLink || [],
//           addedIn: "2024-08-16",
//           updateIn: new Date().toISOString().split("T")[0],
//           email: userEmail,
//         };

//         const payload = JSON.stringify({
//           databaseComing: "liveNloud_",
//           collectionComing: "data",
//           userdata: userdata,
//         });

//         await axios.post(
//           `https://www.api.live.eloygomes.com.br/api/newsong`,
//           payload,
//           {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         hasSaved.current = true; // Mark as saved
//         setSongName("");
//         setArtistName("");
//         setGeralPercentage(0);
//         navigate("/");
//       } catch (error) {
//         console.error("Error saving data:", error);
//       }
//     }
//   };

//   return (
//     <>
//       <NewSongSongData
//         songName={songName}
//         artistName={artistName}
//         capoData={capoData}
//         tomData={tomData}
//         tunerData={tunerData}
//         fistTime={"2024-08-16"}
//         lastTime={"2024-08-16"}
//       />
//       <GeralProgressBar geralPercentage={geralPercentage} />
//       <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />
//       <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
//         <button
//           className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
//           onClick={() => {
//             createNewSong({
//               instrumentName,
//               instrument,
//               progress: geralPercentage,
//             });
//           }}
//         >
//           Save
//         </button>
//         <button
//           className="bg-red-500 hover:bg-red-700 active:bg-red-900 text-white font-bold py-2 px-4 ml-4 neuphormism-b-btn-red-discard"
//           onClick={() => {
//             deleteOneSong(artistName, songName);
//             hasSaved.current = true; // Mark as saved to prevent deletion on unmount
//             navigate("/");
//           }}
//         >
//           Discard
//         </button>
//       </div>
//     </>
//   );
// }

// export default NewSongColumnA;

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
  const [geralPercentage, setGeralPercentage] = useState(0);
  const [embedLink, setEmbedLink] = useState([]);
  const [instrumentName, setInstrumentName] = useState("");
  const [instrument, setInstrument] = useState(null);

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

        setArtistName(actualSongData.artist);
        setSongName(actualSongData.song); // Immediately set the new song name
        setCapoData(actualSongData.capo);
        setTomData(actualSongData.tom);
        setTunerData(actualSongData.tuning);
        setGeralPercentage(actualSongData.progressBar);
        setEmbedLink(actualSongData.embed);

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
    return () => {
      if (!hasSaved.current && addedSongName.current) {
        deleteOneSong(artistName, addedSongName.current);
      }
    };
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

  const createNewSong = async ({ instrumentName, progress }) => {
    const userEmail = localStorage.getItem("userEmail");

    if (songName && artistName) {
      try {
        const userdata = {
          song: songName,
          artist: artistName,
          progressBar: geralPercentage || 0,
          instruments: {
            guitar01: instrumentName === "guitar01",
            guitar02: instrumentName === "guitar02",
            bass: instrumentName === "bass",
            keys: instrumentName === "keys",
            drums: instrumentName === "drums",
            voice: instrumentName === "voice",
          },
          guitar01: {
            active: instrumentName === "guitar01",
            capo: instrumentName === "guitar01" ? capoData : null,
            tuning: instrumentName === "guitar01" ? tunerData : null,
            lastPlay:
              instrumentName === "guitar01"
                ? new Date().toISOString().split("T")[0]
                : null,
          },
          guitar02: {
            active: instrumentName === "guitar02",
            capo: instrumentName === "guitar02" ? capoData : null,
            tuning: instrumentName === "guitar02" ? tunerData : null,
            lastPlay:
              instrumentName === "guitar02"
                ? new Date().toISOString().split("T")[0]
                : null,
          },
          bass: {
            active: instrumentName === "bass",
            capo: instrumentName === "bass" ? capoData : "None",
            tuning: instrumentName === "bass" ? tunerData : "Standard",
            lastPlay:
              instrumentName === "bass"
                ? new Date().toISOString().split("T")[0]
                : "2024-07-25",
          },
          keys: {
            active: instrumentName === "keys",
            capo: null,
            tuning: null,
            lastPlay: null,
          },
          drums: {
            active: instrumentName === "drums",
            capo: null,
            tuning: null,
            lastPlay: null,
          },
          voice: {
            active: instrumentName === "voice",
            capo: null,
            tuning: null,
            lastPlay: null,
          },
          embedVideos: embedLink || [],
          addedIn: "2024-08-16",
          updateIn: new Date().toISOString().split("T")[0],
          email: userEmail,
        };

        const payload = JSON.stringify({
          databaseComing: "liveNloud_",
          collectionComing: "data",
          userdata: userdata,
        });

        await axios.post(
          `https://www.api.live.eloygomes.com.br/api/newsong`,
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
        fistTime={"2024-08-16"}
        lastTime={"2024-08-16"}
      />
      <GeralProgressBar geralPercentage={geralPercentage} />
      <NewSongEmbed ytEmbedSongList={embedLink} setEmbedLink={setEmbedLink} />
      <div className="flex flex-row neuphormism-b-btn-flat p-5 my-5 mr-5 justify-start">
        <button
          className="bg-green-500 hover:bg-green-700 active:bg-green-900 text-white font-bold py-2 px-4 neuphormism-b-btn-green"
          onClick={() => {
            createNewSong({
              instrumentName,
              instrument,
              progress: geralPercentage,
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
