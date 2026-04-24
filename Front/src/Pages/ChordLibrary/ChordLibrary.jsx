import { useEffect, useMemo, useState } from "react";
import ChordShapeData from "./ChordShapeData.json";
import ChordDisplay from "./ChordDisplay";

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

  const firstBassString = soundingStrings.find(
    (string) => string.pitchClass === bassIndex,
  );

  if (!firstBassString) return null;

  return {
    ...variation,
    strings: variation.strings.map((string, index) => {
      if (index <= firstBassString.index) return string;

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

function getChordNotes(root, mode, quality, bass, hasChord, hasBassVariation) {
  const notes = [];

  if (quality === "5") {
    notes.push("Power chords ignore major/minor mode in the stored voicings.");
  }

  if (quality === "maj7" && mode === "Minor") {
    notes.push(
      "Major/minor mode only affects the label when the chosen quality supports it.",
    );
  }

  if (quality === "m7" && mode === "Major") {
    notes.push(
      "Minor 7th voicings use the stored m7 shapes regardless of mode.",
    );
  }

  if (bass !== "None" && bass !== root) {
    notes.push(
      "Bass note now updates the displayed voicing to keep the selected slash bass as the lowest sounding note.",
    );
  }

  if (bass !== "None" && bass !== root && !hasBassVariation) {
    notes.push(
      "No stored variation contains that bass note for this chord, so this slash voicing is unavailable.",
    );
  }

  if (!hasChord) {
    notes.push(
      "This exact combination is not available in the local chord library yet.",
    );
  }

  return notes;
}

function getFingering(variation) {
  if (!variation) return null;

  const frets = variation.strings.map((string) => {
    if (Array.isArray(string) && string.length > 0) {
      const note = string[0];
      if (note.isMuted) return -1;
      return typeof note.fretNo === "number" ? note.fretNo : 0;
    }
    return 0;
  });

  const fingers = variation.strings.map((string) => {
    if (Array.isArray(string) && string.length > 0) {
      const symbol = string[0].symbol;
      if (typeof symbol === "string" && /^\d$/.test(symbol)) {
        return parseInt(symbol, 10);
      }
    }
    return 0;
  });

  return { frets, fingers };
}

function ChoiceChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[2.8rem] rounded px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition sm:min-w-[3.25rem] sm:px-4 sm:text-xs ${
        selected
          ? "bg-[goldenrod] text-black shadow-[0_10px_18px_rgba(217,173,38,0.24)]"
          : "bg-[#efefef] text-[#697180] shadow-[3px_3px_8px_rgba(190,190,190,0.55),-3px_-3px_8px_rgba(255,255,255,0.9)] hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

function SelectorSection({ title, value, options, onSelect }) {
  return (
    <section className="rounded-[22px] bg-[#efefef] p-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] neuphormism-b">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black">
            {title}
          </p>
          <p className="mt-1 text-sm font-extrabold text-[#697180]">{value}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ChoiceChip
            key={option}
            label={option}
            selected={value === option}
            onClick={() => onSelect(option)}
          />
        ))}
      </div>
    </section>
  );
}

function SelectionBadge({ label, value }) {
  return (
    <div className="min-w-0 rounded bg-[#efefef] px-3 py-3 text-center shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] neuphormism-b sm:px-4 lg:min-w-[88px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#697180] sm:text-[11px] sm:tracking-[0.2em]">
        {label}
      </p>
      <p className="mt-2 break-words text-xs font-black text-black sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function MobileSelectField({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#697180]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded bg-[#efefef] px-3 py-3 text-sm font-black text-black shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] outline-none"
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

function ChordLibrary() {
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
  const fingering = getFingering(variations[safeVariationIndex]);
  const chordLabel = getChordLabel(root, mode, quality, bass);
  const chordNotes = getChordNotes(
    root,
    mode,
    quality,
    bass,
    Boolean(chord),
    bass === "None" || bass === root || variations.length > 0,
  );

  const handleNextVariation = () => {
    if (variations.length <= 1) return;
    setVariationIndex((current) => (current + 1) % variations.length);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] px-3 pb-10 pt-4 sm:px-5 lg:px-8">
      <div className="container mx-auto">
        <div className="w-full pb-10 md:mx-auto md:w-11/12 2xl:w-9/12">
          <div className="mb-5 flex items-center gap-6 neuphormism-b p-5">
            <div>
              <h1 className="text-4xl font-bold">CHORD LIBRARY</h1>
            </div>
            <div className="ml-auto">
              <h4 className="max-w-[360px] text-right text-sm">
                Build the chord by root, major / minor mode, quality, and bass note.
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-start">
          <section className="order-2 hidden rounded-[28px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:p-5 xl:order-1 xl:block neuphormism-b">
            <p className="text-lg font-black uppercase text-black">
              Build chord
            </p>
            <div className="mt-4 grid gap-3 lg:hidden">
              <div className="grid grid-cols-2 gap-3">
                <MobileSelectField
                  label="Root"
                  value={root}
                  options={roots}
                  onChange={setRoot}
                />
                <MobileSelectField
                  label="Mode"
                  value={mode}
                  options={majorMinorOptions}
                  onChange={setMode}
                />
                <MobileSelectField
                  label="Quality"
                  value={quality}
                  options={qualityOptions}
                  onChange={setQuality}
                />
                <MobileSelectField
                  label="Bass"
                  value={bass}
                  options={bassOptions}
                  onChange={setBass}
                />
              </div>
            </div>
            <div className="mt-4 hidden gap-4 neuphormism-b lg:grid">
              <SelectorSection
                title="Root"
                value={root}
                options={roots}
                onSelect={setRoot}
              />
              <SelectorSection
                title="Major / Minor"
                value={mode}
                options={majorMinorOptions}
                onSelect={setMode}
              />
              <SelectorSection
                title="Quality"
                value={quality}
                options={qualityOptions}
                onSelect={setQuality}
              />
              <SelectorSection
                title="Bass"
                value={bass}
                options={bassOptions}
                onSelect={setBass}
              />
            </div>
          </section>

          <section className="order-1 flex min-h-[700px] flex-col rounded-[28px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:min-h-[760px] sm:p-5 xl:order-2 neuphormism-b">
            <div className="flex flex-col gap-4">
              <div className="hidden rounded px-4 py-4 shadow-[6px_6px_14px_rgba(190,190,190,0.55),-6px_-6px_14px_rgba(255,255,255,0.9)] sm:px-5 xl:block">
                <div className="min-w-0">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[goldenrod]">
                      Voicing
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-black leading-none text-black sm:text-[2.35rem]">
                      {chordLabel}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="hidden flex-col gap-3 bg-[#efefef] px-3 py-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] sm:px-4 lg:flex lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                <div className="flex justify-center md:justify-start">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_6px_12px_rgba(0,0,0,0.06)] neuphormism-b">
                    {variations.length
                      ? `${safeVariationIndex + 1}/${variations.length}`
                      : "0/0"}
                  </span>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 lg:flex lg:w-auto lg:flex-wrap lg:justify-end">
                  <SelectionBadge label="Root" value={root} />
                  <SelectionBadge label="Mode" value={mode} />
                  <SelectionBadge label="Quality" value={quality} />
                  <SelectionBadge label="Bass" value={bass} />
                </div>
              </div>

              <div className="rounded-[24px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)] xl:hidden neuphormism-b">
                <p className="text-lg font-black uppercase text-black">
                  Build chord
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileSelectField
                    label="Root"
                    value={root}
                    options={roots}
                    onChange={setRoot}
                  />
                  <MobileSelectField
                    label="Mode"
                    value={mode}
                    options={majorMinorOptions}
                    onChange={setMode}
                  />
                  <MobileSelectField
                    label="Quality"
                    value={quality}
                    options={qualityOptions}
                    onChange={setQuality}
                  />
                  <MobileSelectField
                    label="Bass"
                    value={bass}
                    options={bassOptions}
                    onChange={setBass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex  flex-1 flex-col rounded-[24px] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_18px_rgba(0,0,0,0.05)]  sm:p-5">
              <div className="flex items-center justify-center overflow-x-auto">
                <ChordDisplay fingering={fingering} chordName={chordLabel} />
              </div>

              <div className="mt-4 min-h-[20px]">
                {chordNotes.length ? (
                  <div className="h-full rounded-[22px] p-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)]">
                    <div className="flex flex-col gap-2">
                      {chordNotes.map((note) => (
                        <p
                          key={note}
                          className="text-sm leading-6 text-[#4e5563]"
                        >
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <h2 className="pb-10 pt-6 text-center text-3xl font-black leading-none text-black xl:hidden">
                {chordLabel}
              </h2>
            </div>

            <button
              className={`mt-4 w-full rounded px-4 py-3 text-[12px] font-black uppercase tracking-[0.16em] transition ${
                variations.length > 1
                  ? "bg-[goldenrod] text-black shadow-[0_10px_18px_rgba(217,173,38,0.25)]"
                  : "bg-[#d8d8d8] text-[#7f8794]"
              }`}
              type="button"
              disabled={variations.length <= 1}
              onClick={handleNextVariation}
            >
              {variations.length > 1 ? "Next variation" : "One variation"}
            </button>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ChordLibrary;
