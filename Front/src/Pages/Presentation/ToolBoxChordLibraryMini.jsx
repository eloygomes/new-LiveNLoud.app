import { useMemo, useState } from "react";
import ChordShapeData from "../ChordLibrary/ChordShapeData.json";
import ChordDisplay from "../ChordLibrary/ChordDisplay";

const chordNames = [...new Set(ChordShapeData.map((item) => item.chordName))];
const chordTypes = [...new Set(ChordShapeData.map((item) => item.chordType))];

function buildFingering(variation) {
  if (!variation) return null;

  const strings = variation.strings || [];
  const frets = strings.map((stringData) => {
    if (Array.isArray(stringData) && stringData.length > 0) {
      const entry = stringData[0];
      if (entry.isMuted) return -1;
      return typeof entry.fretNo === "number" ? entry.fretNo : 0;
    }

    return 0;
  });

  const fingers = strings.map((stringData) => {
    if (Array.isArray(stringData) && stringData.length > 0) {
      const symbol = stringData[0].symbol;
      if (typeof symbol === "string" && /^\d$/.test(symbol)) {
        return parseInt(symbol, 10);
      }
    }

    return 0;
  });

  return { fingers, frets };
}

export default function ToolBoxChordLibraryMini({ onOpenPreview }) {
  const [chordName, setChordName] = useState(chordNames[0] || "");
  const [chordType, setChordType] = useState(chordTypes[0] || "");
  const [variationIndex, setVariationIndex] = useState(0);

  const chord = useMemo(
    () =>
      ChordShapeData.find(
        (item) => item.chordName === chordName && item.chordType === chordType
      ),
    [chordName, chordType]
  );

  const variations = chord?.results || [];
  const fingering = useMemo(
    () => buildFingering(variations[variationIndex]),
    [variationIndex, variations]
  );

  const handleChordNameChange = (event) => {
    setChordName(event.target.value);
    setVariationIndex(0);
  };

  const handleChordTypeChange = (event) => {
    setChordType(event.target.value);
    setVariationIndex(0);
  };

  const handleNextVariation = () => {
    if (!variations.length) return;
    setVariationIndex((prevIndex) => (prevIndex + 1) % variations.length);
  };

  const handleOpenPreview = () => {
    onOpenPreview?.({
      chordName,
      chordType,
      fingering,
    });
  };

  return (
    <>
      <div className="p-2 rounded-md mb-2 neuphormism-b">
        <div className="flex min-h-48 flex-col gap-3">
          <div className="flex gap-2">
            <select
              value={chordName}
              onChange={handleChordNameChange}
              className="w-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[10px]"
            >
              {chordNames.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={chordType}
              onChange={handleChordTypeChange}
              className="w-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[10px]"
            >
              {chordTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="min-w-0 text-center">
              <div className="truncate text-sm font-bold">
                {`${chordName} ${chordType}`.trim()}
              </div>
              <div className="text-[10px] text-gray-500">
                variation {variations.length ? variationIndex + 1 : 0}/{variations.length}
              </div>
            </div>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-[10px] font-semibold neuphormism-b-se"
              onClick={handleNextVariation}
            >
              next
            </button>
          </div>

          <button
            type="button"
            className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-md bg-white/70 px-2 py-2"
            onClick={handleOpenPreview}
          >
            <div className="flex h-[92px] items-center justify-center overflow-hidden">
              <div className="origin-center scale-[0.22]">
                <ChordDisplay
                  fingering={fingering}
                  chordName={`${chordName} ${chordType}`.trim()}
                />
              </div>
            </div>
            <div className="mt-1 text-center text-[10px] text-gray-500">
              {variations.length ? "click to enlarge" : "no shape"}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
