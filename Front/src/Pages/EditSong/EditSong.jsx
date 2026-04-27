import { useEffect, useState, useRef, useCallback } from "react";
import EditSongColumnA from "./EditSongColumnA";
import EditSongColumnB from "./EditSongColumnB";
import { fetchAllSongData } from "../../Tools/Controllers";
import SnackBar from "../../Tools/SnackBar";

function EditSong() {
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const [songDataOpen, setSongDataOpen] = useState(true);
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
      <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-0">
        <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
          <SnackBar snackbarMessage={snackbarMessage} />
        </div>

        <div className="origin-top">
          <div className="neuphormism-b rounded-[28px] px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
              Song Workspace
            </p>
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
    <div className="min-h-screen bg-[#f0f0f0] px-6 pb-24 pt-8">
      <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
        <SnackBar snackbarMessage={snackbarMessage} />
      </div>
      <div className="mx-auto w-full max-w-7xl">
        <section className="neuphormism-b rounded-[28px] px-5 py-4 flex flex-row justify-between">
          <h1 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black md:text-[2.6rem]">
            Edit Song
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-medium text-gray-500 ">
            Update song info, revise links, and keep the current setlist
            structure without leaving context.
          </p>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
          <div className="left-column min-w-0">
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
          <div className="right-column min-w-0">
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
  );
}

export default EditSong;
