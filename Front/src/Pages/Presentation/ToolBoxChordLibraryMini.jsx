import { useEffect, useMemo, useState } from "react";
import ChordShapeData from "../ChordLibrary/ChordShapeData.json";
import ChordDisplay from "../ChordLibrary/ChordDisplay";

const ROOT_ORDER = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const roots = ROOT_ORDER.filter((root) =>
  ChordShapeData.some((item) => item.chordName === root),
);
const majorMinorOptions = ["Major", "Minor"];
const qualityOptions = [
  "None",
  "5",
  "7",
  "maj7",
  "m7",
  "sus2",
  "sus4",
  "7sus4",
  "aug",
  "dim",
  "dim7",
];
const bassOptions = ["None", ...roots];
const STRING_OPEN_NOTES = ["E", "B", "G", "D", "A", "E"];
const NOTE_INDEX = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

function getLookupType(mode, quality) {
  if (quality === "None") return mode;
  if (quality === "7") return mode === "Minor" ? "m7" : "7";
  if (quality === "maj7") return "maj7";
  if (quality === "m7") return "m7";
  return quality;
}

function getChordLabel(root, mode, quality, bass) {
  let label = root;

  if (quality === "None") {
    label = mode === "Minor" ? `${root}m` : root;
  } else if (quality === "7") {
    label = mode === "Minor" ? `${root}m7` : `${root}7`;
  } else if (quality === "maj7") {
    label = `${root}maj7`;
  } else if (quality === "m7") {
    label = `${root}m7`;
  } else if (quality === "5") {
    label = `${root}5`;
  } else if (quality === "dim") {
    label = `${root}dim`;
  } else if (quality === "dim7") {
    label = `${root}dim7`;
  } else if (quality === "aug") {
    label = `${root}aug`;
  } else {
    label = `${root}${quality}`;
  }

  if (bass !== "None" && bass !== root) {
    label = `${label}/${bass}`;
  }

  return label;
}

function getNoteAtFret(openNote, fretNo) {
  const openIndex = NOTE_INDEX[openNote];
  if (typeof openIndex !== "number" || typeof fretNo !== "number") return null;
  return (openIndex + fretNo) % 12;
}

function getPlayableBassFret(openNote, bassIndex) {
  for (let fretNo = 0; fretNo <= 4; fretNo += 1) {
    if (getNoteAtFret(openNote, fretNo) === bassIndex) return fretNo;
  }

  return null;
}

function getGeneratedBassSymbol(fretNo) {
  if (fretNo === 0) return null;
  if (fretNo <= 2) return "T";
  return String(Math.min(fretNo, 4));
}

function buildBassVariation(variation, bass) {
  if (!variation || bass === "None") return variation;

  const bassIndex = NOTE_INDEX[bass];
  if (typeof bassIndex !== "number") return null;

  const soundingStrings = variation.strings
    .map((string, index) => {
      const note =
        Array.isArray(string) && string.length > 0 ? string[0] : null;
      if (!note || note.isMuted || typeof note.fretNo !== "number") return null;

      return {
        index,
        note,
        pitchClass: getNoteAtFret(STRING_OPEN_NOTES[index], note.fretNo),
      };
    })
    .filter(Boolean);

  const bassCandidates = soundingStrings.filter(
    (string) => string.pitchClass === bassIndex,
  );

  variation.strings.forEach((string, index) => {
    const note = Array.isArray(string) && string.length > 0 ? string[0] : null;
    if (note && !note.isMuted) return;

    const fretNo = getPlayableBassFret(STRING_OPEN_NOTES[index], bassIndex);
    if (fretNo === null) return;

    bassCandidates.push({
      index,
      note: {
        fretNo,
        isGeneratedBass: true,
        symbol: getGeneratedBassSymbol(fretNo),
      },
    });
  });

  const bassString = bassCandidates.reduce(
    (lowest, candidate) =>
      !lowest || candidate.index > lowest.index ? candidate : lowest,
    null,
  );

  if (!bassString) return null;

  return {
    ...variation,
    strings: variation.strings.map((string, index) => {
      if (index < bassString.index) return string;
      if (index === bassString.index) return [bassString.note];

      const note =
        Array.isArray(string) && string.length > 0 ? string[0] : null;
      if (!note) {
        return [{ fretNo: 0, isMuted: true, symbol: "X" }];
      }

      return [
        {
          ...note,
          fretNo: 0,
          isMuted: true,
          symbol: "X",
        },
      ];
    }),
  };
}

function getDisplayedVariations(variations, bass) {
  if (bass === "None") return variations;

  return variations
    .map((variation) => buildBassVariation(variation, bass))
    .filter(Boolean);
}

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
      if (symbol === "T") return symbol;
    }

    return 0;
  });

  return { fingers, frets, firstFret: variation.firstFret };
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#697180]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="neuphormism-b-btn h-8 w-full rounded-[12px] bg-[#efefef] px-2 text-[10px] font-bold text-black outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ToolBoxChordLibraryMini({ onOpenPreview }) {
  const [root, setRoot] = useState(roots[0] || "C");
  const [mode, setMode] = useState("Major");
  const [quality, setQuality] = useState("None");
  const [bass, setBass] = useState("None");
  const [variationIndex, setVariationIndex] = useState(0);

  useEffect(() => {
    setVariationIndex(0);
  }, [root, mode, quality, bass]);

  const lookupType = getLookupType(mode, quality);
  const chord = useMemo(
    () =>
      ChordShapeData.find(
        (item) => item.chordName === root && item.chordType === lookupType,
      ),
    [lookupType, root],
  );
  const variations = useMemo(
    () => getDisplayedVariations(chord?.results || [], bass),
    [bass, chord],
  );
  const safeVariationIndex = variations.length
    ? Math.min(variationIndex, variations.length - 1)
    : 0;
  const fingering = useMemo(
    () => buildFingering(variations[safeVariationIndex]),
    [safeVariationIndex, variations],
  );
  const chordLabel = getChordLabel(root, mode, quality, bass);

  const handleNextVariation = () => {
    if (variations.length <= 1) return;
    setVariationIndex((prevIndex) => (prevIndex + 1) % variations.length);
  };

  const handleOpenPreview = () => {
    onOpenPreview?.({
      chordName: chordLabel,
      chordType: "",
      fingering,
    });
  };

  return (
    <div className="mb-2 rounded-md p-2 neuphormism-b">
      <div className="flex min-h-48 flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Root"
            value={root}
            options={roots}
            onChange={setRoot}
          />
          <SelectField
            label="Mode"
            value={mode}
            options={majorMinorOptions}
            onChange={setMode}
          />
          <SelectField
            label="Quality"
            value={quality}
            options={qualityOptions}
            onChange={setQuality}
          />
          <SelectField
            label="Bass"
            value={bass}
            options={bassOptions}
            onChange={setBass}
          />
        </div>

        <div className="rounded-[18px] px-2 py-2 text-center neuphormism-b">
          <div className="truncate text-lg font-black leading-none text-black">
            {chordLabel}
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#697180]">
            {variations.length
              ? `${safeVariationIndex + 1}/${variations.length}`
              : "0/0"}
          </div>
        </div>

        <button
          type="button"
          className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-md bg-white/70 px-2 py-2 neuphormism-b"
          onClick={handleOpenPreview}
          disabled={!fingering}
        >
          <div className="flex h-[92px] items-center justify-center overflow-hidden">
            <div className="origin-center scale-[0.22]">
              <ChordDisplay fingering={fingering} chordName={chordLabel} />
            </div>
          </div>
          <div className="mt-1 text-center text-[10px] text-gray-500">
            {fingering ? "click to enlarge" : "no shape"}
          </div>
        </button>

        <button
          type="button"
          className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${
            variations.length > 1
              ? "neuphormism-b-btn-gold text-black"
              : "neuphormism-b-btn text-[#697180]"
          }`}
          onClick={handleNextVariation}
          disabled={variations.length <= 1}
        >
          {variations.length > 1 ? "Next variation" : "One variation"}
        </button>
      </div>
    </div>
  );
}
