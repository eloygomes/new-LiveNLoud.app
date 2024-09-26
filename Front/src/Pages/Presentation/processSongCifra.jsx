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

  // Função para verificar se uma linha é uma tabulação
  const isTabLine = (line) => {
    // Verifica se a linha contém pelo menos um caractere de tabulação típico
    return /^[A-Ga-gd][#b]?[-|:\d\s]/.test(line);
  };

  // Regex para identificar acordes complexos iniciados com letra maiúscula
  const chordRegexString =
    "([A-GHJ][#b]?((maj7|7M|maj|min|m|add|sus[24]?|dim7?|aug|[\\d])[d#b]*)*(\\/([A-GHJ][#b]?((maj7|7M|maj|min|m|add|sus[24]?|dim7?|aug|[\\d])[d#b]*)*))?)";

  const chordLineRegex = new RegExp("^\\s*(" + chordRegexString + "\\s*)+$");

  const chordPattern = new RegExp(
    "\\b" + chordRegexString + "\\b(?![a-z])",
    "g"
  );

  // Função para verificar se uma linha é uma linha de acordes
  const isChordLine = (line) => {
    return chordLineRegex.test(line);
  };

  // Função para envolver as notas musicais com a classe `notespresentation`
  const addClassToChords = (line) => {
    return line.replace(chordPattern, (match) => {
      // Verifica se o match é um acorde válido
      if (isChord(match.trim())) {
        return `<span class="notespresentation">${match.trim()}</span>`;
      } else {
        return match;
      }
    });
  };

  // Função para verificar se uma string é um acorde válido
  const isChord = (word) => {
    const chordValidationRegex = new RegExp("^" + chordRegexString + "$");
    return chordValidationRegex.test(word);
  };

  let i = 0;
  const totalLines = lines.length;

  while (i < totalLines) {
    const originalLine = lines[i];
    const line = originalLine.trim();

    try {
      if (isSectionLabel(line)) {
        // Trata rótulo de seção
        htmlBlocks.push(`<pre id="section-${i}" class="mt-3">${line}</pre>`);
      } else if (isChordLine(line)) {
        // Linha de acordes
        let chordLine = addClassToChords(line);
        let tabBlock = [];

        // Verifica se as próximas linhas são tabulações
        let j = i + 1;
        while (j < totalLines && isTabLine(lines[j])) {
          tabBlock.push(lines[j]);
          j++;
        }

        if (tabBlock.length > 0) {
          // Combina a linha de acordes com as linhas de tabulação
          htmlBlocks.push(
            `<pre id="combined-${i}" class="mt-1">${chordLine}\n${tabBlock.join(
              "\n"
            )}</pre>`
          );
          i = j - 1; // Pule as linhas processadas
        } else {
          // Só a linha de acordes, sem tabulação
          htmlBlocks.push(
            `<pre id="chord-${i}" class="mt-1">${chordLine}</pre>`
          );
        }
      } else if (isTabLine(line)) {
        // Inicia um bloco de tabulação
        let tabBlock = [originalLine];

        // Coleta linhas de tabulação subsequentes
        let j = i + 1;
        while (j < totalLines && isTabLine(lines[j])) {
          tabBlock.push(lines[j]);
          j++;
        }

        htmlBlocks.push(
          `<pre id="tab-${i}" class="mt-0">${tabBlock.join("\n")}</pre>`
        );
        i = j - 1; // Pula as linhas que já foram processadas
      } else if (isBlankLine(line)) {
        // Linha em branco
        htmlBlocks.push(`<pre id="space-${i}" class="my-5">${line}</pre>`);
      } else {
        // Trata linha regular (letra da música) com possíveis acordes
        const processedLine = addClassToChords(originalLine);
        htmlBlocks.push(
          `<pre id="line-${i}" class="mt-1">${processedLine}</pre>`
        );
      }
    } catch (error) {
      // Captura e relata erros específicos de processamento
      console.error(`Erro ao processar a linha ${i + 1}: ${error.message}`);
      throw new Error(`Erro ao processar a linha ${i + 1}: ${error.message}`);
    }

    i++;
  }

  return {
    htmlBlocks,
  };
};
