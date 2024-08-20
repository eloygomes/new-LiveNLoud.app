/* eslint-disable react/prop-types */
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
}) {
  return (
    <div className="flex flex-row p-5 my-5  neuphormism-b">
      <div className="flex flex-col w-full">
        <h1 className="text-xl font-bold">Input Links</h1>
        <NewSongInputLinkBox
          instrumentName="guitar01"
          instrument={guitar01} // Corrigido aqui
          setInstrument={setGuitar01}
          progress={progBarG01} // Corrigido aqui
          setProgress={setProgBarG01}
          setArtistExtractedFromUrl={setArtistExtractedFromUrl}
          setSongExtractedFromUrl={setSongExtractedFromUrl}
        />
        <NewSongInputLinkBox
          instrumentName="guitar02"
          instrument={guitar02} // Corrigido aqui
          setInstrument={setGuitar02}
          progress={progBarG02} // Corrigido aqui
          setProgress={setProgBarG02}
          setArtistExtractedFromUrl={setArtistExtractedFromUrl}
          setSongExtractedFromUrl={setSongExtractedFromUrl}
        />
        <NewSongInputLinkBox
          instrumentName="bass"
          instrument={bass} // Corrigido aqui
          setInstrument={setBass}
          progress={progBarBass} // Corrigido aqui
          setProgress={setProgBarBass}
          setArtistExtractedFromUrl={setArtistExtractedFromUrl}
          setSongExtractedFromUrl={setSongExtractedFromUrl}
        />
        <NewSongInputLinkBox
          instrumentName="keys"
          instrument={keyboard} // Corrigido aqui
          setInstrument={setKey}
          progress={progBarKey} // Corrigido aqui
          setProgress={setProgBarKey}
          setArtistExtractedFromUrl={setArtistExtractedFromUrl}
          setSongExtractedFromUrl={setSongExtractedFromUrl}
        />
        <NewSongInputLinkBox
          instrumentName="drums"
          instrument={drums} // Corrigido aqui
          setInstrument={setDrums}
          progress={progBarDrums} // Corrigido aqui
          setProgress={setProgBarDrums}
          setArtistExtractedFromUrl={setArtistExtractedFromUrl}
          setSongExtractedFromUrl={setSongExtractedFromUrl}
        />
        <NewSongInputLinkBox
          instrumentName="voice"
          instrument={voice} // Corrigido aqui
          setInstrument={setVoice}
          progress={progBarVoice} // Corrigido aqui
          setProgress={setProgBarVoice}
          setArtistExtractedFromUrl={setArtistExtractedFromUrl}
          setSongExtractedFromUrl={setSongExtractedFromUrl}
        />
      </div>
    </div>
  );
}

export default NewSongColumnB;
