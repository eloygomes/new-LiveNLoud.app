/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaDrum,
  FaGuitar,
  FaKeyboard,
  FaMicrophone,
  FaMusic,
} from "react-icons/fa";
import NewSongInputLinkBox from "./NewSongInputLinkBox";

function NewSongColumnB({
  guitar01,
  setGuitar01,
  guitar02,
  setGuitar02,
  bass,
  setBass,
  keyboard,
  setKey,
  drums,
  setDrums,
  voice,
  setVoice,
  progBarG01, // Corrigindo nomes das propriedades
  setProgBarG01,
  progBarG02,
  setProgBarG02,
  progBarBass,
  setProgBarBass,
  progBarKey,
  setProgBarKey,
  progBarDrums,
  setProgBarDrums,
  progBarVoice,
  setProgBarVoice,
  setArtistExtractedFromUrl,
  setSongExtractedFromUrl,
  gettingSongData,
  setShowSnackBar,
  setSnackbarMessage,
  dataFromUrl,
  setSongScrapado,
  setArtistScrapado,
  cifraExiste,
  setCifraExiste,
  setCifraFROMDB,
  cifraFROMDB,
  artistName,
  setArtistName,
  songName,
  setSongName,
  setScrapeStatus,
  onLinkAdded,
  touchLayout = false,
}) {
  const [activeInstrument, setActiveInstrument] = useState(null);
  const [touchInstrumentsOpen, setTouchInstrumentsOpen] = useState(false);

  const instrumentCards = [
    { key: "guitar01", label: "Guitar 01", short: "G1", icon: FaGuitar, link: guitar01 },
    { key: "guitar02", label: "Guitar 02", short: "G2", icon: FaGuitar, link: guitar02 },
    { key: "bass", label: "Bass", short: "B", icon: FaMusic, link: bass },
    { key: "keys", label: "Keys", short: "K", icon: FaKeyboard, link: keyboard },
    { key: "drums", label: "Drums", short: "D", icon: FaDrum, link: drums },
    { key: "voice", label: "Voice", short: "V", icon: FaMicrophone, link: voice },
  ];
  const addedCount = instrumentCards.filter((item) => item.link?.trim()).length;

  if (touchLayout) {
    return (
      <div className="mt-4 rounded-[20px] neuphormism-b p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setTouchInstrumentsOpen((current) => !current)}
        >
          <div className="text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
              Song Workspace
            </p>
            <h2 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black">Input Links</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-gray-500">
              {addedCount}/6 Added
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full neuphormism-b-avatar text-black">
              {touchInstrumentsOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
            </span>
          </div>
        </button>

        {touchInstrumentsOpen ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {instrumentCards.map(({ key, label, short, icon: Icon, link }) => {
              const isOpen = activeInstrument === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="rounded-[18px] neuphormism-b-se p-3 text-left"
                  onClick={() => setActiveInstrument(isOpen ? null : key)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full neuphormism-b-avatar text-black">
                      <Icon className="text-[14px]" />
                    </div>
                    <span className="text-xs font-black uppercase text-gray-500">{short}</span>
                  </div>
                  <div className="mt-4 text-[1.15rem] font-black text-black">{label}</div>
                  <div className={`mt-1 text-xs font-bold ${link ? "text-[#2f6f3e]" : "text-gray-500"}`}>
                    {link ? "Link added" : "No URL yet"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {isOpen ? "Tap to close" : "Tap to add"}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {activeInstrument ? (
          <div className="fixed inset-0 z-[110] bg-black/25">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setActiveInstrument(null)}
              aria-label="Close instrument modal"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-[2rem] font-black tracking-tight text-black">
                    {instrumentCards.find((item) => item.key === activeInstrument)?.label}
                  </div>
                  <div className="mt-1 max-w-[18rem] text-sm font-medium text-gray-500">
                    Insert the URL that will be scraped for this instrument.
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                  onClick={() => setActiveInstrument(null)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="[&_.neuphormism-b]:!m-0 [&_.neuphormism-b]:!rounded-[16px] [&_.neuphormism-b]:!bg-transparent [&_.neuphormism-b]:!p-0 [&_.neuphormism-b]:!shadow-none">
                {activeInstrument === "guitar01" ? (
                  <NewSongInputLinkBox
                    instrumentName="guitar01"
                    instrument={guitar01}
                    setInstrument={setGuitar01}
                    setVoiceInstrument={setVoice}
                    progress={progBarG01}
                    setProgress={setProgBarG01}
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
                    setScrapeStatus={setScrapeStatus}
                    onLinkAdded={onLinkAdded}
                  />
                ) : null}
                {activeInstrument === "guitar02" ? <NewSongInputLinkBox instrumentName="guitar02" instrument={guitar02} setInstrument={setGuitar02} setVoiceInstrument={setVoice} progress={progBarG02} setProgress={setProgBarG02} setArtistExtractedFromUrl={setArtistExtractedFromUrl} setSongExtractedFromUrl={setSongExtractedFromUrl} gettingSongData={gettingSongData} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} dataFromUrl={dataFromUrl} setSongScrapado={setSongScrapado} setArtistScrapado={setArtistScrapado} cifraExiste={cifraExiste} setCifraExiste={setCifraExiste} setCifraFROMDB={setCifraFROMDB} cifraFROMDB={cifraFROMDB} artistName={artistName} setArtistName={setArtistName} songName={songName} setSongName={setSongName} setScrapeStatus={setScrapeStatus} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "bass" ? <NewSongInputLinkBox instrumentName="bass" instrument={bass} setInstrument={setBass} setVoiceInstrument={setVoice} progress={progBarBass} setProgress={setProgBarBass} setArtistExtractedFromUrl={setArtistExtractedFromUrl} setSongExtractedFromUrl={setSongExtractedFromUrl} gettingSongData={gettingSongData} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} dataFromUrl={dataFromUrl} setSongScrapado={setSongScrapado} setArtistScrapado={setArtistScrapado} cifraExiste={cifraExiste} setCifraExiste={setCifraExiste} setCifraFROMDB={setCifraFROMDB} cifraFROMDB={cifraFROMDB} artistName={artistName} setArtistName={setArtistName} songName={songName} setSongName={setSongName} setScrapeStatus={setScrapeStatus} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "keys" ? <NewSongInputLinkBox instrumentName="keys" instrument={keyboard} setInstrument={setKey} setVoiceInstrument={setVoice} progress={progBarKey} setProgress={setProgBarKey} setArtistExtractedFromUrl={setArtistExtractedFromUrl} setSongExtractedFromUrl={setSongExtractedFromUrl} gettingSongData={gettingSongData} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} dataFromUrl={dataFromUrl} setSongScrapado={setSongScrapado} setArtistScrapado={setArtistScrapado} cifraExiste={cifraExiste} setCifraExiste={setCifraExiste} setCifraFROMDB={setCifraFROMDB} cifraFROMDB={cifraFROMDB} artistName={artistName} setArtistName={setArtistName} songName={songName} setSongName={setSongName} setScrapeStatus={setScrapeStatus} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "drums" ? <NewSongInputLinkBox instrumentName="drums" instrument={drums} setInstrument={setDrums} setVoiceInstrument={setVoice} progress={progBarDrums} setProgress={setProgBarDrums} setArtistExtractedFromUrl={setArtistExtractedFromUrl} setSongExtractedFromUrl={setSongExtractedFromUrl} gettingSongData={gettingSongData} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} dataFromUrl={dataFromUrl} setSongScrapado={setSongScrapado} setArtistScrapado={setArtistScrapado} cifraExiste={cifraExiste} setCifraExiste={setCifraExiste} setCifraFROMDB={setCifraFROMDB} cifraFROMDB={cifraFROMDB} artistName={artistName} setArtistName={setArtistName} songName={songName} setSongName={setSongName} setScrapeStatus={setScrapeStatus} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "voice" ? <NewSongInputLinkBox instrumentName="voice" instrument={voice} setInstrument={setVoice} setVoiceInstrument={setVoice} progress={progBarVoice} setProgress={setProgBarVoice} setArtistExtractedFromUrl={setArtistExtractedFromUrl} setSongExtractedFromUrl={setSongExtractedFromUrl} gettingSongData={gettingSongData} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} dataFromUrl={dataFromUrl} setSongScrapado={setSongScrapado} setArtistScrapado={setArtistScrapado} cifraExiste={cifraExiste} setCifraExiste={setCifraExiste} setCifraFROMDB={setCifraFROMDB} cifraFROMDB={cifraFROMDB} artistName={artistName} setArtistName={setArtistName} songName={songName} setSongName={setSongName} setScrapeStatus={setScrapeStatus} onLinkAdded={onLinkAdded} /> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-row p-5 my-5 neuphormism-b rounded-[30px]">
      <div className="flex flex-col w-full">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
          Song Workspace
        </p>
        <h1 className="mt-2 text-[1.9rem] font-black leading-none tracking-tight text-black">Input Links</h1>
        <NewSongInputLinkBox
          instrumentName="guitar01"
          instrument={guitar01} // Corrigido aqui
          setInstrument={setGuitar01}
          setVoiceInstrument={setVoice}
          progress={progBarG01} // Corrigido aqui
          setProgress={setProgBarG01}
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
          setScrapeStatus={setScrapeStatus}
        />
        <NewSongInputLinkBox
          instrumentName="guitar02"
          instrument={guitar02} // Corrigido aqui
          setInstrument={setGuitar02}
          setVoiceInstrument={setVoice}
          progress={progBarG02} // Corrigido aqui
          setProgress={setProgBarG02}
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
          setScrapeStatus={setScrapeStatus}
        />
        <NewSongInputLinkBox
          instrumentName="bass"
          instrument={bass} // Corrigido aqui
          setInstrument={setBass}
          setVoiceInstrument={setVoice}
          progress={progBarBass} // Corrigido aqui
          setProgress={setProgBarBass}
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
          setScrapeStatus={setScrapeStatus}
        />
        <NewSongInputLinkBox
          instrumentName="keys"
          instrument={keyboard} // Corrigido aqui
          setInstrument={setKey}
          setVoiceInstrument={setVoice}
          progress={progBarKey} // Corrigido aqui
          setProgress={setProgBarKey}
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
          setScrapeStatus={setScrapeStatus}
        />
        <NewSongInputLinkBox
          instrumentName="drums"
          instrument={drums} // Corrigido aqui
          setInstrument={setDrums}
          setVoiceInstrument={setVoice}
          progress={progBarDrums} // Corrigido aqui
          setProgress={setProgBarDrums}
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
          setScrapeStatus={setScrapeStatus}
        />
        <NewSongInputLinkBox
          instrumentName="voice"
          instrument={voice} // Corrigido aqui
          setInstrument={setVoice}
          setVoiceInstrument={setVoice}
          progress={progBarVoice} // Corrigido aqui
          setProgress={setProgBarVoice}
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
          setScrapeStatus={setScrapeStatus}
        />
      </div>
    </div>
  );
}

export default NewSongColumnB;
