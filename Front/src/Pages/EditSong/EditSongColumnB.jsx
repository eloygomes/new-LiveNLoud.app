// import { useEffect, useState } from "react";
// import {
//   FaChevronDown,
//   FaChevronUp,
//   FaTimes,
//   FaDrum,
//   FaGuitar,
//   FaKeyboard,
//   FaMicrophone,
//   FaMusic,
// } from "react-icons/fa";
// import EditSongInputLinkBox from "./EditSongInputLinkBox";

// /* eslint-disable react/prop-types */
// function EditSongColumnB({
//   dataFromAPI,
//   progGuitar01,
//   setProgGuitar01,
//   progGuitar02,
//   setProgGuitar02,
//   progBass,
//   setProgBass,
//   progKey,
//   setProgKey,
//   progDrums,
//   setProgDrums,
//   progVoice,
//   setProgVoice,
//   instrumentUpdatersRef,
//   setIsDirty,
//   setShowSnackBar,
//   setSnackbarMessage,
//   onLinkAdded,
//   touchLayout = false,
// }) {
//   // Guitar 01
//   const [guitar01, setGuitar01] = useState("");

//   // Guitar 02
//   const [guitar02, setGuitar02] = useState("");

//   // Bass
//   const [bass, setBass] = useState("");

//   // Key
//   const [key, setKey] = useState("");

//   // Drums
//   const [drums, setDrums] = useState("");

//   // Voice
//   const [voice, setVoice] = useState("");

//   useEffect(() => {
//     // Verifique se dataFromAPI está definida e possui dados válidos
//     if (dataFromAPI && Object.keys(dataFromAPI).length > 0) {
//       // console.log("dataFromAPI:", dataFromAPI);
//       const parsed = JSON.parse(dataFromAPI);
//       // console.log("Parsed dataFromAPI:", parsed);
//       // console.log("Parsed dataFromAPI:", parsed.guitar02.link);

//       const listaofInstrument = [
//         "guitar01",
//         "guitar02",
//         "bass",
//         "key",
//         "drums",
//         "voice",
//       ];

//       for (let i = 0; i < listaofInstrument.length; i++) {
//         if (parsed[listaofInstrument[i]]) {
//           // console.log("Instrumento inválido:", parsed[listaofInstrument[i]]);
//           // console.log(
//           //   "Link from:",
//           //   listaofInstrument[i],
//           //   parsed[listaofInstrument[i]].link
//           // );
//           // console.log(parsed[listaofInstrument[i]].active);
//         }
//       }

//       try {
//         // Carregar dados dos instrumentos
//         if (parsed.guitar01) {
//           setGuitar01(parsed.guitar01.link || "");
//           setProgGuitar01(parsed.guitar01.progress || 0);
//         }

//         if (parsed.guitar02) {
//           setGuitar02(parsed.guitar02.link || "");
//           setProgGuitar02(parsed.guitar02.progress || 0);
//         }

//         if (parsed.bass) {
//           setBass(parsed.bass.link || "");
//           setProgBass(parsed.bass.progress || 0);
//         }

//         if (parsed.keys) {
//           setKey(parsed.keys.link || "");
//           setProgKey(parsed.keys.progress || 0);
//         }

//         if (parsed.drums) {
//           setDrums(parsed.drums.link || "");
//           setProgDrums(parsed.drums.progress || 0);
//         }

//         if (parsed.voice) {
//           setVoice(parsed.voice.link || "");
//           setProgVoice(parsed.voice.progress || 0);
//         }
//       } catch (error) {
//         console.error("Erro ao processar dataFromAPI:", error);
//       }
//     } else {
//       // console.warn("dataFromAPI está vazio ou indefinido:", dataFromAPI);
//     }
//   }, [dataFromAPI]);

//   const notifyInstrument = (instrumentName, payload) => {
//     if (!instrumentUpdatersRef?.current) return;
//     const updater = instrumentUpdatersRef.current[instrumentName];
//     if (!updater) return;
//     if (
//       Object.prototype.hasOwnProperty.call(payload, "link") &&
//       typeof updater.setLink === "function"
//     ) {
//       updater.setLink(payload.link);
//       setIsDirty?.(true);
//     }
//     if (
//       Object.prototype.hasOwnProperty.call(payload, "progress") &&
//       typeof updater.setProgress === "function"
//     ) {
//       updater.setProgress(payload.progress);
//       setIsDirty?.(true);
//     }
//   };

//   const [activeInstrument, setActiveInstrument] = useState(null);
//   const [touchInstrumentsOpen, setTouchInstrumentsOpen] = useState(false);
//   const instrumentCards = [
//     { key: "guitar01", label: "Guitar 01", short: "G1", icon: FaGuitar, link: guitar01 },
//     { key: "guitar02", label: "Guitar 02", short: "G2", icon: FaGuitar, link: guitar02 },
//     { key: "bass", label: "Bass", short: "B", icon: FaMusic, link: bass },
//     { key: "keys", label: "Keys", short: "K", icon: FaKeyboard, link: key },
//     { key: "drums", label: "Drums", short: "D", icon: FaDrum, link: drums },
//     { key: "voice", label: "Voice", short: "V", icon: FaMicrophone, link: voice },
//   ];
//   const addedCount = instrumentCards.filter((item) => item.link?.trim()).length;

//   if (touchLayout) {
//     return (
//       <div className="mt-4 rounded-[20px] neuphormism-b p-3">
//         <button
//           type="button"
//           className="flex w-full items-center justify-between"
//           onClick={() => setTouchInstrumentsOpen((current) => !current)}
//         >
//           <div className="text-left">
//             <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
//               Song Workspace
//             </p>
//             <h2 className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black">Input Links</h2>
//           </div>
//           <div className="flex items-center gap-3">
//             <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
//               {addedCount}/6 Added
//             </span>
//             <span className="flex h-8 w-8 items-center justify-center rounded-full neuphormism-b-avatar text-black">
//               {touchInstrumentsOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
//             </span>
//           </div>
//         </button>

//         {touchInstrumentsOpen ? (
//           <div className="mt-4 grid grid-cols-2 gap-3">
//             {instrumentCards.map(({ key: instrumentKey, label, short, icon: Icon, link: instrumentLink }) => {
//               const isOpen = activeInstrument === instrumentKey;
//               return (
//                 <button
//                   key={instrumentKey}
//                   type="button"
//                   className="rounded-[18px] neuphormism-b-se p-3 text-left"
//                   onClick={() => setActiveInstrument(isOpen ? null : instrumentKey)}
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex h-9 w-9 items-center justify-center rounded-full neuphormism-b-avatar text-black">
//                       <Icon className="text-[14px]" />
//                     </div>
//                     <span className="text-xs font-bold uppercase text-gray-500">{short}</span>
//                   </div>
//                   <div className="mt-4 text-[1.15rem] font-bold text-black">{label}</div>
//                   <div className={`mt-1 text-xs font-bold ${instrumentLink ? "text-[#2f6f3e]" : "text-gray-500"}`}>
//                     {instrumentLink ? "Link added" : "No URL yet"}
//                   </div>
//                   <div className="mt-1 text-xs text-gray-500">
//                     {isOpen ? "Tap to close" : "Tap to add"}
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         ) : null}

//         {activeInstrument ? (
//           <div className="fixed inset-0 z-[110] bg-black/25">
//             <button
//               type="button"
//               className="absolute inset-0 h-full w-full cursor-default"
//               onClick={() => setActiveInstrument(null)}
//               aria-label="Close instrument modal"
//             />
//             <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
//               <div className="mb-4 flex items-start justify-between">
//                 <div>
//                   <div className="text-[2rem] font-bold tracking-tight text-black">
//                     {instrumentCards.find((item) => item.key === activeInstrument)?.label}
//                   </div>
//                   <div className="mt-1 max-w-[18rem] text-sm font-medium text-gray-500">
//                     Insert the URL that will be scraped for this instrument.
//                   </div>
//                 </div>
//                 <button
//                   type="button"
//                   className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
//                   onClick={() => setActiveInstrument(null)}
//                 >
//                   <FaTimes />
//                 </button>
//               </div>
//               <div className="[&_.neuphormism-b-btn]:!m-0 [&_.neuphormism-b-btn]:!rounded-[16px] [&_.neuphormism-b-btn]:!bg-transparent [&_.neuphormism-b-btn]:!p-0 [&_.neuphormism-b-btn]:!shadow-none">
//                 {activeInstrument === "guitar01" ? <EditSongInputLinkBox instrumentName="guitar01" link={guitar01} setInstrument={setGuitar01} progress={progGuitar01} setProgress={setProgGuitar01} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("guitar01", { link: value })} onProgressChange={(value) => notifyInstrument("guitar01", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
//                 {activeInstrument === "guitar02" ? <EditSongInputLinkBox instrumentName="guitar02" link={guitar02} setInstrument={setGuitar02} progress={progGuitar02} setProgress={setProgGuitar02} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("guitar02", { link: value })} onProgressChange={(value) => notifyInstrument("guitar02", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
//                 {activeInstrument === "bass" ? <EditSongInputLinkBox instrumentName="bass" link={bass} setInstrument={setBass} progress={progBass} setProgress={setProgBass} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("bass", { link: value })} onProgressChange={(value) => notifyInstrument("bass", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
//                 {activeInstrument === "keys" ? <EditSongInputLinkBox instrumentName="keys" link={key} setInstrument={setKey} progress={progKey} setProgress={setProgKey} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("keys", { link: value })} onProgressChange={(value) => notifyInstrument("keys", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
//                 {activeInstrument === "drums" ? <EditSongInputLinkBox instrumentName="drums" link={drums} setInstrument={setDrums} progress={progDrums} setProgress={setProgDrums} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("drums", { link: value })} onProgressChange={(value) => notifyInstrument("drums", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
//                 {activeInstrument === "voice" ? <EditSongInputLinkBox instrumentName="voice" link={voice} setInstrument={setVoice} progress={progVoice} setProgress={setProgVoice} setVoiceInstrument={setVoice} onLinkChange={(value) => notifyInstrument("voice", { link: value })} onProgressChange={(value) => notifyInstrument("voice", { progress: value })} setIsDirty={setIsDirty} setShowSnackBar={setShowSnackBar} setSnackbarMessage={setSnackbarMessage} onLinkAdded={onLinkAdded} /> : null}
//               </div>
//             </div>
//           </div>
//         ) : null}
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-row p-5 my-5 neuphormism-b rounded-[30px]">
//       <div className="flex flex-col w-full">
//         <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
//           Song Workspace
//         </p>
//         <h1 className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black">Input Links</h1>
//         <EditSongInputLinkBox
//           instrumentName="guitar01"
//           link={guitar01}
//           setInstrument={setGuitar01}
//           progress={progGuitar01}
//           setProgress={setProgGuitar01}
//           setVoiceInstrument={setVoice}
//           onLinkChange={(value) =>
//             notifyInstrument("guitar01", { link: value })
//           }
//           onProgressChange={(value) =>
//             notifyInstrument("guitar01", { progress: value })
//           }
//           setIsDirty={setIsDirty}
//           setShowSnackBar={setShowSnackBar}
//           setSnackbarMessage={setSnackbarMessage}
//         />
//         <EditSongInputLinkBox
//           instrumentName="guitar02"
//           link={guitar02}
//           setInstrument={setGuitar02}
//           progress={progGuitar02}
//           setProgress={setProgGuitar02}
//           setVoiceInstrument={setVoice}
//           onLinkChange={(value) =>
//             notifyInstrument("guitar02", { link: value })
//           }
//           onProgressChange={(value) =>
//             notifyInstrument("guitar02", { progress: value })
//           }
//           setIsDirty={setIsDirty}
//           setShowSnackBar={setShowSnackBar}
//           setSnackbarMessage={setSnackbarMessage}
//         />
//         <EditSongInputLinkBox
//           instrumentName="bass"
//           link={bass}
//           setInstrument={setBass}
//           progress={progBass}
//           setProgress={setProgBass}
//           setVoiceInstrument={setVoice}
//           onLinkChange={(value) => notifyInstrument("bass", { link: value })}
//           onProgressChange={(value) =>
//             notifyInstrument("bass", { progress: value })
//           }
//           setIsDirty={setIsDirty}
//           setShowSnackBar={setShowSnackBar}
//           setSnackbarMessage={setSnackbarMessage}
//         />
//         <EditSongInputLinkBox
//           instrumentName="keys"
//           link={key}
//           setInstrument={setKey}
//           progress={progKey}
//           setProgress={setProgKey}
//           setVoiceInstrument={setVoice}
//           onLinkChange={(value) => notifyInstrument("keys", { link: value })}
//           onProgressChange={(value) =>
//             notifyInstrument("keys", { progress: value })
//           }
//           setIsDirty={setIsDirty}
//           setShowSnackBar={setShowSnackBar}
//           setSnackbarMessage={setSnackbarMessage}
//         />
//         <EditSongInputLinkBox
//           instrumentName="drums"
//           link={drums}
//           setInstrument={setDrums}
//           progress={progDrums}
//           setProgress={setProgDrums}
//           setVoiceInstrument={setVoice}
//           onLinkChange={(value) =>
//             notifyInstrument("drums", { link: value })
//           }
//           onProgressChange={(value) =>
//             notifyInstrument("drums", { progress: value })
//           }
//           setIsDirty={setIsDirty}
//           setShowSnackBar={setShowSnackBar}
//           setSnackbarMessage={setSnackbarMessage}
//         />
//         <EditSongInputLinkBox
//           instrumentName="voice"
//           link={voice}
//           setInstrument={setVoice}
//           progress={progVoice}
//           setProgress={setProgVoice}
//           setVoiceInstrument={setVoice}
//           onLinkChange={(value) => notifyInstrument("voice", { link: value })}
//           onProgressChange={(value) =>
//             notifyInstrument("voice", { progress: value })
//           }
//           setIsDirty={setIsDirty}
//           setShowSnackBar={setShowSnackBar}
//           setSnackbarMessage={setSnackbarMessage}
//         />
//       </div>
//     </div>
//   );
// }

// export default EditSongColumnB;

/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaTimes,
  FaDrum,
  FaGuitar,
  FaKeyboard,
  FaMicrophone,
  FaMusic,
  FaRegStickyNote,
} from "react-icons/fa";

import EditSongInputLinkBox from "./EditSongInputLinkBox";
import { useLanguage } from "../../contexts/LanguageContext";

const INSTRUMENTS = [
  {
    key: "guitar01",
    label: "Guitar 01",
    short: "G1",
    icon: FaGuitar,
    instrumentName: "guitar01",
    stateName: "guitar01",
    setterName: "setGuitar01",
    progressName: "progGuitar01",
    progressSetterName: "setProgGuitar01",
    notesName: "notesGuitar01",
    notesSetterName: "setNotesGuitar01",
    apiKey: "guitar01",
  },
  {
    key: "guitar02",
    label: "Guitar 02",
    short: "G2",
    icon: FaGuitar,
    instrumentName: "guitar02",
    stateName: "guitar02",
    setterName: "setGuitar02",
    progressName: "progGuitar02",
    progressSetterName: "setProgGuitar02",
    notesName: "notesGuitar02",
    notesSetterName: "setNotesGuitar02",
    apiKey: "guitar02",
  },
  {
    key: "bass",
    label: "Bass",
    short: "B",
    icon: FaMusic,
    instrumentName: "bass",
    stateName: "bass",
    setterName: "setBass",
    progressName: "progBass",
    progressSetterName: "setProgBass",
    notesName: "notesBass",
    notesSetterName: "setNotesBass",
    apiKey: "bass",
  },
  {
    key: "keys",
    label: "Keys",
    short: "K",
    icon: FaKeyboard,
    instrumentName: "keys",
    stateName: "key",
    setterName: "setKey",
    progressName: "progKey",
    progressSetterName: "setProgKey",
    notesName: "notesKey",
    notesSetterName: "setNotesKey",
    apiKey: "keys",
  },
  {
    key: "drums",
    label: "Drums",
    short: "D",
    icon: FaDrum,
    instrumentName: "drums",
    stateName: "drums",
    setterName: "setDrums",
    progressName: "progDrums",
    progressSetterName: "setProgDrums",
    notesName: "notesDrums",
    notesSetterName: "setNotesDrums",
    apiKey: "drums",
  },
  {
    key: "voice",
    label: "Voice",
    short: "V",
    icon: FaMicrophone,
    instrumentName: "voice",
    stateName: "voice",
    setterName: "setVoice",
    progressName: "progVoice",
    progressSetterName: "setProgVoice",
    notesName: "notesVoice",
    notesSetterName: "setNotesVoice",
    apiKey: "voice",
  },
];

function EditSongColumnB(props) {
  const [guitar01, setGuitar01] = useState("");
  const [guitar02, setGuitar02] = useState("");
  const [bass, setBass] = useState("");
  const [key, setKey] = useState("");
  const [drums, setDrums] = useState("");
  const [voice, setVoice] = useState("");
  const [notesGuitar01, setNotesGuitar01] = useState("");
  const [notesGuitar02, setNotesGuitar02] = useState("");
  const [notesBass, setNotesBass] = useState("");
  const [notesKey, setNotesKey] = useState("");
  const [notesDrums, setNotesDrums] = useState("");
  const [notesVoice, setNotesVoice] = useState("");

  const instrumentState = {
    guitar01,
    guitar02,
    bass,
    key,
    drums,
    voice,
    notesGuitar01,
    notesGuitar02,
    notesBass,
    notesKey,
    notesDrums,
    notesVoice,
  };

  const instrumentSetters = useMemo(
    () => ({
      setGuitar01,
      setGuitar02,
      setBass,
      setKey,
      setDrums,
      setVoice,
      setNotesGuitar01,
      setNotesGuitar02,
      setNotesBass,
      setNotesKey,
      setNotesDrums,
      setNotesVoice,
    }),
    [],
  );

  const componentProps = {
    ...props,
    ...instrumentState,
    ...instrumentSetters,
  };
  const safeComponentProps = { ...componentProps };
  delete safeComponentProps.key;

  useEffect(() => {
    if (!props.dataFromAPI || Object.keys(props.dataFromAPI).length === 0) {
      return;
    }

    try {
      const parsedData = JSON.parse(props.dataFromAPI);

      loadInstrumentData({
        parsedData,
        setGuitar01,
        setGuitar02,
        setBass,
        setKey,
        setDrums,
        setVoice,
        setNotesGuitar01,
        setNotesGuitar02,
        setNotesBass,
        setNotesKey,
        setNotesDrums,
        setNotesVoice,
        setProgGuitar01: props.setProgGuitar01,
        setProgGuitar02: props.setProgGuitar02,
        setProgBass: props.setProgBass,
        setProgKey: props.setProgKey,
        setProgDrums: props.setProgDrums,
        setProgVoice: props.setProgVoice,
      });
    } catch (error) {
      console.error("Erro ao processar dataFromAPI:", error);
    }
  }, [props.dataFromAPI]);

  if (props.touchLayout) {
    return <EditSongColumnBMobile {...safeComponentProps} />;
  }

  return <EditSongColumnBWeb {...safeComponentProps} />;
}

function EditSongColumnBWeb(props) {
  const [activeInstrument, setActiveInstrument] = useState(null);
  const instrumentCards = INSTRUMENTS.map((instrumentConfig) => ({
    ...instrumentConfig,
    link: props[instrumentConfig.stateName],
    notes: props[instrumentConfig.notesName],
    progress: props[instrumentConfig.progressName],
  }));
  const activeInstrumentConfig = instrumentCards.find(
    (item) => item.key === activeInstrument,
  );

  return (
    <div className="my-5 flex flex-row rounded-[30px] neuphormism-b p-5">
      <div className="flex w-full flex-col">
        <SectionHeader />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {instrumentCards.map((instrumentCard) => (
            <InstrumentCard
              key={instrumentCard.key}
              card={instrumentCard}
              isOpen={activeInstrument === instrumentCard.key}
              onClick={() => setActiveInstrument(instrumentCard.key)}
            />
          ))}
        </div>
        {activeInstrumentConfig ? (
          <InstrumentModal
            config={activeInstrumentConfig}
            props={props}
            onClose={() => setActiveInstrument(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

function EditSongColumnBMobile(props) {
  const [activeInstrument, setActiveInstrument] = useState(null);
  const [touchInstrumentsOpen, setTouchInstrumentsOpen] = useState(true);

  const instrumentCards = useMemo(
    () =>
      INSTRUMENTS.map((instrumentConfig) => ({
        ...instrumentConfig,
        link: props[instrumentConfig.stateName],
        notes: props[instrumentConfig.notesName],
        progress: props[instrumentConfig.progressName],
      })),
    [props],
  );

  const addedCount = instrumentCards.filter((item) => item.link?.trim()).length;

  const activeInstrumentConfig = instrumentCards.find(
    (item) => item.key === activeInstrument,
  );

  function toggleInstrument(instrumentKey) {
    setActiveInstrument((currentInstrument) =>
      currentInstrument === instrumentKey ? null : instrumentKey,
    );
  }

  function closeInstrumentModal() {
    setActiveInstrument(null);
  }

  return (
    <div className={`${props.touchSection && props.touchSection !== "links" ? "hidden" : "block"} order-2 rounded-[18px] border border-black/5 bg-white/60 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]`}>
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setTouchInstrumentsOpen((current) => !current)}
      >
        <SectionHeader />

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
            {addedCount}/6 Added
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-full neuphormism-b-avatar text-black">
            {touchInstrumentsOpen ? (
              <FaChevronUp className="text-sm" />
            ) : (
              <FaChevronDown className="text-sm" />
            )}
          </span>
        </div>
      </button>

      {touchInstrumentsOpen ? (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {instrumentCards.map((instrumentCard) => (
            <InstrumentCard
              key={instrumentCard.key}
              card={instrumentCard}
              isOpen={activeInstrument === instrumentCard.key}
              onClick={() => toggleInstrument(instrumentCard.key)}
              compact
            />
          ))}
        </div>
      ) : null}

      {activeInstrumentConfig ? (
        <InstrumentModal
          config={activeInstrumentConfig}
          props={props}
          onClose={closeInstrumentModal}
        />
      ) : null}
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
        Input Links
      </p>

      {/* <TitleTag className="mt-2 text-[1.9rem] font-bold leading-none tracking-tight text-black">
        Input Links
      </TitleTag> */}
    </div>
  );
}

function InstrumentCard({ card, isOpen, onClick, compact = false }) {
  const { label, short, icon: Icon, link, notes, progress } = card;
  const hasLink = Boolean(link?.trim());
  const hasNotes = Boolean(notes?.trim());

  return (
    <button
      type="button"
      className={`${compact ? "min-h-[88px] overflow-hidden rounded-[14px] border border-black/5 bg-white/75 p-2.5 shadow-[0_5px_14px_rgba(0,0,0,0.04)]" : "rounded-[18px] p-4 neuphormism-b-se"} text-left transition active:scale-[0.99] ${
        hasLink ? "text-black" : "text-gray-400 opacity-75"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`flex shrink-0 items-center justify-center rounded-[9px] text-black ${compact ? "h-7 w-7" : "h-11 w-11"} ${hasLink ? "bg-[goldenrod]/15 text-[goldenrod]" : "bg-black/[0.035] text-gray-400"}`}>
            <Icon className={compact ? "text-[11px]" : "text-[14px]"} />
          </div>
          {compact ? <div className={`truncate text-[12px] font-black ${hasLink ? "text-black" : "text-gray-400"}`}>{label}</div> : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {hasLink ? <FaCheckCircle className="text-sm text-[goldenrod]" /> : null}
          {hasNotes ? (
            <FaRegStickyNote
              className={`text-sm ${hasLink ? "text-black/75" : "text-gray-400"}`}
              aria-label="Notes registered"
            />
          ) : null}
          <span className={`${compact ? "text-[10px]" : "text-sm"} font-black ${hasLink ? "text-black" : "text-gray-400"}`}>
            {Number(progress || 0)}%
          </span>
        </div>
      </div>

      <div className={`${compact ? "mt-3" : "mt-4"} flex items-center justify-between gap-2`}>
        {!compact ? <div className="text-[1.05rem] font-bold">{label}</div> : null}
        <div className={`${compact ? "text-[9px]" : "text-xs"} font-bold ${hasLink ? "text-[goldenrod]" : "text-gray-500"}`}>
          {hasLink ? "Link added" : "No URL yet"}
        </div>
        {compact ? <span className="text-[9px] font-bold text-gray-400" aria-hidden="true">↗</span> : null}
      </div>
      {compact ? <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.05]"><span className="block h-full rounded-full bg-[goldenrod]" style={{ width: `${Math.max(0, Math.min(100, Number(progress || 0)))}%` }} /></div> : null}
      {!compact ? <div className="mt-2 text-right text-xs font-medium text-black/55">
        {isOpen ? "Tap to close" : "Tap to add"}
      </div> : null}
    </button>
  );
}

function InstrumentModal({ config, props, onClose }) {
  const { t } = useLanguage();
  const Icon = config.icon;

  return createPortal(
    <div className="fixed inset-0 z-[13000] bg-black/35">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label={t("instrumentModal.closeInstrument")}
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-x-hidden overflow-y-auto rounded-t-[24px] bg-[#f2f2f2] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(0,0,0,0.16)] md:left-1/2 md:top-1/2 md:bottom-auto md:max-h-[86vh] md:w-[min(1120px,94vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:scale-[0.8] md:overflow-visible md:rounded-[28px] md:px-5">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[goldenrod] md:text-[11px]">
              {t("instrumentModal.details")}
            </p>
            <div className="mt-1.5 flex items-center gap-2.5 text-[1.35rem] font-black tracking-tight text-black md:text-[2rem]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[goldenrod]/15 text-[goldenrod] md:h-11 md:w-11 md:rounded-[14px]">
                <Icon aria-hidden="true" />
              </span>
              <span className="truncate">{config.label}</span>
            </div>

            <div className="mt-1 max-w-[17rem] text-[11px] font-medium leading-4 text-gray-500 md:max-w-none md:text-base md:leading-6">
              {t("instrumentModal.urlHelp")}
            </div>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-[12px] text-black shadow-[0_5px_14px_rgba(0,0,0,0.07)] md:h-10 md:w-10"
            onClick={onClose}
            aria-label={t("instrumentModal.closeInstrument")}
          >
            <FaTimes />
          </button>
        </div>

        <div className="rounded-[18px] bg-white/45 p-2.5 shadow-[0_6px_18px_rgba(0,0,0,0.05)] md:p-3">
          <InstrumentInputBox
            config={config}
            props={props}
            includeOnLinkAdded
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function InstrumentInputBox({ config, props, includeOnLinkAdded, onClose }) {
  const inputProps = {
    instrumentName: config.instrumentName,
    link: props[config.stateName],
    setInstrument: props[config.setterName],
    progress: props[config.progressName],
    setProgress: props[config.progressSetterName],
    setVoiceInstrument: props.setVoice,
    onLinkChange: (value) =>
      notifyInstrument(props, config.instrumentName, { link: value }),
    onProgressChange: (value) =>
      notifyInstrument(props, config.instrumentName, { progress: value }),
    notes: props[config.notesName] || "",
    onNotesChange: (value) =>
      notifyInstrument(props, config.instrumentName, { notes: value }),
    setIsDirty: props.setIsDirty,
    setShowSnackBar: props.setShowSnackBar,
    setSnackbarMessage: props.setSnackbarMessage,
    touchLayout: props.touchLayout,
    modalLayout: true,
    songData: props.songData,
    onSongDataChange: props.onSongDataChange,
    onResolvedInstrumentLink: (targetInstrument, nextLink) => {
      const targetConfig = INSTRUMENTS.find(
        (item) => item.instrumentName === targetInstrument,
      );
      if (!targetConfig) return;
      props[targetConfig.setterName]?.(nextLink);
      notifyInstrument(props, targetConfig.instrumentName, { link: nextLink });
    },
    onRemoveInstrument: () => {
      notifyInstrument(props, config.instrumentName, {
        active: false,
        link: "",
        progress: 0,
        notes: "",
        songCifra: "",
      });
      onClose?.();
    },
  };

  if (includeOnLinkAdded) {
    inputProps.onLinkAdded = props.onLinkAdded;
  }

  return <EditSongInputLinkBox {...inputProps} />;
}

function notifyInstrument(props, instrumentName, payload) {
  if (!props.instrumentUpdatersRef?.current) return;

  const updater = props.instrumentUpdatersRef.current[instrumentName];

  if (!updater) return;

  const hasLink = Object.prototype.hasOwnProperty.call(payload, "link");
  const hasProgress = Object.prototype.hasOwnProperty.call(payload, "progress");
  const hasNotes = Object.prototype.hasOwnProperty.call(payload, "notes");
  const hasActive = Object.prototype.hasOwnProperty.call(payload, "active");
  const hasSongCifra = Object.prototype.hasOwnProperty.call(payload, "songCifra");
  const shouldRemoveInstrument =
    (hasActive && payload.active === false) ||
    (hasLink && !String(payload.link || "").trim());

  if (hasActive && typeof updater.setActive === "function") {
    updater.setActive(payload.active);
    props.setIsDirty?.(true);
  }

  if (hasLink && typeof updater.setLink === "function") {
    updater.setLink(payload.link);
    if (payload.link && typeof updater.setActive === "function") {
      updater.setActive(true);
    }
    props.setIsDirty?.(true);
  }

  if (hasProgress && typeof updater.setProgress === "function") {
    updater.setProgress(payload.progress);
    props.setIsDirty?.(true);
  }

  if (hasNotes && typeof updater.setNotes === "function") {
    updater.setNotes(payload.notes);
    props.setIsDirty?.(true);
  }

  if (hasSongCifra && typeof updater.setSongCifra === "function") {
    updater.setSongCifra(payload.songCifra);
    props.setIsDirty?.(true);
  }

  if (shouldRemoveInstrument && typeof updater.removeSetlistTags === "function") {
    updater.removeSetlistTags();
  }
}

function loadInstrumentData({
  parsedData,
  setGuitar01,
  setGuitar02,
  setBass,
  setKey,
  setDrums,
  setVoice,
  setNotesGuitar01,
  setNotesGuitar02,
  setNotesBass,
  setNotesKey,
  setNotesDrums,
  setNotesVoice,
  setProgGuitar01,
  setProgGuitar02,
  setProgBass,
  setProgKey,
  setProgDrums,
  setProgVoice,
}) {
  if (parsedData.guitar01) {
    setGuitar01(parsedData.guitar01.link || "");
    setProgGuitar01(parsedData.guitar01.progress || 0);
    setNotesGuitar01(parsedData.guitar01.notes || "");
  }

  if (parsedData.guitar02) {
    setGuitar02(parsedData.guitar02.link || "");
    setProgGuitar02(parsedData.guitar02.progress || 0);
    setNotesGuitar02(parsedData.guitar02.notes || "");
  }

  if (parsedData.bass) {
    setBass(parsedData.bass.link || "");
    setProgBass(parsedData.bass.progress || 0);
    setNotesBass(parsedData.bass.notes || "");
  }

  if (parsedData.keys) {
    setKey(parsedData.keys.link || "");
    setProgKey(parsedData.keys.progress || 0);
    setNotesKey(parsedData.keys.notes || "");
  }

  if (parsedData.drums) {
    setDrums(parsedData.drums.link || "");
    setProgDrums(parsedData.drums.progress || 0);
    setNotesDrums(parsedData.drums.notes || "");
  }

  if (parsedData.voice) {
    setVoice(parsedData.voice.link || "");
    setProgVoice(parsedData.voice.progress || 0);
    setNotesVoice(parsedData.voice.notes || "");
  }
}

export default EditSongColumnB;
