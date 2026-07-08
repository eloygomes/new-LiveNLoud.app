import { useEffect, useState } from "react";
import NewSongColumnA from "./NewSongColumnA";
import NewSongColumnB from "./NewSongColumnB";
import SnackBar from "../../Tools/SnackBar";
import { requestData } from "../../Tools/Controllers"; // ⬅️ importa do Controllers
import { useLanguage } from "../../contexts/LanguageContext";

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

function NewSong() {
  const { t } = useLanguage();
  const isTouchLayout = getIsSongTouchLayout();
  const [songDataOpen, setSongDataOpen] = useState(true);
  // Column A
  const [artistExtractedFromUrl, setArtistExtractedFromUrl] = useState();
  const [songExtractedFromUrl, setSongExtractedFromUrl] = useState();

  const [artistScrapado, setArtistScrapado] = useState("");
  const [songScrapado, setSongScrapado] = useState("");
  const [cifraExiste, setCifraExiste] = useState("");

  const [artistName, setArtistName] = useState("");
  const [songName, setSongName] = useState("");

  const [cifraFROMDB, setCifraFROMDB] = useState(null);

  // Column B
  const [guitar01, setGuitar01] = useState("");
  const [progBarG01, setProgBarG01] = useState(0);
  const [notesGuitar01, setNotesGuitar01] = useState("");

  const [guitar02, setGuitar02] = useState("");
  const [progBarG02, setProgBarG02] = useState(0);
  const [notesGuitar02, setNotesGuitar02] = useState("");

  const [bass, setBass] = useState("");
  const [progBarBass, setProgBarBass] = useState(0);
  const [notesBass, setNotesBass] = useState("");

  const [key, setKey] = useState("");
  const [progBarKey, setProgBarKey] = useState(0);
  const [notesKey, setNotesKey] = useState("");

  const [drums, setDrums] = useState("");
  const [progBarDrums, setProgBarDrums] = useState(0);
  const [notesDrums, setNotesDrums] = useState("");

  const [voice, setVoice] = useState("");
  const [progBarVoice, setProgBarVoice] = useState(0);
  const [notesVoice, setNotesVoice] = useState("");

  const [dataFromUrl, setDataFromUrl] = useState("");
  const [songData, setSongData] = useState(null);
  const [pageActions, setPageActions] = useState(null);
  const [scrapeStatus, setScrapeStatus] = useState({
    guitar01: false,
    guitar02: false,
    bass: false,
    keys: false,
    drums: false,
    voice: false,
  });

  const userEmail =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  // SnackBar
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });

  // ⬇️ agora usa Controllers.requestData
  const gettingSongData = async () => {
    if (!userEmail) return;
    try {
      const serialized = await requestData(userEmail);
      if (serialized) {
        setDataFromUrl(serialized);
      }
    } catch {
      // erro silencioso
    }
  };

  useEffect(() => {
    try {
      const parsed = JSON.parse(dataFromUrl || "{}");
      const matchedSong = Array.isArray(parsed?.userdata)
        ? parsed.userdata.find(
            (entry) =>
              String(entry.artist || "").trim().toLowerCase() ===
                String(artistName || "").trim().toLowerCase() &&
              String(entry.song || "").trim().toLowerCase() ===
                String(songName || "").trim().toLowerCase(),
          )
        : null;
      setSongData(matchedSong || null);
    } catch {
      setSongData(null);
    }
  }, [artistName, dataFromUrl, songName]);

  useEffect(() => {
    if (guitar01 || guitar02 || bass || key || drums || voice) {
      gettingSongData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guitar01, guitar02, bass, key, drums, voice]);

  const handleScrapeStatus = (instrumentName, status) => {
    setScrapeStatus((prev) => ({
      ...prev,
      [instrumentName]: status,
    }));
  };

  if (isTouchLayout) {
    return (
      <>
        <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
          <SnackBar snackbarMessage={snackbarMessage} />
        </div>

        <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-3">
          <div className="origin-top">
            <section className="neuphormism-b rounded-[22px] px-4 py-4">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                    {t("songPages.plus")}
                  </p>
                  <h1 className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-black">
                    {t("songPages.newSong")}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-gray-500">
                    {t("songPages.newSongDescription")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="neuphormism-b-btn-red-cancel rounded-[14px] px-3 py-2.5 text-sm font-bold"
                    onClick={pageActions?.onDelete}
                  >
                    {t("songPages.delete")}
                  </button>
                  <button
                    className="neuphormism-b-btn-green-save rounded-[14px] px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                    onClick={pageActions?.onSave}
                    disabled={!pageActions?.canSave}
                  >
                    {t("songPages.save")}
                  </button>
                </div>
              </div>
            </section>

            <div className="mt-4 space-y-4">
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
                notesGuitar01={notesGuitar01}
                setNotesGuitar01={setNotesGuitar01}
                progBarG02={progBarG02}
                setProgBarG02={setProgBarG02}
                notesGuitar02={notesGuitar02}
                setNotesGuitar02={setNotesGuitar02}
                progBarBass={progBarBass}
                setProgBarBass={setProgBarBass}
                notesBass={notesBass}
                setNotesBass={setNotesBass}
                progBarKey={progBarKey}
                setProgBarKey={setProgBarKey}
                notesKey={notesKey}
                setNotesKey={setNotesKey}
                progBarDrums={progBarDrums}
                setProgBarDrums={setProgBarDrums}
                notesDrums={notesDrums}
                setNotesDrums={setNotesDrums}
                progBarVoice={progBarVoice}
                setProgBarVoice={setProgBarVoice}
                notesVoice={notesVoice}
                setNotesVoice={setNotesVoice}
                setArtistExtractedFromUrl={setArtistExtractedFromUrl}
                setSongExtractedFromUrl={setSongExtractedFromUrl}
                gettingSongData={gettingSongData}
                setShowSnackBar={setShowSnackBar}
                setSnackbarMessage={setSnackbarMessage}
                dataFromUrl={dataFromUrl}
                setSongScrapado={setSongScrapado}
                setArtistScrapado={setArtistScrapado}
                cifraExiste={cifraExiste}
                setCifraExiste={setCifraExiste}
                setCifraFROMDB={setCifraFROMDB}
                cifraFROMDB={cifraFROMDB}
                artistName={artistName}
                setArtistName={setArtistName}
                songName={songName}
                setSongName={setSongName}
                setScrapeStatus={handleScrapeStatus}
                onLinkAdded={() => setSongDataOpen(true)}
                songData={songData}
                onSongDataChange={setSongData}
                onPageActionsChange={setPageActions}
                touchLayout
              />
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
                scrapeStatus={scrapeStatus}
                touchLayout
                touchInlineMedia
                songDataOpen={songDataOpen}
                onToggleSongData={() => setSongDataOpen((current) => !current)}
                songData={songData}
                onSongDataChange={setSongData}
                onPageActionsChange={setPageActions}
              />
            </div>
          </div>
        </div>
      </>
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
                  {t("songPages.newSong")}
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-medium text-gray-500 ">
                  {t("songPages.newSongDescription")}
                </p>
              </div>
              <div className="flex shrink-0 justify-end gap-3">
                <button
                  className="neuphormism-b-btn-red-cancel rounded-[16px] px-6 py-3 text-base font-bold"
                  onClick={pageActions?.onDelete}
                >
                  {t("songPages.delete")}
                </button>
                <button
                  className="neuphormism-b-btn-green-save rounded-[16px] px-8 py-3 text-base font-bold disabled:opacity-50"
                  onClick={pageActions?.onSave}
                  disabled={!pageActions?.canSave}
                >
                  {t("songPages.save")}
                </button>
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-1">
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
                notesGuitar01={notesGuitar01}
                setNotesGuitar01={setNotesGuitar01}
                progBarG02={progBarG02}
                setProgBarG02={setProgBarG02}
                notesGuitar02={notesGuitar02}
                setNotesGuitar02={setNotesGuitar02}
                progBarBass={progBarBass}
                setProgBarBass={setProgBarBass}
                notesBass={notesBass}
                setNotesBass={setNotesBass}
                progBarKey={progBarKey}
                setProgBarKey={setProgBarKey}
                notesKey={notesKey}
                setNotesKey={setNotesKey}
                progBarDrums={progBarDrums}
                setProgBarDrums={setProgBarDrums}
                notesDrums={notesDrums}
                setNotesDrums={setNotesDrums}
                progBarVoice={progBarVoice}
                setProgBarVoice={setProgBarVoice}
                notesVoice={notesVoice}
                setNotesVoice={setNotesVoice}
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
                artistName={artistName}
                setArtistName={setArtistName}
                songName={songName}
                setSongName={setSongName}
                cifraExiste={cifraExiste}
                setCifraExiste={setCifraExiste}
                setCifraFROMDB={setCifraFROMDB}
                cifraFROMDB={cifraFROMDB}
                setScrapeStatus={handleScrapeStatus}
                onLinkAdded={gettingSongData}
                songData={songData}
                onSongDataChange={setSongData}
              />
              <div className="min-w-0">
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
                  cifraExiste={cifraExiste}
                  setCifraFROMDB={setCifraFROMDB}
                  cifraFROMDB={cifraFROMDB}
                  setShowSnackBar={setShowSnackBar}
                  setSnackbarMessage={setSnackbarMessage}
                  scrapeStatus={scrapeStatus}
                  songData={songData}
                  onSongDataChange={setSongData}
                  onPageActionsChange={setPageActions}
                />
              </div>
            </div>
          </div>
        </div>
  );
}

export default NewSong;
