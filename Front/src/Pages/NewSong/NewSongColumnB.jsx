import { useState } from "react";
import NewSongInputLinkBox from "./NewSongInputLinkBox";

function NewSongColumnB() {
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
        <h1 className="text-2xl font-bold">Input Links</h1>
        <NewSongInputLinkBox
          instrumentName="GUITAR 01"
          instument={guitar01}
          setInstrument={setGuitar01}
          progress={progGuitar01}
          setProgress={setProgGuitar01}
        />
        <NewSongInputLinkBox
          instrumentName="GUITAR 02"
          instument={guitar02}
          setInstrument={setGuitar02}
          progress={progGuitar02}
          setProgress={setProgGuitar02}
        />
        <NewSongInputLinkBox
          instrumentName="BASS"
          instument={bass}
          setInstrument={setBass}
          progress={progBass}
          setProgress={setProgBass}
        />
        <NewSongInputLinkBox
          instrumentName="KEYS"
          instument={key}
          setInstrument={setKey}
          progress={progKey}
          setProgress={setProgKey}
        />
        <NewSongInputLinkBox
          instrumentName="DRUMS"
          instument={drums}
          setInstrument={setDrums}
          progress={progDrums}
          setProgress={setProgDrums}
        />
        <NewSongInputLinkBox
          instrumentName="VOICE"
          instument={voice}
          setInstrument={setVoice}
          progress={progVoice}
          setProgress={setProgVoice}
        />
      </div>
    </div>
  );
}

export default NewSongColumnB;
