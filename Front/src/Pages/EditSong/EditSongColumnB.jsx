/* eslint-disable react/prop-types */
import { useState } from "react";
import EditSongInputLinkBox from "./EditSongInputLinkBox";

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

  return (
    <div className="flex flex-row p-5 my-5  neuphormism-b">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Input Links</h1>
        <EditSongInputLinkBox
          instrumentName="Guitar01"
          instument={guitar01}
          setInstrument={setGuitar01}
          progress={progGuitar01}
          setProgress={setProgGuitar01}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Guitar02"
          instument={guitar02}
          setInstrument={setGuitar02}
          progress={progGuitar02}
          setProgress={setProgGuitar02}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Bass"
          instument={bass}
          setInstrument={setBass}
          progress={progBass}
          setProgress={setProgBass}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Keys"
          instument={key}
          setInstrument={setKey}
          progress={progKey}
          setProgress={setProgKey}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Drums"
          instument={drums}
          setInstrument={setDrums}
          progress={progDrums}
          setProgress={setProgDrums}
          dataFromAPI={dataFromAPI}
        />
        <EditSongInputLinkBox
          instrumentName="Voice"
          instument={voice}
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
