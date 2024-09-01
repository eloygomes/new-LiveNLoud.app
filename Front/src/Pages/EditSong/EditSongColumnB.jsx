import { useEffect, useState } from "react";
import EditSongInputLinkBox from "./EditSongInputLinkBox";

/* eslint-disable react/prop-types */
function EditSongColumnB({ dataFromAPI }) {
  // Guitar 01
  const [guitar01, setGuitar01] = useState("");
  const [progGuitar01, setProgGuitar01] = useState(0);

  // Guitar 02
  const [guitar02, setGuitar02] = useState("");
  const [progGuitar02, setProgGuitar02] = useState(0);

  // Bass
  const [bass, setBass] = useState("");
  const [progBass, setProgBass] = useState(0);

  // Key
  const [key, setKey] = useState("");
  const [progKey, setProgKey] = useState(0);

  // Drums
  const [drums, setDrums] = useState("");
  const [progDrums, setProgDrums] = useState(0);

  // Voice
  const [voice, setVoice] = useState("");
  const [progVoice, setProgVoice] = useState(0);

  // console.log(dataFromAPI);

  useEffect(() => {
    if (dataFromAPI) {
      try {
        const dataParsed = JSON.parse(dataFromAPI);
        console.log(dataParsed);
        setGuitar01(dataParsed.guitar01 || "");
        setGuitar02(dataParsed.guitar02 || "");
        setBass(dataParsed.bass || "");
        setKey(dataParsed.keys || "");
        setDrums(dataParsed.drums || "");
        setVoice(dataParsed.voice || "");
      } catch (error) {
        console.error("Error parsing dataFromAPI:", error);
      }
    }
  }, [dataFromAPI]);

  return (
    <div className="flex flex-row p-5 my-5  neuphormism-b">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Input Links</h1>
        <EditSongInputLinkBox
          instrumentName="Guitar01"
          link={guitar01}
          setInstrument={setGuitar01}
          progress={progGuitar01}
          setProgress={setProgGuitar01}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Guitar02"
          link={guitar02}
          setInstrument={setGuitar02}
          progress={progGuitar02}
          setProgress={setProgGuitar02}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Bass"
          link={bass}
          setInstrument={setBass}
          progress={progBass}
          setProgress={setProgBass}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Keys"
          link={key}
          setInstrument={setKey}
          progress={progKey}
          setProgress={setProgKey}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Drums"
          link={drums}
          setInstrument={setDrums}
          progress={progDrums}
          setProgress={setProgDrums}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Voice"
          link={voice}
          setInstrument={setVoice}
          progress={progVoice}
          setProgress={setProgVoice}
          dataFromAPI={dataFromAPI}
        />
      </div>
    </div>
  );
}

export default EditSongColumnB;
