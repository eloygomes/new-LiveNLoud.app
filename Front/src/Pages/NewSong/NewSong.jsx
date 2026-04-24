import { useEffect, useState } from "react";
import NewSongColumnA from "./NewSongColumnA";
import NewSongColumnB from "./NewSongColumnB";
import SnackBar from "../../Tools/SnackBar";
import { requestData } from "../../Tools/Controllers"; // ⬅️ importa do Controllers

function NewSong() {
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
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

  const [guitar02, setGuitar02] = useState("");
  const [progBarG02, setProgBarG02] = useState(0);

  const [bass, setBass] = useState("");
  const [progBarBass, setProgBarBass] = useState(0);

  const [key, setKey] = useState("");
  const [progBarKey, setProgBarKey] = useState(0);

  const [drums, setDrums] = useState("");
  const [progBarDrums, setProgBarDrums] = useState(0);

  const [voice, setVoice] = useState("");
  const [progBarVoice, setProgBarVoice] = useState(0);

  const [dataFromUrl, setDataFromUrl] = useState("");
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
      if (serialized) setDataFromUrl(serialized);
    } catch {
      // erro silencioso
    }
  };

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

        <div className="min-h-screen bg-[#f0f0f0] px-3 pb-28 pt-0">
          <div className="origin-top">
            <div className="neuphormism-b rounded-[28px] px-5 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
                Song Workspace
              </p>
              <div className="text-[1.9rem] font-black tracking-tight text-black">
                NEW SONG
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-500">
                Register the song and its instrument links here.
              </div>
            </div>

            <div className="mt-4">
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
                songDataOpen={songDataOpen}
                onToggleSongData={() => setSongDataOpen((current) => !current)}
                middleContent={
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
                    touchLayout
                  />
                }
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {window.innerWidth <= 926 && window.innerWidth > 426 && (
        <div className="min-h-screen bg-[#f0f0f0] px-4 pb-24 pt-6">
          <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
            <SnackBar snackbarMessage={snackbarMessage} />
          </div>
          <div className="mx-auto w-full max-w-6xl">
            <section className="neuphormism-b rounded-[28px] px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
                  Song Workspace
                </p>
                <h1 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black">
                  Add New Song
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">
                  Register the song, organize setlists, and attach instrument links in one flow.
                </p>
              </div>
            </section>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="left-column min-w-0">
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
                />
              </div>
              <div className="right-column min-w-0">
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
                  gettingSongData={gettingSongData} // mantém prop
                  setShowSnackBar={setShowSnackBar}
                  setSnackbarMessage={setSnackbarMessage}
                  cifraExiste={cifraExiste}
                  setCifraExiste={setCifraExiste}
                  setCifraFROMDB={setCifraFROMDB}
                  cifraFROMDB={cifraFROMDB}
                  artistName={artistName}
                  setArtistName={setArtistName}
                  songName={songName}
                  setSongName={setSongName}
                  setScrapeStatus={handleScrapeStatus}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {window.innerWidth > 926 && (
        <div className="min-h-screen bg-[#f0f0f0] px-6 pb-24 pt-8">
          <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
            <SnackBar snackbarMessage={snackbarMessage} />
          </div>
          <div className="mx-auto w-full max-w-7xl">
            <section className="neuphormism-b rounded-[28px] px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
                  Song Workspace
                </p>
                <h1 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black md:text-[2.6rem]">
                  Add New Song
                </h1>
                <p className="mt-3 max-w-3xl text-base font-medium text-gray-500">
                  Bring the song data, instrument sources, videos, and setlists together without leaving the page.
                </p>
              </div>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
                <div className="left-column min-w-0">
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
                  />
                </div>
                <div className="right-column min-w-0">
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
                    gettingSongData={gettingSongData} // mantém prop
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
                    setScrapeStatus={handleScrapeStatus}
                  />
                </div>
              </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NewSong;
