// fallback seguro + modo estrito opcional
export const processSongCifra = (songCifra, { strict = false } = {}) => {
  const isInvalid =
    typeof songCifra !== "string" ||
    songCifra.trim() === "" ||
    songCifra === "Loading...";

  if (isInvalid) {
    if (strict) {
      // comportamento antigo (quebra)
      throw new Error("Cifra inválida ou vazia");
    }
    // fallback seguro (não quebra a UI)
    return { htmlBlocks: [], meta: { empty: true } };
  }

  const lines = songCifra.split("\n");
  const htmlBlocks = [];

  const totalLines = lines.length;
  let i = 0;

  // parseSectionLabel => detectar algo tipo "[Intro]" e capturar resto
  function parseSectionLabel(line) {
    const regex = /^\s*\[([^\]]+)\](.*)$/;
    const match = line.match(regex);
    if (!match) return null;

    const rawSectionName = match[1].trim();
    const restOfLine = match[2]; // pode conter acordes extras
    return { sectionName: rawSectionName, restOfLine };
  }

  function getSectionClass(sectionName) {
    const lower = sectionName.toLowerCase();
    if (lower.includes("verse") || lower.includes("parte")) return "verse";
    if (lower.includes("refrão") || lower.includes("chorus")) return "chorus";
    if (lower.includes("intro")) return "intro";
    if (lower.includes("solo")) return "solo";
    if (lower.includes("bridge") || lower.includes("ponte")) return "bridge";
    return "section";
  }

  const isBlankLine = (line) => line.trim() === "";
  const isTabLine = (line) => /\|[-\s\d|]*\|?/.test(line);
  const isTomLine = (line) => line.toLowerCase().includes("tom");

  const nonChordWords = [
    "Coração",
    "Dedilhado",
    "Final",
    "Estrofes",
    "Frase",
    "Casta_nhos",
    "Escala",
    "coração",
    "dedilhado",
    "final",
    "estrofes",
    "frase",
    "casta_nhos",
    "escala",
    "Fontes",
  ];

  const chordRegexString =
    "([A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?(?:\\/[A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?)?)";
  const chordValidationRegex = new RegExp("^" + chordRegexString + "$");
  const chordPattern = new RegExp(
    "(\\b|\\s|[-:])" + chordRegexString + "(?=\\s|$)",
    "g"
  );

  function isChord(word) {
    if (nonChordWords.includes(word)) return false;
    return chordValidationRegex.test(word);
  }

  function isChordLine(line) {
    const words = line.trim().split(/\s+/);
    let chordCount = 0;
    for (const w of words) {
      if (isChord(w)) chordCount++;
    }
    return chordCount / words.length >= 0.6 && chordCount > 0;
  }

  function containsChord(line) {
    const words = line.trim().split(/\s+/);
    return words.some((w) => isChord(w));
  }

  function addClassToChords(line) {
    return line.replace(chordPattern, (match, p1) => {
      const chord = match.trim();
      if (isChord(chord)) {
        return p1 + `<span class="notespresentation">${chord}</span>`;
      }
      return match;
    });
  }

  // Processa 1 linha “isolada”
  function processSingleLine(index) {
    const originalLine = lines[index];
    const line = originalLine.trim();

    if (isBlankLine(line)) {
      return {
        html: `<pre id="space-${index}" class="my-5 presentation-blank-line"></pre>`,
        nextIndex: index,
      };
    } else if (isTomLine(line)) {
      let blockContent = line;
      let j = index;
      if (containsChord(line)) {
        blockContent = addClassToChords(blockContent);
        return {
          html: `<pre id="tom-${index}" class="presentation-tom">${blockContent}</pre>`,
          nextIndex: index,
        };
      } else {
        let foundChord = false;
        while (!foundChord && j + 1 < totalLines) {
          j++;
          const nextLine = lines[j].trim();
          if (containsChord(nextLine)) {
            blockContent += "\n" + addClassToChords(nextLine);
            foundChord = true;
          } else if (isBlankLine(nextLine) || parseSectionLabel(nextLine)) {
            j--;
            break;
          } else {
            blockContent += "\n" + nextLine;
          }
        }
        return {
          html: `<pre id="tom-${index}" class="presentation-tom">${blockContent}</pre>`,
          nextIndex: j,
        };
      }
    } else if (isTabLine(line)) {
      let tabBlock = [originalLine];
      let j = index;
      while (j + 1 < totalLines && isTabLine(lines[j + 1])) {
        j++;
        tabBlock.push(lines[j]);
      }
      const tabId = `tab${index}`;
      return {
        html: `<pre id="${tabId}" class="tab">\n${tabBlock.join("\n")}</pre>`,
        nextIndex: j,
      };
    } else if (isChordLine(line)) {
      let chordLine = addClassToChords(line);
      let lyricLine = "";
      let j = index;
      if (j + 1 < totalLines) {
        const nextLine = lines[j + 1].trim();
        if (
          !isChordLine(nextLine) &&
          !isBlankLine(nextLine) &&
          !parseSectionLabel(nextLine) &&
          !isTabLine(nextLine)
        ) {
          lyricLine = nextLine;
          j++;
        }
      }
      if (lyricLine) {
        return {
          html: `<pre id="chord-lyric-${index}" class="mt-1 presentation-chord-lyrics">${chordLine}\n${lyricLine}</pre>`,
          nextIndex: j,
        };
      } else {
        return {
          html: `<pre id="chord-${index}" class="mt-1 presentation-chords">${chordLine}</pre>`,
          nextIndex: index,
        };
      }
    } else {
      // Linha “normal” (lyrics etc.)
      return {
        html: `<pre id="line-${index}" class="mt-1 presentation-lyrics">${line}</pre>`,
        nextIndex: index,
      };
    }
  }

  // Função para agrupar as linhas entre seções em <div class="verse">
  function processVerseBlock(startIndex) {
    const linesGroup = [];
    let j = startIndex;

    while (j < totalLines) {
      const trimmed = lines[j].trim();
      if (parseSectionLabel(trimmed)) break;

      const { html, nextIndex } = processSingleLine(j);
      linesGroup.push(html);
      j = nextIndex + 1;
    }

    const blockHtml = `<div class="verse" id="auto-verse-${startIndex}">
${linesGroup.join("\n")}
</div>`;
    return { blockHtml, nextIndex: j - 1 };
  }

  // Loop principal
  while (i < totalLines) {
    const trimmed = lines[i].trim();
    const labelObj = parseSectionLabel(trimmed);

    if (labelObj) {
      const { sectionName, restOfLine } = labelObj;
      const sectionClass = getSectionClass(sectionName);

      let groupHTML = [];
      let j = i;

      if (restOfLine.trim()) {
        const combined = `[${sectionName}]` + restOfLine;
        const chordLine = addClassToChords(combined);
        groupHTML.push(
          `<pre id="section-label-${i}" class="mt-1 ${sectionClass}">${chordLine}</pre>`
        );
      } else {
        groupHTML.push(
          `<pre id="section-label-${i}" class="mt-1 ${sectionClass}">[${sectionName}]</pre>`
        );
      }

      j++;
      const subsection = [];
      while (j < totalLines) {
        const subLine = lines[j].trim();
        if (parseSectionLabel(subLine)) break;
        if (isBlankLine(subLine)) {
          const { html } = processSingleLine(j);
          subsection.push(html);
          j++;
          break;
        }
        const { html, nextIndex } = processSingleLine(j);
        subsection.push(html);
        j = nextIndex + 1;
      }

      const containerHTML = `<div class="${sectionClass}" id="section-${sectionName}-${i}">
${groupHTML.join("\n")}
${subsection.join("\n")}
</div>`;
      htmlBlocks.push(containerHTML);

      i = j;
    } else {
      if (isBlankLine(trimmed)) {
        const { html, nextIndex } = processSingleLine(i);
        htmlBlocks.push(html);
        i = nextIndex + 1;
      } else {
        const { blockHtml, nextIndex } = processVerseBlock(i);
        htmlBlocks.push(blockHtml);
        i = nextIndex + 1;
      }
    }
  }

  return { htmlBlocks };
};
