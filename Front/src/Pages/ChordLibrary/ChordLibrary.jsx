import { useState } from "react";
import ChordInput from "./ChordInput";
import ChordShapeData from "./ChordShapeData.json";
import ChordDisplay from "./ChordDisplay";

// Opções derivadas do ChordShapeData (React Native parity)
const chordNames = [...new Set(ChordShapeData.map((item) => item.chordName))];
const chordTypes = [...new Set(ChordShapeData.map((item) => item.chordType))];

function ChordLibrary() {
  // Estados principais (paridade com RN)
  const [chordName, setChordName] = useState(chordNames[0] || "");
  const [chordType, setChordType] = useState(chordTypes[0] || "");
  const [variationIndex, setVariationIndex] = useState(0);

  // Localiza o bloco do acorde selecionado
  const chord = ChordShapeData.find(
    (c) => c.chordName === chordName && c.chordType === chordType
  );

  const variations = chord?.results || [];

  const handleNextVariation = () => {
    if (!variations.length) return;
    const nextIndex = (variationIndex + 1) % variations.length;
    setVariationIndex(nextIndex);
  };

  // Constrói o objeto fingering { frets, fingers } esperado pelo renderer
  const fingering = (() => {
    if (!variations[variationIndex]) return null;
    const strings = variations[variationIndex].strings; // 6 entradas

    const frets = strings.map((s) => {
      if (Array.isArray(s) && s.length > 0) {
        const it = s[0];
        // Muted -> -1, Solta -> 0, Número -> próprio número
        if (it.isMuted) return -1;
        return typeof it.fretNo === "number" ? it.fretNo : 0;
      }
      return 0;
    });

    const fingers = strings.map((s) => {
      if (Array.isArray(s) && s.length > 0) {
        const sym = s[0].symbol;
        if (typeof sym === "string" && /^\d$/.test(sym))
          return parseInt(sym, 10);
      }
      return 0;
    });

    return { frets, fingers };
  })();

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Chord Library</h1>
            <h4 className="ml-auto mt-auto text-sm">
              Find the correct chord for you here!
            </h4>
          </div>
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <div className="flex flex-col justify-start w-[90%] mx-auto rounded-md mb-2">
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <div className="w-[90%] flex flex-row justify-start">
                  <ChordInput
                    values={chordNames}
                    setSelectedRoot={setChordName}
                    inputLabel="Root"
                  />
                  <ChordInput
                    values={chordTypes}
                    setSelectedQuality={setChordType}
                    inputLabel="Quality"
                  />
                </div>
                <button
                  className="flex items-center justify-center neuphormism-b-btn p-3"
                  type="button"
                  onClick={handleNextVariation}
                >
                  Next Variation
                </button>
              </div>
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <h1 className="text-3xl flex-1  text-center mx-auto">
                  {`${chordName || ""} ${chordType || ""}`.trim() ||
                    "Select a chord"}
                </h1>
              </div>
              <div className="p-10 flex flex-row justify-between w-[90%] mx-auto mb-5 rounded-md neuphormism-b">
                <div className="flex items-center justify-center mx-auto">
                  <ChordDisplay
                    fingering={fingering}
                    chordName={`${chordName} ${chordType}`.trim()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChordLibrary;
