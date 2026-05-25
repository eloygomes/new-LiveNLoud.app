const SHARP_NOTES = [
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

const FLAT_TO_SHARP = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

const ROOT_NOTE_PATTERN = /^[A-G](?:#|b)?/;
const INLINE_CHORD_PATTERN =
  /(^|[\s[(\-:])([A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\([^)]+\))?(?:\/[A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\([^)]+\))?)?)(?=$|[\s)\]])/g;
const TAB_LINE_PATTERN = /^\s*(?:[EADGBeB]\|.*|\|.*)$/;
const TOM_LINE_PATTERN = /^(\s*tom\s*[:=-]?\s*)([A-G](?:#|b)?)/i;

export function transposeNote(note, steps) {
  const normalized = FLAT_TO_SHARP[note] || note;
  const index = SHARP_NOTES.indexOf(normalized);

  if (index === -1) return note;

  return SHARP_NOTES[(index + steps + 1200) % 12];
}

export function transposeChord(chord, steps) {
  if (!steps || typeof chord !== "string") return chord;

  return chord
    .replace(ROOT_NOTE_PATTERN, (root) => transposeNote(root, steps))
    .replace(/\/([A-G](?:#|b)?)/, (_, bassNote) => {
      return `/${transposeNote(bassNote, steps)}`;
    });
}

function transposeTabLine(line, steps) {
  if (!steps || !TAB_LINE_PATTERN.test(line)) return line;

  return line.replace(/\d+/g, (value) => {
    const nextValue = Number.parseInt(value, 10) + steps;
    return String(Math.max(0, nextValue));
  });
}

function transposeTomLine(line, steps) {
  if (!steps) return line;

  return line.replace(TOM_LINE_PATTERN, (_, prefix, note) => {
    return `${prefix}${transposeNote(note, steps)}`;
  });
}

function transposeChordLine(line, steps) {
  if (!steps) return line;

  return line.replace(INLINE_CHORD_PATTERN, (match, prefix, chord) => {
    return `${prefix}${transposeChord(chord, steps)}`;
  });
}

export function transposeCifra(content, steps) {
  if (!steps || typeof content !== "string" || content.trim() === "") {
    return content || "";
  }

  return content
    .split("\n")
    .map((line) =>
      transposeChordLine(transposeTomLine(transposeTabLine(line, steps), steps), steps),
    )
    .join("\n");
}

export function inferDisplayKey(content) {
  if (typeof content !== "string" || content.trim() === "") return "--";

  const tomMatch = content.match(TOM_LINE_PATTERN);
  if (tomMatch?.[2]) return tomMatch[2];

  const chordMatch = content.match(/[A-G](?:#|b)?/);
  return chordMatch ? chordMatch[0] : "--";
}
