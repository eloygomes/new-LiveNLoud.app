import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditSongColumnA from "./EditSongColumnA";
import EditSongColumnB from "./EditSongColumnB";
import { fetchAllSongData } from "../../Tools/Controllers";
import SnackBar from "../../Tools/SnackBar";
import { setLocalStorageItemSafe } from "../../Tools/storageSafe";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  FaChevronLeft,
  FaChevronRight,
  FaFileCode,
  FaGuitar,
  FaListUl,
  FaVideo,
} from "react-icons/fa";
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
  const { t } = useLanguage();
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
        aria-label={t("songPages.previousSong")}
      >
        &lt;&lt;
      </button>
      <button
        type="button"
        disabled={!nextSetlistSong}
        className={buttonClass}
        onClick={() => onGoToSetlistSong(nextSetlistSong)}
        aria-label={t("songPages.nextSong")}
      >
        &gt;&gt;
      </button>
    </div>
  );
}

function EditSong() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { artist: routeArtist = "", song: routeSong = "" } = useParams();
  const isTouchLayout = getIsSongTouchLayout();
  const [songDataOpen, setSongDataOpen] = useState(true);
  const [mobileSection, setMobileSection] = useState("home");
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
    const mobileSections = [
      { id: "links", label: "Input Links", description: "Review instrument sources and progress", icon: FaGuitar },
      { id: "guitarPro", label: "Guitar Pro", description: "Attach or remove the Guitar Pro file", icon: FaFileCode },
      { id: "videos", label: "Videos", description: "Update reference and performance videos", icon: FaVideo },
      { id: "setlists", label: "Setlist", description: "Update where this song should appear", icon: FaListUl },
    ];
    const activeSection = mobileSections.find(({ id }) => id === mobileSection);
    const ActiveSectionIcon = activeSection?.icon;

    return (
      <div className="min-h-screen bg-[#f0f0f0] px-4 pb-28 pt-3">
        <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
          <SnackBar snackbarMessage={snackbarMessage} />
        </div>

        <div className="flex origin-top flex-col">
          <section className="order-0 rounded-[16px] border border-black/5 bg-white/60 px-3 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
            {mobileSection === "home" ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                  {t("songPages.edit")}
                </p>
                <h1 className="mt-0.5 text-[1.2rem] font-bold leading-none tracking-tight text-black">
                  {t("songPages.editSong")}
                </h1>
              </div>
            ) : (
              <div className="grid min-h-11 grid-cols-[44px_minmax(0,1fr)_44px] items-center">
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white text-black shadow-[0_5px_14px_rgba(0,0,0,0.06)]" onClick={() => setMobileSection("home")} aria-label="Back to edit song menu">
                  <FaChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 items-center justify-center gap-2 px-2 text-center">
                  {ActiveSectionIcon ? <ActiveSectionIcon className="h-4 w-4 shrink-0" /> : null}
                  <h1 className="truncate text-[1.05rem] font-black uppercase">{activeSection?.label}</h1>
                </div>
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[goldenrod] text-[10px] font-black text-black shadow-[0_5px_14px_rgba(218,165,32,0.2)] disabled:opacity-40" onClick={pageActions?.onUpdate} disabled={!pageActions?.canUpdate} aria-label="Update song">Save</button>
              </div>
            )}
          </section>

          {mobileSection === "home" ? (
            <div className="order-2">
              <nav className="mt-3 grid grid-cols-2 gap-3" aria-label="Edit song sections">
                {mobileSections.map(({ id, label, description, icon: Icon }) => (
                  <button key={id} type="button" className="relative flex min-h-[112px] w-full flex-col items-start overflow-hidden rounded-[18px] border border-black/5 bg-white/70 p-3 text-left shadow-[0_6px_16px_rgba(0,0,0,0.05)] active:scale-[0.985]" onClick={() => setMobileSection(id)} aria-label={`Open ${label}`}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[goldenrod]/15 text-black"><Icon className="h-4 w-4" /></span>
                    <span className="mt-2 min-w-0 flex-1"><span className="block text-[13px] font-black text-black">{label}</span><span className="mt-1 block text-[10px] font-semibold leading-[0.85rem] text-gray-500">{description}</span></span>
                    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[10px] bg-black/[0.035] text-gray-500"><FaChevronRight className="h-3 w-3" /></span>
                  </button>
                ))}
              </nav>
              <SetlistNavigationButtons previousSetlistSong={previousSetlistSong} nextSetlistSong={nextSetlistSong} onGoToSetlistSong={goToSetlistSong} touchLayout />
              <div className="mt-4 grid grid-cols-[0.72fr_1.28fr] gap-2 border-t border-black/5 pt-4">
                <button className="min-h-11 rounded-[13px] border border-red-200 bg-white text-[11px] font-bold text-red-600" onClick={pageActions?.onDelete}>{t("songPages.delete")}</button>
                <button className="min-h-11 rounded-[13px] bg-[goldenrod] text-[11px] font-black text-black shadow-[0_6px_16px_rgba(218,165,32,0.22)] disabled:opacity-40" onClick={pageActions?.onUpdate} disabled={!pageActions?.canUpdate}>{t("songPages.update")}</button>
              </div>
            </div>
          ) : null}

          <div className="order-1 mt-3 flex flex-col gap-3">
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
              touchSection={mobileSection}
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
              touchSection={mobileSection}
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
              {t("songPages.editSong")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium text-gray-500 ">
              {t("songPages.editSongDescription")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch">
            <div className="flex justify-end gap-3">
              <button
                className="neuphormism-b-btn-red-cancel rounded-[16px] px-6 py-3 text-base font-bold"
                onClick={pageActions?.onDelete}
              >
                {t("songPages.delete")}
              </button>
              <button
                className="neuphormism-b-btn-green-save rounded-[16px] px-8 py-3 text-base font-bold disabled:opacity-50"
                onClick={pageActions?.onUpdate}
                disabled={!pageActions?.canUpdate}
              >
                {t("songPages.update")}
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
