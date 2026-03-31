import { useEffect, useState } from "react";
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
