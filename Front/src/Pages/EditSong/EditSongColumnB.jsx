import { useEffect, useState } from "react";
import {
  FaTimes,
  FaDrum,
  FaGuitar,
  FaKeyboard,
  FaMicrophone,
  FaMusic,
} from "react-icons/fa";
import EditSongInputLinkBox from "./EditSongInputLinkBox";

/* eslint-disable react/prop-types */
function EditSongColumnB({
  dataFromAPI,
  progGuitar01,
  setProgGuitar01,
  progGuitar02,
  setProgGuitar02,
  progBass,
  setProgBass,
  progKey,
  setProgKey,
  progDrums,
  setProgDrums,
  progVoice,
  setProgVoice,
  instrumentUpdatersRef,
  setIsDirty,
  setShowSnackBar,
  setSnackbarMessage,
  onLinkAdded,
  touchLayout = false,
}) {
  // Guitar 01
  const [guitar01, setGuitar01] = useState("");

  // Guitar 02
  const [guitar02, setGuitar02] = useState("");

  // Bass
  const [bass, setBass] = useState("");

  // Key
  const [key, setKey] = useState("");

  // Drums
  const [drums, setDrums] = useState("");

  // Voice
  const [voice, setVoice] = useState("");

  useEffect(() => {
    // Verifique se dataFromAPI está definida e possui dados válidos
    if (dataFromAPI && Object.keys(dataFromAPI).length > 0) {
      // console.log("dataFromAPI:", dataFromAPI);
      const parsed = JSON.parse(dataFromAPI);
      // console.log("Parsed dataFromAPI:", parsed);
      // console.log("Parsed dataFromAPI:", parsed.guitar02.link);

      const listaofInstrument = [
        "guitar01",
        "guitar02",
        "bass",
        "key",
        "drums",
        "voice",
      ];

      for (let i = 0; i < listaofInstrument.length; i++) {
        if (parsed[listaofInstrument[i]]) {
          // console.log("Instrumento inválido:", parsed[listaofInstrument[i]]);
          // console.log(
          //   "Link from:",
          //   listaofInstrument[i],
          //   parsed[listaofInstrument[i]].link
          // );
          // console.log(parsed[listaofInstrument[i]].active);
        }
      }

      try {
        // Carregar dados dos instrumentos
        if (parsed.guitar01) {
          setGuitar01(parsed.guitar01.link || "");
          setProgGuitar01(parsed.guitar01.progress || 0);
        }

        if (parsed.guitar02) {
          setGuitar02(parsed.guitar02.link || "");
          setProgGuitar02(parsed.guitar02.progress || 0);
        }

        if (parsed.bass) {
          setBass(parsed.bass.link || "");
          setProgBass(parsed.bass.progress || 0);
        }

        if (parsed.keys) {
          setKey(parsed.keys.link || "");
          setProgKey(parsed.keys.progress || 0);
        }

        if (parsed.drums) {
          setDrums(parsed.drums.link || "");
          setProgDrums(parsed.drums.progress || 0);
        }

        if (parsed.voice) {
          setVoice(parsed.voice.link || "");
          setProgVoice(parsed.voice.progress || 0);
        }
      } catch (error) {
        console.error("Erro ao processar dataFromAPI:", error);
      }
    } else {
      // console.warn("dataFromAPI está vazio ou indefinido:", dataFromAPI);
    }
  }, [dataFromAPI]);

  const notifyInstrument = (instrumentName, payload) => {
    if (!instrumentUpdatersRef?.current) return;
    const updater = instrumentUpdatersRef.current[instrumentName];
    if (!updater) return;
    if (
      Object.prototype.hasOwnProperty.call(payload, "link") &&
      typeof updater.setLink === "function"
    ) {
      updater.setLink(payload.link);
      setIsDirty?.(true);
    }
    if (
      Object.prototype.hasOwnProperty.call(payload, "progress") &&
      typeof updater.setProgress === "function"
    ) {
      updater.setProgress(payload.progress);
      setIsDirty?.(true);
    }
  };

  const [activeInstrument, setActiveInstrument] = useState(null);
  const instrumentCards = [
    { key: "guitar01", label: "Guitar 01", short: "G1", icon: FaGuitar, link: guitar01 },
    { key: "guitar02", label: "Guitar 02", short: "G2", icon: FaGuitar, link: guitar02 },
    { key: "bass", label: "Bass", short: "B", icon: FaMusic, link: bass },
    { key: "keys", label: "Keys", short: "K", icon: FaKeyboard, link: key },
    { key: "drums", label: "Drums", short: "D", icon: FaDrum, link: drums },
    { key: "voice", label: "Voice", short: "V", icon: FaMicrophone, link: voice },
  ];
  const addedCount = instrumentCards.filter((item) => item.link?.trim()).length;

  if (touchLayout) {
    return (
      <div className="mt-4 rounded-[20px] bg-[#e0e0e0] p-3 shadow-[0_10px_18px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.55rem] font-black tracking-tight text-black">Instruments</h2>
          <span className="text-xs font-black uppercase tracking-[0.08em] text-gray-500">
            {addedCount}/6 Added
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {instrumentCards.map(({ key: instrumentKey, label, short, icon: Icon, link: instrumentLink }) => {
            const isOpen = activeInstrument === instrumentKey;
            return (
              <button
                key={instrumentKey}
                type="button"
                className="rounded-[18px] bg-[#f8f8f8] p-3 text-left shadow-[0_6px_16px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveInstrument(isOpen ? null : instrumentKey)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ececec] text-black">
                    <Icon className="text-[14px]" />
                  </div>
                  <span className="text-xs font-black uppercase text-gray-500">{short}</span>
                </div>
                <div className="mt-4 text-[1.15rem] font-black text-black">{label}</div>
                <div className={`mt-1 text-xs font-bold ${instrumentLink ? "text-[#2f6f3e]" : "text-gray-500"}`}>
                  {instrumentLink ? "Link added" : "No URL yet"}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {isOpen ? "Tap to close" : "Tap to add"}
                </div>
              </button>
            );
          })}
        </div>

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
              <div className="[&_.neuphormism-b-btn]:!m-0 [&_.neuphormism-b-btn]:!rounded-[16px] [&_.neuphormism-b-btn]:!bg-transparent [&_.neuphormism-b-btn]:!p-0 [&_.neuphormism-b-btn]:!shadow-none">
                {activeInstrument === "guitar01" ? <EditSongInputLinkBox instrumentName="guitar01" link={guitar01} setInstrument={setGuitar01} progress={progGuitar01} setProgress={setProgGuitar01} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("guitar01", { link: value })} onProgressChange={(value) => notifyInstrument("guitar01", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "guitar02" ? <EditSongInputLinkBox instrumentName="guitar02" link={guitar02} setInstrument={setGuitar02} progress={progGuitar02} setProgress={setProgGuitar02} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("guitar02", { link: value })} onProgressChange={(value) => notifyInstrument("guitar02", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "bass" ? <EditSongInputLinkBox instrumentName="bass" link={bass} setInstrument={setBass} progress={progBass} setProgress={setProgBass} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("bass", { link: value })} onProgressChange={(value) => notifyInstrument("bass", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "keys" ? <EditSongInputLinkBox instrumentName="keys" link={key} setInstrument={setKey} progress={progKey} setProgress={setProgKey} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("keys", { link: value })} onProgressChange={(value) => notifyInstrument("keys", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "drums" ? <EditSongInputLinkBox instrumentName="drums" link={drums} setInstrument={setDrums} progress={progDrums} setProgress={setProgDrums} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("drums", { link: value })} onProgressChange={(value) => notifyInstrument("drums", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
                {activeInstrument === "voice" ? <EditSongInputLinkBox instrumentName="voice" link={voice} setInstrument={setVoice} progress={progVoice} setProgress={setProgVoice} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("voice", { link: value })} onProgressChange={(value) => notifyInstrument("voice", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-row p-5 my-5  neuphormism-b">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Input Links</h1>
        <EditSongInputLinkBox
          instrumentName="guitar01"
          link={guitar01}
          setInstrument={setGuitar01}
          progress={progGuitar01}
          setProgress={setProgGuitar01}
          setVoiceInstrument={setVoice}
          onLinkChange={(value) =>
            notifyInstrument("guitar01", { link: value })
          }
          onProgressChange={(value) =>
            notifyInstrument("guitar01", { progress: value })
          }
          setIsDirty={setIsDirty}
          setShowSnackBar={setShowSnackBar}
          setSnackbarMessage={setSnackbarMessage}
        />
        <EditSongInputLinkBox
          instrumentName="guitar02"
          link={guitar02}
          setInstrument={setGuitar02}
          progress={progGuitar02}
          setProgress={setProgGuitar02}
          setVoiceInstrument={setVoice}
          onLinkChange={(value) =>
            notifyInstrument("guitar02", { link: value })
          }
          onProgressChange={(value) =>
            notifyInstrument("guitar02", { progress: value })
          }
          setIsDirty={setIsDirty}
          setShowSnackBar={setShowSnackBar}
          setSnackbarMessage={setSnackbarMessage}
        />
        <EditSongInputLinkBox
          instrumentName="bass"
          link={bass}
          setInstrument={setBass}
          progress={progBass}
          setProgress={setProgBass}
          setVoiceInstrument={setVoice}
          onLinkChange={(value) => notifyInstrument("bass", { link: value })}
          onProgressChange={(value) =>
            notifyInstrument("bass", { progress: value })
          }
          setIsDirty={setIsDirty}
          setShowSnackBar={setShowSnackBar}
          setSnackbarMessage={setSnackbarMessage}
        />
        <EditSongInputLinkBox
          instrumentName="keys"
          link={key}
          setInstrument={setKey}
          progress={progKey}
          setProgress={setProgKey}
          setVoiceInstrument={setVoice}
          onLinkChange={(value) => notifyInstrument("keys", { link: value })}
          onProgressChange={(value) =>
            notifyInstrument("keys", { progress: value })
          }
          setIsDirty={setIsDirty}
          setShowSnackBar={setShowSnackBar}
          setSnackbarMessage={setSnackbarMessage}
        />
        <EditSongInputLinkBox
          instrumentName="drums"
          link={drums}
          setInstrument={setDrums}
          progress={progDrums}
          setProgress={setProgDrums}
          setVoiceInstrument={setVoice}
          onLinkChange={(value) =>
            notifyInstrument("drums", { link: value })
          }
          onProgressChange={(value) =>
            notifyInstrument("drums", { progress: value })
          }
          setIsDirty={setIsDirty}
          setShowSnackBar={setShowSnackBar}
          setSnackbarMessage={setSnackbarMessage}
        />
        <EditSongInputLinkBox
          instrumentName="voice"
          link={voice}
          setInstrument={setVoice}
          progress={progVoice}
          setProgress={setProgVoice}
          setVoiceInstrument={setVoice}
          onLinkChange={(value) => notifyInstrument("voice", { link: value })}
          onProgressChange={(value) =>
            notifyInstrument("voice", { progress: value })
          }
          setIsDirty={setIsDirty}
          setShowSnackBar={setShowSnackBar}
          setSnackbarMessage={setSnackbarMessage}
        />
      </div>
    </div>
  );
}

export default EditSongColumnB;
