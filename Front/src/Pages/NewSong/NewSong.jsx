import { useEffect, useState } from "react";
import axios from "axios";
import NewSongColumnA from "./NewSongColumnA";
import NewSongColumnB from "./NewSongColumnB";
import SnackBar from "../../Tools/SnackBar";

function NewSong() {
  // Column A
  const [artistExtractedFromUrl, setArtistExtractedFromUrl] = useState();
  const [songExtractedFromUrl, setSongExtractedFromUrl] = useState();

  const [artistScrapado, setArtistScrapado] = useState("");
  const [songScrapado, setSongScrapado] = useState("");
  const [cifraExiste, setCifraExiste] = useState("");

  const [cifraFROMDB, setCifraFROMDB] = useState(null);

  // Column B
  // Guitar 01
  const [guitar01, setGuitar01] = useState("");
  const [progBarG01, setProgBarG01] = useState(0);

  // Guitar 02
  const [guitar02, setGuitar02] = useState("");
  const [progBarG02, setProgBarG02] = useState(0);

  // Bass
  const [bass, setBass] = useState("");
  const [progBarBass, setProgBarBass] = useState(0);

  // Key
  const [key, setKey] = useState("");
  const [progBarKey, setProgBarKey] = useState(0);

  // Drums
  const [drums, setDrums] = useState("");
  const [progBarDrums, setProgBarDrums] = useState(0);

  // Voice
  const [voice, setVoice] = useState("");
  const [progBarVoice, setProgBarVoice] = useState(0);

  // Getting Data
  const [dataFromUrl, setDataFromUrl] = useState("");

  // LocalStorage user email
  const userEmail = localStorage.getItem("userEmail");

  // SnackBar
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });

  const gettingSongData = async () => {
    try {
      const response = await axios.get(
        // `https://www.api.live.eloygomes.com.br/api/alldata/${userEmail}`
        `https://api.live.eloygomes.com.br/api/alldata/${userEmail}`
      );
      const dataFromUrlNAKED = JSON.stringify(response.data);
      setDataFromUrl(dataFromUrlNAKED);
    } catch (error) {
      // console.error("Error fetching song data:", error);
      // console.log("aqui tbm");
    }
  };

  useEffect(() => {
    if (guitar01 || guitar02 || bass || key || drums || voice)
      gettingSongData();
  }, [guitar01, guitar02, bass, key, drums, voice]);

  // console.log(dataFromUrl);

  return (
    <>
      {window.innerWidth <= 926 && window.innerWidth > 426 && (
        <div className=" flex justify-center h-screen ">
          <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
            <SnackBar snackbarMessage={snackbarMessage} />
          </div>
          <div className="">
            <div className="h-screen w-screen px-6 ">
              <div className="flex flex-row my-5 neuphormism-b p-5">
                <h1 className="text-4xl font-bold">Add new song</h1>
                <h4 className="ml-auto mt-auto text-sm">
                  Register new song here
                </h4>
              </div>
              <div className="flex flex-row">
                <div className="left-column w-1/2">
                  <NewSongColumnA
                    dataFromUrl={dataFromUrl}
                    artistExtractedFromUrl={artistExtractedFromUrl}
                    songExtractedFromUrl={songExtractedFromUrl}
                    guitar01={guitar01}
                    guitar02={guitar02}
                    bass={bass}
                    keyboard={key}
                    drums={drums}
                    voice={voice}
                    progBarG01={progBarG01}
                    progBarG02={progBarG02}
                    progBarBass={progBarBass}
                    progBarKey={progBarKey}
                    progBarDrums={progBarDrums}
                    progBarVoice={progBarVoice}
                    cifraExiste={cifraExiste}
                    setCifraFROMDB={setCifraFROMDB}
                    cifraFROMDB={cifraFROMDB}
                    setShowSnackBar={setShowSnackBar}
                    setSnackbarMessage={setSnackbarMessage}
                  />
                </div>
                <div className="right-column w-1/2">
                  <NewSongColumnB
                    guitar01={guitar01}
                    setGuitar01={setGuitar01}
                    guitar02={guitar02}
                    setGuitar02={setGuitar02}
                    bass={bass}
                    setBass={setBass}
                    keyboard={key}
                    setKey={setKey}
                    drums={drums}
                    setDrums={setDrums}
                    voice={voice}
                    setVoice={setVoice}
                    progBarG01={progBarG01}
                    setProgBarG01={setProgBarG01}
                    progBarG02={progBarG02}
                    setProgBarG02={setProgBarG02}
                    progBarBass={progBarBass}
                    setProgBarBass={setProgBarBass}
                    progBarKey={progBarKey}
                    setProgBarKey={setProgBarKey}
                    progBarDrums={progBarDrums}
                    setProgBarDrums={setProgBarDrums}
                    progBarVoice={progBarVoice}
                    setProgBarVoice={setProgBarVoice}
                    setArtistExtractedFromUrl={setArtistExtractedFromUrl}
                    setSongExtractedFromUrl={setSongExtractedFromUrl}
                    gettingSongData={gettingSongData}
                    setShowSnackBar={setShowSnackBar}
                    setSnackbarMessage={setSnackbarMessage}
                    cifraExiste={cifraExiste}
                    setCifraExiste={setCifraExiste}
                    setCifraFROMDB={setCifraFROMDB}
                    cifraFROMDB={cifraFROMDB}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {window.innerWidth >= 926 && (
        <div className=" flex justify-center h-screen pt-20">
          <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
            <SnackBar snackbarMessage={snackbarMessage} />
          </div>
          <div className="container mx-auto">
            <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
              <div className="flex flex-row my-5 neuphormism-b p-5">
                <h1 className="text-4xl font-bold">Add new song</h1>
                <h4 className="ml-auto mt-auto text-sm">
                  Register new song here
                </h4>
              </div>
              <div className="flex flex-row">
                <div className="left-column w-1/2">
                  <NewSongColumnA
                    dataFromUrl={dataFromUrl}
                    artistExtractedFromUrl={artistExtractedFromUrl}
                    songExtractedFromUrl={songExtractedFromUrl}
                    guitar01={guitar01}
                    guitar02={guitar02}
                    bass={bass}
                    keyboard={key}
                    drums={drums}
                    voice={voice}
                    progBarG01={progBarG01}
                    progBarG02={progBarG02}
                    progBarBass={progBarBass}
                    progBarKey={progBarKey}
                    progBarDrums={progBarDrums}
                    progBarVoice={progBarVoice}
                    setSongScrapado={setSongScrapado}
                    songScrapado={songScrapado}
                    setArtistScrapado={setArtistScrapado}
                    artistScrapado={artistScrapado}
                  />
                </div>
                <div className="right-column w-1/2">
                  <NewSongColumnB
                    guitar01={guitar01}
                    setGuitar01={setGuitar01}
                    guitar02={guitar02}
                    setGuitar02={setGuitar02}
                    bass={bass}
                    setBass={setBass}
                    keyboard={key}
                    setKey={setKey}
                    drums={drums}
                    setDrums={setDrums}
                    voice={voice}
                    setVoice={setVoice}
                    progBarG01={progBarG01}
                    setProgBarG01={setProgBarG01}
                    progBarG02={progBarG02}
                    setProgBarG02={setProgBarG02}
                    progBarBass={progBarBass}
                    setProgBarBass={setProgBarBass}
                    progBarKey={progBarKey}
                    setProgBarKey={setProgBarKey}
                    progBarDrums={progBarDrums}
                    setProgBarDrums={setProgBarDrums}
                    progBarVoice={progBarVoice}
                    setProgBarVoice={setProgBarVoice}
                    setArtistExtractedFromUrl={setArtistExtractedFromUrl}
                    setSongExtractedFromUrl={setSongExtractedFromUrl}
                    gettingSongData={gettingSongData}
                    setShowSnackBar={setShowSnackBar}
                    setSnackbarMessage={setSnackbarMessage}
                    dataFromUrl={dataFromUrl}
                    setSongScrapado={setSongScrapado}
                    songScrapado={songScrapado}
                    setArtistScrapado={setArtistScrapado}
                    artistScrapado={artistScrapado}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NewSong;
