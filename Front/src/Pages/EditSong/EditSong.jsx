import { useEffect, useState, useRef, useCallback } from "react";
import EditSongColumnA from "./EditSongColumnA";
import EditSongColumnB from "./EditSongColumnB";
import { fetchAllSongData } from "../../Tools/Controllers";
import SnackBar from "../../Tools/SnackBar";

function EditSong() {
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const [songDataOpen, setSongDataOpen] = useState(false);
  const [dataFromAPI, setDataFromAPI] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });

  // Column B
  const [progGuitar01, setProgGuitar01] = useState(0);
  const [progGuitar02, setProgGuitar02] = useState(0);
  const [progBass, setProgBass] = useState(0);
  const [progKey, setProgKey] = useState(0);
  const [progDrums, setProgDrums] = useState(0);
  const [progVoice, setProgVoice] = useState(0);

  const instrumentUpdatersRef = useRef({});
  const registerInstrumentUpdaters = useCallback((instrument, handlers) => {
    if (!instrument) return;
    instrumentUpdatersRef.current[instrument] = handlers;
  }, []);

  // LocalStorage user email
  const userEmail = localStorage.getItem("userEmail");
  const artist = localStorage.getItem("artist");
  const song = localStorage.getItem("song");

  const loadDataFromUser = async () => {
    try {
      const data = await fetchAllSongData(userEmail, artist, song);
      if (data) {
        // console.log("Data fetched from API:", data); // Para verificar o que está sendo retornado
        setDataFromAPI(data);
        setIsDirty(false);
      } else {
        console.warn("No data returned from API");
      }
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  useEffect(() => {
    loadDataFromUser();
  }, []);

  if (isTouchLayout) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-3">
        <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
          <SnackBar snackbarMessage={snackbarMessage} />
        </div>

        <div className="origin-top ">
          <div className="rounded-[20px] bg-[#e0e0e0] px-4 py-3 shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
            <div className="text-[1.9rem] font-black tracking-tight text-black">
              EDIT SONG
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-500">
              Update the song and its instrument links here.
            </div>
          </div>

          <div className="mt-4">
            <EditSongColumnA
              dataFromAPI={dataFromAPI}
              progGuitar01={progGuitar01}
              progGuitar02={progGuitar02}
              progBass={progBass}
              progKey={progKey}
              progDrums={progDrums}
              progVoice={progVoice}
              registerInstrumentUpdaters={registerInstrumentUpdaters}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              touchLayout
              songDataOpen={songDataOpen}
              onToggleSongData={() => setSongDataOpen((current) => !current)}
              middleContent={
                <EditSongColumnB
                  dataFromAPI={dataFromAPI}
                  progGuitar01={progGuitar01}
                  setProgGuitar01={setProgGuitar01}
                  progGuitar02={progGuitar02}
                  setProgGuitar02={setProgGuitar02}
                  progBass={progBass}
                  setProgBass={setProgBass}
                  progKey={progKey}
                  setProgKey={setProgKey}
                  progDrums={progDrums}
                  setProgDrums={setProgDrums}
                  progVoice={progVoice}
                  setProgVoice={setProgVoice}
                  instrumentUpdatersRef={instrumentUpdatersRef}
                  setIsDirty={setIsDirty}
                  setShowSnackBar={setShowSnackBar}
                  setSnackbarMessage={setSnackbarMessage}
                  onLinkAdded={() => setSongDataOpen(true)}
                  touchLayout
                />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" flex justify-center h-screen ">
      <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
        <SnackBar snackbarMessage={snackbarMessage} />
      </div>
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">EDIT SONG</h1>
            <h4 className="ml-auto mt-auto text-sm">Edit your song here</h4>
          </div>
          <div className="flex flex-row">
            <div className="left-column w-1/2">
              <EditSongColumnA
                dataFromAPI={dataFromAPI}
                progGuitar01={progGuitar01}
                progGuitar02={progGuitar02}
                progBass={progBass}
                progKey={progKey}
                progDrums={progDrums}
                progVoice={progVoice}
                registerInstrumentUpdaters={registerInstrumentUpdaters}
                isDirty={isDirty}
                setIsDirty={setIsDirty}
              />
            </div>
            <div className="right-column w-1/2">
              <EditSongColumnB
                dataFromAPI={dataFromAPI}
                progGuitar01={progGuitar01}
                setProgGuitar01={setProgGuitar01}
                progGuitar02={progGuitar02}
                setProgGuitar02={setProgGuitar02}
                progBass={progBass}
                setProgBass={setProgBass}
                progKey={progKey}
                setProgKey={setProgKey}
                progDrums={progDrums}
                setProgDrums={setProgDrums}
                progVoice={progVoice}
                setProgVoice={setProgVoice}
                instrumentUpdatersRef={instrumentUpdatersRef}
                setIsDirty={setIsDirty}
                setShowSnackBar={setShowSnackBar}
                setSnackbarMessage={setSnackbarMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSong;
