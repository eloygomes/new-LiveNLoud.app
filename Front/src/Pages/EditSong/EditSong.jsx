import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditSongColumnA from "./EditSongColumnA";
import EditSongColumnB from "./EditSongColumnB";
import { fetchAllSongData } from "../../Tools/Controllers";
import SnackBar from "../../Tools/SnackBar";
import { setLocalStorageItemSafe } from "../../Tools/storageSafe";
import {
  getAdjacentSetlistSongs,
  loadActiveSetlistSongs,
} from "../shared/setlistNavigation";

const TOUCH_LAYOUT_MAX_WIDTH = 1024;

function getIsSongTouchLayout() {
  if (typeof window === "undefined") return false;

  const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const isIosDevice =
    /iPad|iPhone|iPod/i.test(window.navigator?.userAgent || "") ||
    (window.navigator?.platform === "MacIntel" &&
      window.navigator?.maxTouchPoints > 1);

  return (
    window.innerWidth < 768 ||
    isIosDevice ||
    (window.innerWidth <= TOUCH_LAYOUT_MAX_WIDTH && hasCoarsePointer)
  );
}

function safeDecode(value = "") {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function SetlistNavigationButtons({
  previousSetlistSong,
  nextSetlistSong,
  onGoToSetlistSong,
  touchLayout = false,
}) {
  const buttonClass = touchLayout
    ? "neuphormism-b-btn px-3 py-1.5 text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
    : "neuphormism-b-btn px-3 py-1.5 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div
      className={
        touchLayout
          ? "mt-3 grid grid-cols-2 gap-2 opacity-80"
          : "mt-3 grid grid-cols-2 gap-2 opacity-80"
      }
    >
      <button
        type="button"
        disabled={!previousSetlistSong}
        className={buttonClass}
        onClick={() => onGoToSetlistSong(previousSetlistSong)}
        aria-label="Previous song in selected setlist"
      >
        &lt;&lt;
      </button>
      <button
        type="button"
        disabled={!nextSetlistSong}
        className={buttonClass}
        onClick={() => onGoToSetlistSong(nextSetlistSong)}
        aria-label="Next song in selected setlist"
      >
        &gt;&gt;
      </button>
    </div>
  );
}

function EditSong() {
  const navigate = useNavigate();
  const { artist: routeArtist = "", song: routeSong = "" } = useParams();
  const isTouchLayout = getIsSongTouchLayout();
  const [songDataOpen, setSongDataOpen] = useState(true);
  const [dataFromAPI, setDataFromAPI] = useState([]);
  const [songData, setSongData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pageActions, setPageActions] = useState(null);
  const [setlistSongs, setSetlistSongs] = useState([]);
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

  const handleSongDataChange = useCallback((nextSongData) => {
    setSongData(nextSongData);
    setIsDirty(true);
  }, []);

  const userEmail = localStorage.getItem("userEmail");
  const artist =
    safeDecode(routeArtist) || localStorage.getItem("artist") || "";
  const song = safeDecode(routeSong) || localStorage.getItem("song") || "";

  const { previousSetlistSong, nextSetlistSong } = useMemo(
    () => getAdjacentSetlistSongs(setlistSongs, artist, song),
    [artist, setlistSongs, song],
  );

  const goToSetlistSong = useCallback(
    (targetSong) => {
      if (!targetSong) return;

      const nextArtist = String(targetSong.artist || "").trim();
      const nextSong = String(targetSong.song || "").trim();
      if (!nextArtist || !nextSong) return;

      setLocalStorageItemSafe("artist", nextArtist);
      setLocalStorageItemSafe("song", nextSong);
      setDataFromAPI([]);
      setSongData(null);
      setIsDirty(false);
      navigate(
        `/editsong/${encodeURIComponent(nextArtist)}/${encodeURIComponent(
          nextSong,
        )}`,
      );
    },
    [navigate],
  );

  const loadDataFromUser = useCallback(async () => {
    try {
      const data = await fetchAllSongData(userEmail, artist, song);
      if (data) {
        // console.log("Data fetched from API:", data); // Para verificar o que está sendo retornado
        setDataFromAPI(data);
        try {
          setSongData(JSON.parse(data || "{}"));
        } catch {
          setSongData(null);
        }
        setIsDirty(false);
      } else {
        console.warn("No data returned from API");
      }
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  }, [artist, song, userEmail]);

  useEffect(() => {
    setLocalStorageItemSafe("artist", artist);
    setLocalStorageItemSafe("song", song);
    loadDataFromUser();
  }, [artist, loadDataFromUser, song]);

  useEffect(() => {
    let active = true;

    const loadSetlistNavigation = async () => {
      const songs = await loadActiveSetlistSongs(artist, song);
      if (active) setSetlistSongs(songs);
    };

    loadSetlistNavigation();

    return () => {
      active = false;
    };
  }, [artist, song]);

  if (isTouchLayout) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-3">
        <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
          <SnackBar snackbarMessage={snackbarMessage} />
        </div>

        <div className="origin-top">
          <section className="neuphormism-b rounded-[22px] px-4 py-4">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                  Edit
                </p>
                <h1 className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-black">
                  Edit Song
                </h1>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Update song info, revise links, and keep the current setlist
                  structure without leaving context.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="neuphormism-b-btn-red-cancel rounded-[14px] px-3 py-2.5 text-sm font-bold"
                    onClick={pageActions?.onDelete}
                  >
                    Delete
                  </button>
                  <button
                    className="neuphormism-b-btn-green-save rounded-[14px] px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                    onClick={pageActions?.onUpdate}
                    disabled={!pageActions?.canUpdate}
                  >
                    Update
                  </button>
                </div>
                <SetlistNavigationButtons
                  previousSetlistSong={previousSetlistSong}
                  nextSetlistSong={nextSetlistSong}
                  onGoToSetlistSong={goToSetlistSong}
                  touchLayout
                />
              </div>
            </div>
          </section>

          <div className="mt-4 space-y-4">
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
              songData={songData}
              onSongDataChange={handleSongDataChange}
              touchLayout
            />
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
              setShowSnackBar={setShowSnackBar}
              setSnackbarMessage={setSnackbarMessage}
              touchLayout
              touchInlineMedia
              songDataOpen={songDataOpen}
              onToggleSongData={() => setSongDataOpen((current) => !current)}
              songData={songData}
              onSongDataChange={handleSongDataChange}
              onPageActionsChange={setPageActions}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] px-4 pb-24 pt-6 lg:px-6 lg:pb-8">
      <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
        <SnackBar snackbarMessage={snackbarMessage} />
      </div>
      <div className="mx-auto w-full max-w-none">
        <section className="neuphormism-b rounded-[28px] px-5 py-4 flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black md:text-[2.6rem]">
              Edit Song
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium text-gray-500 ">
              Update song info, revise links, and keep the current setlist
              structure without leaving context.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch">
            <div className="flex justify-end gap-3">
              <button
                className="neuphormism-b-btn-red-cancel rounded-[16px] px-6 py-3 text-base font-bold"
                onClick={pageActions?.onDelete}
              >
                Delete
              </button>
              <button
                className="neuphormism-b-btn-green-save rounded-[16px] px-8 py-3 text-base font-bold disabled:opacity-50"
                onClick={pageActions?.onUpdate}
                disabled={!pageActions?.canUpdate}
              >
                Update
              </button>
            </div>
            <SetlistNavigationButtons
              previousSetlistSong={previousSetlistSong}
              nextSetlistSong={nextSetlistSong}
              onGoToSetlistSong={goToSetlistSong}
            />
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-1">
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
            songData={songData}
            onSongDataChange={handleSongDataChange}
          />
          <div className="min-w-0">
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
              setShowSnackBar={setShowSnackBar}
              setSnackbarMessage={setSnackbarMessage}
              songData={songData}
              onSongDataChange={handleSongDataChange}
              onPageActionsChange={setPageActions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSong;
