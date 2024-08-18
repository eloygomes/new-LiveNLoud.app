/* eslint-disable react/prop-types */
import NewSongInputLinkBox from "./NewSongInputLinkBox";

function NewSongColumnB({
  guitar01,
  setGuitar01,
  guitar02,
  setGuitar02,
  bass,
  setBass,
  key,
  setKey,
  drums,
  setDrums,
  voice,
  setVoice,
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
}) {
  return (
    <div className="flex flex-row p-5 my-5  neuphormism-b">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Input Links</h1>
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
