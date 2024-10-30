export const processSongCifra = (songCifra) => {
  // Verifica se a cifra é uma string válida
  if (typeof songCifra !== "string" || songCifra.trim() === "") {
    throw new Error("Cifra inválida ou vazia");
  }

  const lines = songCifra.split("\n");
  const htmlBlocks = [];

  // Função para verificar se uma linha é uma linha em branco
  const isBlankLine = (line) => {
    return line.trim() === "";
  };

  // Função para verificar se uma linha é um rótulo de seção
  const isSectionLabel = (line) => {
    return /^\s*\[.*\]\s*$/.test(line);
  };

  // Função para extrair o nome da seção
  const getSectionName = (line) => {
    const match = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (match) {
      return match[1].trim().toLowerCase().replace(/\s+/g, "-");
    }
    return null;
  };

  // Função para determinar a classe da seção com base no nome
  const getSectionClass = (sectionName) => {
    sectionName = sectionName.toLowerCase();
    if (sectionName.includes("parte") || sectionName.includes("verse")) {
      return "verse";
    } else if (
      sectionName.includes("refrão") ||
      sectionName.includes("chorus")
    ) {
      return "chorus";
    } else if (sectionName.includes("intro")) {
      return "intro";
    } else if (sectionName.includes("solo")) {
      return "solo";
    } else {
      return "section";
    }
  };

  // Função para verificar se uma linha é uma linha de tabulação
  const isTabLine = (line) => {
    return /\|[-\s\d|]*\|?/.test(line);
  };

  // Função para verificar se uma linha contém a palavra "tom"
  const isTomLine = (line) => {
    return line.toLowerCase().includes("tom");
  };

  // Lista de palavras que não são acordes para evitar falsos positivos
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

    // Adicione outras palavras conforme necessário
  ];

  // Regex para identificar acordes, incluindo sustenidos/bemóis após a barra
  const chordRegexString =
    "([A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?(?:\\/[A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?)?)";

  const chordValidationRegex = new RegExp("^" + chordRegexString + "$");

  // Atualiza o chordPattern para capturar acordes corretamente
  // const chordPattern = new RegExp(
  //   "(^|\\s)" + chordRegexString + "(?=\\s|$)",
  //   "g"
  // );

  const chordPattern = new RegExp(
    "(\\b|\\s|[-:])" + chordRegexString + "(?=\\s|$)",
    "g"
  );

  // Função para verificar se uma string é um acorde válido
  const isChord = (word) => {
    if (nonChordWords.includes(word)) {
      return false;
    }
    return chordValidationRegex.test(word);
  };

  // Função para verificar se uma linha é uma linha de acordes
  const isChordLine = (line) => {
    const words = line.trim().split(/\s+/);
    let chordCount = 0;

    for (const word of words) {
      if (isChord(word)) {
        chordCount++;
      }
    }

    // Considera como linha de acordes se mais da metade das palavras forem acordes
    return chordCount / words.length >= 0.6 && chordCount > 0;
  };

  // Função para verificar se uma linha contém pelo menos um acorde
  const containsChord = (line) => {
    const words = line.trim().split(/\s+/);
    for (const word of words) {
      if (isChord(word)) {
        return true;
      }
    }
    return false;
  };

  // Função ajustada para envolver os acordes com a classe `notespresentation`
  const addClassToChords = (line) => {
    return line.replace(chordPattern, (match, p1) => {
      const chord = match.trim();
      if (isChord(chord)) {
        return p1 + `<span class="notespresentation">${chord}</span>`;
      } else {
        return match;
      }
    });
  };

  let i = 0;
  const totalLines = lines.length;

  while (i < totalLines) {
    const originalLine = lines[i];
    const line = originalLine.trim();

    try {
      if (isBlankLine(line)) {
        // Linha em branco
        htmlBlocks.push(
          `<pre id="space-${i}" class="my-5 presentation-blank-line"></pre>`
        );
      } else if (isTomLine(line)) {
        // Linha com "tom"
        let blockContent = line;
        let j = i;

        // Verifica se tem acorde na mesma linha
        if (containsChord(line)) {
          // Já tem acorde na mesma linha
          blockContent = addClassToChords(blockContent);
          htmlBlocks.push(
            `<pre id="tom-${i}" class="presentation-tom">${blockContent}</pre>`
          );
        } else {
          // Procura acorde nas próximas linhas
          let foundChord = false;
          while (!foundChord && j + 1 < totalLines) {
            j++;
            const nextLine = lines[j].trim();
            if (containsChord(nextLine)) {
              blockContent += "\n" + addClassToChords(nextLine);
              foundChord = true;
            } else if (isBlankLine(nextLine) || isSectionLabel(nextLine)) {
              break;
            } else {
              blockContent += "\n" + nextLine;
            }
          }
          htmlBlocks.push(
            `<pre id="tom-${i}" class="presentation-tom">${blockContent}</pre>`
          );
          i = j;
        }
      } else if (isSectionLabel(line)) {
        // Linha com rótulo de seção
        const sectionLabel = line;
        const sectionName = getSectionName(line) || `section-${i}`;
        const sectionClass = getSectionClass(sectionLabel);
        let blockContent = line;
        let j = i;

        // Verifica se tem acorde na mesma linha
        if (containsChord(line)) {
          // Já tem acorde na mesma linha
          blockContent = addClassToChords(blockContent);
          htmlBlocks.push(
            `<pre id="section-${sectionName}-${i}" class="${sectionClass}">${blockContent}</pre>`
          );
        } else {
          // Procura acorde nas próximas linhas
          let foundChord = false;
          while (!foundChord && j + 1 < totalLines) {
            j++;
            const nextLine = lines[j].trim();
            if (containsChord(nextLine)) {
              blockContent += "\n" + addClassToChords(nextLine);
              foundChord = true;
            } else if (isBlankLine(nextLine) || isSectionLabel(nextLine)) {
              break;
            } else {
              blockContent += "\n" + nextLine;
            }
          }
          htmlBlocks.push(
            `<pre id="section-${sectionName}-${i}" class="${sectionClass}">${blockContent}</pre>`
          );
          i = j;
        }
      } else if (isTabLine(line)) {
        // Inicia um bloco de tabulação
        let tabBlock = [originalLine];
        let j = i;

        while (j + 1 < totalLines && isTabLine(lines[j + 1])) {
          j++;
          tabBlock.push(lines[j]);
        }

        // Gera um ID para o tab
        const tabId = `tab${i}`;
        htmlBlocks.push(
          `<pre id="${tabId}" class="tab">\n${tabBlock.join("\n")}</pre>`
        );
        i = j;
      } else if (isChordLine(line)) {
        // Linha de acordes
        let chordLine = addClassToChords(line);
        let lyricLine = "";
        let j = i;

        // Verifica se a próxima linha é letra
        if (j + 1 < totalLines) {
          const nextLine = lines[j + 1].trim();
          if (
            !isChordLine(nextLine) &&
            !isBlankLine(nextLine) &&
            !isSectionLabel(nextLine) &&
            !isTabLine(nextLine)
          ) {
            lyricLine = nextLine;
            j++;
          }
        }

        if (lyricLine) {
          htmlBlocks.push(
            `<pre id="chord-lyric-${i}" class="mt-1 presentation-chord-lyrics">${chordLine}\n${lyricLine}</pre>`
          );
          i = j;
        } else {
          htmlBlocks.push(
            `<pre id="chord-${i}" class="mt-1 presentation-chords">${chordLine}</pre>`
          );
        }
      } else {
        // Linha de letra
        htmlBlocks.push(
          `<pre id="line-${i}" class="mt-1 presentation-lyrics">${line}</pre>`
        );
      }
    } catch (error) {
      console.error(`Erro ao processar a linha ${i + 1}: ${error.message}`);
      throw new Error(`Erro ao processar a linha ${i + 1}: ${error.message}`);
    }

    i++;
  }

  return {
    htmlBlocks,
  };
};
