const CHORD_PATTERN =
  /^(?<root>[A-G])(?<accidental>#|b)?(?<quality>(?:(?:maj|min|dim|aug|sus|add|omit|no|m|M)|[0-9º°+#()-])*)(?:\/(?<bass>[A-G](?:#|b)?))?$/;

export const BRACKETED_CHORD_PATTERN =
  /\[\s*([A-G](?:#|b)?(?:(?:maj|min|dim|aug|sus|add|omit|no|m|M)|[0-9º°+#()-])*(?:\/[A-G](?:#|b)?)?)\s*\]/g;

const CHORD_LINE_SEPARATOR_PATTERN =
  /^(?:\|+|:+|[-–—]+|%|(?:x?\d+x?))$/i;

const CHORD_LINE_ANNOTATION_PATTERN =
  /\((?:passagem|riff|solo|intro|base|dedilhado|repete|repeat)\b[^)]*\)/gi;

const CHORD_LINE_KEY_PREFIX_PATTERN = /^\s*tom\s*[:=-]?\s*/i;

const TABLATURE_WITH_PIPE_PATTERN =
  /^\s*(?:\[?\s*(?:[EADGBeB](?:#|b)?)\s*\]?\s*)?\|(?=[^\n]*[-\d])[^\n]*$/;

const TABLATURE_WITHOUT_PIPE_PATTERN =
  /^\s*\[?\s*[EADGBeB](?:#|b)?\s*\]?\s*(?=(?:[^\n]*-){5,})[^\n]*$/;

const TABLATURE_TECHNIQUE_PATTERN =
  /^\s*(?:\((?:T|P)\)\s*){2,}$/i;

const BASS_TAB_STRING_PATTERN =
  /^\s*\[?\s*([GDAE])\s*\]?\s*(?:\|[^\n]*|(?=(?:[^\n]*-){5,})[^\n]*)$/i;

function stripChordTokenDecoration(value = "") {
  const token = String(value || "");
  const leading = token.match(/^[|([{:]*/)?.[0] || "";
  const withoutLeading = token.slice(leading.length);
  const trailing = withoutLeading.match(/[|\])},;:]*$/)?.[0] || "";
  return {
    raw: withoutLeading.slice(0, withoutLeading.length - trailing.length),
    offset: leading.length,
  };
}

export class ChordParser {
  static parse(value = "") {
    const raw = String(value || "").trim().replace(/^\[|\]$/g, "");
    if (raw.length > 24 || raw.includes("|") || /-{2,}/.test(raw)) return null;
    const match = raw.match(CHORD_PATTERN);
    if (!match) return null;

    return {
      raw,
      root: match.groups?.root || "",
      accidental: match.groups?.accidental || null,
      quality: match.groups?.quality || "",
      bass: match.groups?.bass || null,
    };
  }

  static isChord(value = "") {
    return Boolean(this.parse(value));
  }
}

export function isChordLine(value = "") {
  const bracketPattern = new RegExp(
    BRACKETED_CHORD_PATTERN.source,
    BRACKETED_CHORD_PATTERN.flags,
  );
  const normalized = String(value || "")
    .replace(CHORD_LINE_KEY_PREFIX_PATTERN, "")
    .replace(CHORD_LINE_ANNOTATION_PATTERN, " ")
    .replace(
      bracketPattern,
      (match, chord) => ChordParser.isChord(chord) ? ` ${String(chord).trim()} ` : match,
    );
  const tokens = normalized.trim().split(/\s+/).filter(Boolean);
  const meaningfulTokens = tokens.filter((token) => {
    const { raw } = stripChordTokenDecoration(token);
    return raw && !CHORD_LINE_SEPARATOR_PATTERN.test(raw);
  });

  if (!meaningfulTokens.length) return false;
  const chordCount = meaningfulTokens.filter((token) => {
    const { raw } = stripChordTokenDecoration(token);
    return ChordParser.isChord(raw);
  }).length;

  return chordCount > 0 && chordCount / meaningfulTokens.length >= 0.6;
}

export function findBareChordMatches(value = "") {
  const line = String(value || "");
  if (!isChordLine(line)) return [];

  const bracketRanges = Array.from(
    line.matchAll(new RegExp(
      BRACKETED_CHORD_PATTERN.source,
      BRACKETED_CHORD_PATTERN.flags,
    )),
    (match) => ({ start: match.index, end: match.index + match[0].length }),
  );

  return Array.from(line.matchAll(/\S+/g)).flatMap((match) => {
    const { raw, offset } = stripChordTokenDecoration(match[0]);
    if (!ChordParser.isChord(raw)) return [];

    const start = match.index + offset;
    const end = start + raw.length;
    const isBracketed = bracketRanges.some(
      (range) => start >= range.start && end <= range.end,
    );
    return isBracketed ? [] : [{ raw, start, end }];
  });
}

export function isTablatureLine(value = "") {
  const line = String(value || "");
  return (
    TABLATURE_WITH_PIPE_PATTERN.test(line) ||
    TABLATURE_WITHOUT_PIPE_PATTERN.test(line)
  );
}

export function isTablatureTechniqueLine(value = "") {
  return TABLATURE_TECHNIQUE_PATTERN.test(String(value || ""));
}

export function getBassTabStringLabel(value = "") {
  return String(value || "").match(BASS_TAB_STRING_PATTERN)?.[1]?.toUpperCase() || null;
}

export function isTablatureBlock(value = "") {
  return String(value || "").split(/\r?\n/).filter(isTablatureLine).length >= 2;
}
