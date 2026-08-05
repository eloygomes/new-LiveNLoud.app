import { useEffect, useMemo, useState } from "react";
import ChordShapeData from "./ChordShapeData.json";
import ChordDisplay from "./ChordDisplay";
import TabletToolShell from "../../components/TabletToolShell";
import { useCompactAppLayout } from "../../Tools/responsiveLayout";

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
      if (symbol === "T") return symbol;
    }
    return 0;
  });

  return { frets, fingers, firstFret: variation.firstFret };
}

function ChoiceChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[2.8rem] rounded px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition sm:min-w-[3.25rem] sm:px-4 sm:text-xs ${
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
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black">
            {title}
          </p>
          <p className="mt-1 text-sm font-bold text-[#697180]">{value}</p>
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
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#697180] sm:text-[11px] sm:tracking-[0.2em]">
        {label}
      </p>
      <p className="mt-2 break-words text-xs font-bold text-black sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function MobileSelectField({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#697180]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[12px] bg-[#efefef] px-3 text-[12px] font-bold text-black shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] outline-none"
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

function TabletSelectorSection({
  title,
  description,
  value,
  options,
  onSelect,
  columns = 4,
}) {
  return (
    <section className="rounded-[18px] border border-black/[0.045] bg-white/65 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.045)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-black">
            {title}
          </h3>
          <p className="mt-1 text-[11px] font-semibold leading-[1rem] text-gray-500">
            {description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[goldenrod]/15 px-2.5 py-1.5 text-[10px] font-bold text-black">
          {value}
        </span>
      </div>
      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            className={`flex min-h-11 min-w-0 items-center justify-center rounded-[11px] px-2 py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[goldenrod] ${
              value === option
                ? "bg-[goldenrod] text-black shadow-[0_8px_16px_rgba(218,165,32,0.22)]"
                : "bg-[#efefef] text-gray-600 shadow-[3px_3px_8px_rgba(190,190,190,0.42),-3px_-3px_8px_rgba(255,255,255,0.86)]"
            }`}
            onClick={() => onSelect(option)}
          >
            <span className="truncate">{option}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ChordLibrary() {
  const isCompactLayout = useCompactAppLayout();
  const viewportWidth =
    typeof window === "undefined" ? 1280 : window.innerWidth;
  const isTouchLayout = isCompactLayout && viewportWidth < 768;
  const isTabletLayout = isCompactLayout && viewportWidth >= 768;
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

  if (isTabletLayout) {
    const guideNotes = chordNotes.length
      ? chordNotes
      : [
          "This voicing is available in the local library and ready to compare with its alternate fingerings.",
          "Keep the fretting hand relaxed, let every selected string ring, and mute only the strings marked with an X.",
        ];

    return (
      <TabletToolShell
        title="Build voicings that serve the song."
        description="Choose the harmonic foundation, compare practical fingerings and understand how each bass note changes the shape before you start playing."
        artIndex={1}
        artLabel="Chord library workspace illustration"
        badges={[
          `${variations.length} ${variations.length === 1 ? "voicing" : "voicings"}`,
          `${root} root`,
          bass === "None" ? "Root position" : `${bass} in the bass`,
        ]}
        contentClassName="grid grid-cols-[minmax(22rem,0.92fr)_minmax(0,1.38fr)] gap-5 overflow-hidden"
      >
        <aside className="neuphormism-b flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] p-5">
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
              Shape builder
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[1.35rem] font-bold leading-none text-black">
                  Design the chord
                </h2>
                <p className="mt-2 max-w-[30rem] text-[12px] font-semibold leading-[1.1rem] text-gray-500">
                  Start with the root, define its character, then add color or
                  choose a specific lowest note.
                </p>
              </div>
              <div className="rounded-[14px] bg-black px-3 py-2 text-center text-white">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[goldenrod]">
                  Current
                </div>
                <div className="mt-1 text-[1.05rem] font-bold leading-none">
                  {chordLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-hidden">
            <TabletSelectorSection
              title="Root"
              description="The note everything is built around."
              value={root}
              options={roots}
              onSelect={setRoot}
              columns={4}
            />
            <TabletSelectorSection
              title="Character"
              description="Choose a bright major or darker minor base."
              value={mode}
              options={majorMinorOptions}
              onSelect={setMode}
              columns={2}
            />
            <TabletSelectorSection
              title="Color"
              description="Add tension, suspension or a seventh."
              value={quality}
              options={qualityOptions}
              onSelect={setQuality}
              columns={4}
            />
            <TabletSelectorSection
              title="Bass note"
              description="Create inversions and slash voicings."
              value={bass}
              options={bassOptions}
              onSelect={setBass}
              columns={4}
            />
          </div>
        </aside>

        <section className="neuphormism-b grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[24px] p-5">
          <div className="flex shrink-0 items-center justify-between gap-5 rounded-[18px] bg-white/65 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
                Selected voicing
              </p>
              <h2 className="mt-1 truncate text-[2.15rem] font-bold leading-none tracking-[-0.045em] text-black">
                {chordLabel}
              </h2>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2">
              {[
                ["Variation", variations.length ? `${safeVariationIndex + 1}/${variations.length}` : "0/0"],
                ["Mode", mode],
                ["Bass", bass],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-[6.2rem] rounded-[13px] bg-black/[0.035] px-3 py-2.5 text-center"
                >
                  <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-gray-500">
                    {label}
                  </div>
                  <div className="mt-1 truncate text-[11px] font-bold text-black">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-[minmax(19rem,1.12fr)_minmax(14rem,0.88fr)] gap-4 py-4">
            <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-[20px] bg-white/70 p-3">
              <ChordDisplay
                fingering={fingering}
                chordName={chordLabel}
                size={300}
              />
            </div>

            <div className="flex min-h-0 flex-col gap-3">
              <div className="rounded-[18px] bg-black p-4 text-white">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
                  Playing guide
                </p>
                <h3 className="mt-2 text-[1rem] font-bold leading-tight">
                  Make every note intentional.
                </h3>
                <p className="mt-2 text-[11px] font-semibold leading-[1.05rem] text-white/70">
                  Dots show finger placement, O means an open string and X means
                  that string should stay silent.
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto rounded-[18px] bg-white/70 p-4 overscroll-contain">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  About this shape
                </p>
                <div className="mt-3 space-y-3">
                  {guideNotes.map((note) => (
                    <div key={note} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[goldenrod]" />
                      <p className="text-[11px] font-semibold leading-[1.05rem] text-gray-600">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            className={`flex min-h-12 w-full shrink-0 items-center justify-center rounded-[14px] px-5 text-[10px] font-bold uppercase tracking-[0.14em] transition active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
              variations.length > 1
                ? "bg-[goldenrod] text-black shadow-[0_10px_18px_rgba(217,173,38,0.25)]"
                : "bg-[#d8d8d8] text-[#7f8794]"
            }`}
            type="button"
            disabled={variations.length <= 1}
            onClick={handleNextVariation}
          >
            {variations.length > 1
              ? `Compare next voicing · ${safeVariationIndex + 1} of ${variations.length}`
              : "This chord has one available voicing"}
          </button>
        </section>
      </TabletToolShell>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] px-3 pb-4 pt-3 sm:px-5 lg:h-[calc(100vh-4rem)] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:pb-4">
      <div className="mx-auto w-full max-w-none">
        <div className="w-full pb-10 lg:pb-0">
          <div
            className={`mb-3 ${
              isTouchLayout
                ? "px-1 py-1"
                : "flex items-center gap-6 neuphormism-b p-5"
            }`}
          >
            <div>
              {isTouchLayout ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                    Chord Library
                  </p>
                  <h1 className="mt-1 text-[1.55rem] font-bold leading-none tracking-tight text-black">
                    Shape The Harmony
                  </h1>
                </>
              ) : (
                <h1 className="text-4xl font-bold">CHORD LIBRARY</h1>
              )}
            </div>
            <div className={`ml-auto ${isTouchLayout ? "hidden" : ""}`}>
              <h4 className="max-w-[360px] text-right text-sm">
                Build the chord by root, major / minor mode, quality, and bass note.
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-stretch">
          <section className="order-2 hidden rounded-[28px] bg-[#e0e0e0] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:p-5 xl:order-1 xl:block neuphormism-b">
            <p className="text-lg font-bold uppercase text-black">
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

          <section className="order-1 flex min-h-0 flex-col rounded-[18px] bg-[#e0e0e0] p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:min-h-[760px] sm:rounded-[28px] sm:p-5 xl:order-2 xl:min-h-0 neuphormism-b">
            <div className="flex flex-col gap-3">
              <div className="hidden rounded px-4 py-4 shadow-[6px_6px_14px_rgba(190,190,190,0.55),-6px_-6px_14px_rgba(255,255,255,0.9)] sm:px-5 xl:block">
                <div className="min-w-0">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[goldenrod]">
                      Voicing
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-bold leading-none text-black sm:text-[2.35rem]">
                      {chordLabel}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="hidden flex-col gap-3 bg-[#efefef] px-3 py-4 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] sm:px-4 lg:flex lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                <div className="flex justify-center md:justify-start">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black shadow-[0_6px_12px_rgba(0,0,0,0.06)] neuphormism-b">
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

              <div className="rounded-[16px] bg-[#e0e0e0] p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] xl:hidden neuphormism-b">
                <p className="text-[13px] font-bold uppercase text-black">
                  Build chord
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
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

            <div className="mt-3 flex flex-col rounded-[16px] bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_18px_rgba(0,0,0,0.05)] sm:mt-5 sm:flex-1 sm:rounded-[24px] sm:p-5">
              <div className="flex items-center justify-center overflow-x-auto">
                <ChordDisplay fingering={fingering} chordName={chordLabel} />
              </div>

              <div className="mt-2 min-h-0">
                {chordNotes.length ? (
                  <div className="h-full rounded-[14px] p-3 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] sm:rounded-[22px] sm:p-4">
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
              <h2 className="pb-2 pt-3 text-center text-[1.4rem] font-bold leading-none text-black xl:hidden">
                {chordLabel}
              </h2>
            </div>

            <button
              className={`mt-3 w-full rounded-[12px] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
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
