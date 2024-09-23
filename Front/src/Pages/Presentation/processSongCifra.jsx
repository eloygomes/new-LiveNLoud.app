// export const processSongCifra = (songCifra) => {
//   // Verifica se a cifra é uma string válida
//   if (typeof songCifra !== "string" || songCifra.trim() === "") {
//     console.error("Cifra inválida ou vazia");
//     return { htmlBlocks: [] };
//   }

//   const lines = songCifra.split("\n");
//   const htmlBlocks = [];
//   const tabStartChars = new Set(["E", "A", "D", "G", "B", "e"]);
//   const allNotes = new Set([
//     // Notas maiúsculas
//     "A",
//     "A#",
//     "Ab",
//     "B",
//     "Bb",
//     "C",
//     "C#",
//     "Cb",
//     "D",
//     "D#",
//     "Db",
//     "E",
//     "Eb",
//     "F",
//     "F#",
//     "Fb",
//     "G",
//     "G#",
//     "Gb",

//     // Notas minúsculas
//     "a",
//     "a#",
//     "ab",
//     "b",
//     "bb",
//     "c",
//     "c#",
//     "cb",
//     "d",
//     "d#",
//     "db",
//     "e",
//     "eb",
//     "f",
//     "f#",
//     "fb",
//     "g",
//     "g#",
//     "gb",
//   ]);

//   // Função para verificar se uma linha é uma linha em branco
//   const isBlankLine = (line) => {
//     return line.trim() === "";
//   };

//   // Função para verificar se uma linha é um rótulo de seção
//   const isSectionLabel = (line) => {
//     return line.startsWith("[");
//   };

//   // Função para verificar se uma linha é uma tabulação
//   const isTabLine = (line) => {
//     return (
//       line.length >= 3 &&
//       tabStartChars.has(line[0]) &&
//       line[1] === "|" &&
//       /[0-9\-]/.test(line[2])
//     );
//   };

//   // Função para verificar se uma linha é uma linha de acordes
//   const isChordLine = (line) => {
//     // Regex aprimorada para identificar acordes com extensões numéricas e modificadores
//     const chordPattern =
//       /^(\s*[A-Ga-g][#b]?m?(maj7?|sus[24]?|add|dim|aug|7M?|9|11|13|m7|maj|min|6|5)?(\/[A-Ga-g][#b]?)?\s*)+$/;
//     return chordPattern.test(line);
//   };

//   // Função para envolver as notas musicais com a classe `notespresentation`
//   const addClassToChords = (line) => {
//     // Regex aprimorada para identificar todas as variações de acordes
//     const chordPattern =
//       /([A-Ga-g][#b]?m?(maj7?|sus[24]?|add|dim|aug|7M?|9|11|13|m7|maj|min|6|5)?(\/[A-Ga-g][#b]?)?)/g;
//     return line.replace(chordPattern, (match) => {
//       // Verifica se a correspondência é uma nota válida
//       if (allNotes.has(match)) {
//         return `<span class="notespresentation">${match}</span>`;
//       }
//       return match;
//     });
//   };

//   let i = 0;
//   while (i < lines.length) {
//     const line = lines[i].trim();

//     if (isSectionLabel(line)) {
//       // Trata rótulo de seção
//       htmlBlocks.push(`<pre id="section-${i}" class="mt-3">${line}</pre>`);
//       i++;
//     } else if (isChordLine(line)) {
//       // Linha de acordes
//       let chordLine = addClassToChords(line);
//       let tabBlock = [];

//       // Verifica se as próximas linhas são tabulações
//       let j = i + 1;
//       while (j < lines.length && isTabLine(lines[j].trim())) {
//         tabBlock.push(lines[j].trim());
//         j++;
//       }

//       if (tabBlock.length > 0) {
//         // Combina a linha de acordes com as linhas de tabulação
//         htmlBlocks.push(
//           `<pre id="combined-${i}" class="mt-1">${chordLine}\n${tabBlock.join(
//             "\n"
//           )}</pre>`
//         );
//         i = j; // Pule as linhas processadas
//       } else {
//         // Só a linha de acordes, sem tabulação
//         htmlBlocks.push(`<pre id="chord-${i}" class="mt-1">${chordLine}</pre>`);
//         i++;
//       }
//     } else if (isTabLine(line)) {
//       // Inicia um bloco de tabulação sem notas anteriores
//       let tabBlock = [line];

//       // Coleta até as próximas 5 linhas de tabulação
//       for (let j = 1; j < 6 && i + j < lines.length; j++) {
//         const nextLine = lines[i + j].trim();
//         if (isTabLine(nextLine)) {
//           tabBlock.push(nextLine);
//         } else {
//           break;
//         }
//       }

//       htmlBlocks.push(
//         `<pre id="tab-${i}" class="mt-0">${tabBlock.join("\n")}</pre>`
//       );
//       i += tabBlock.length; // Pula as linhas que já foram processadas
//     } else if (isBlankLine(line)) {
//       // Inicia um bloco de espaço
//       let spaceBlock = [line];

//       htmlBlocks.push(
//         `<pre id="space-${i}" class="my-5">${spaceBlock.join("\n")}</pre>`
//       );
//       i += spaceBlock.length; // Pula as linhas que já foram processadas
//     } else {
//       // Trata linha regular
//       htmlBlocks.push(`<pre id="line-${i}" class="mt-1">${line}</pre>`);
//       i++;
//     }
//   }

//   return {
//     htmlBlocks,
//   };
// };

export const processSongCifra = (songCifra) => {
  // Verifica se a cifra é uma string válida
  if (typeof songCifra !== "string" || songCifra.trim() === "") {
    console.error("Cifra inválida ou vazia");
    return { htmlBlocks: [] };
  }

  const lines = songCifra.split("\n");
  const htmlBlocks = [];
  const tabStartChars = new Set(["E", "A", "D", "G", "B", "e"]);

  // Função para verificar se uma linha é uma linha em branco
  const isBlankLine = (line) => {
    return line.trim() === "";
  };

  // Função para verificar se uma linha é um rótulo de seção
  const isSectionLabel = (line) => {
    return line.startsWith("[");
  };

  // Função para verificar se uma linha é uma tabulação
  const isTabLine = (line) => {
    return (
      line.length >= 3 &&
      tabStartChars.has(line[0]) &&
      line[1] === "|" &&
      // eslint-disable-next-line no-useless-escape
      /[0-9\-]/.test(line[2])
    );
  };

  // Função para verificar se uma linha é uma linha de acordes
  const isChordLine = (line) => {
    // Regex aprimorada para identificar acordes com extensões numéricas e modificadores
    const chordPattern =
      /^(\s*[A-Ga-g][#b]?m?(maj7?|sus[24]?|add|dim|aug|7M?|9|11|13|m7|maj|min|6|5)?(\/[A-Ga-g][#b]?)?\s*)+$/;
    return chordPattern.test(line);
  };

  // Função para envolver as notas musicais com a classe `notespresentation`
  const addClassToChords = (line) => {
    // Regex aprimorada para identificar todas as variações de acordes
    const chordPattern =
      /([A-Ga-g][#b]?m?(maj7?|sus[24]?|add|dim|aug|7M?|9|11|13|m7|maj|min|6|5)?(\/[A-Ga-g][#b]?)?)/g;
    return line.replace(chordPattern, (match) => {
      // Envolver todos os acordes correspondentes com a classe
      return `<span class="notespresentation">${match}</span>`;
    });
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (isSectionLabel(line)) {
      // Trata rótulo de seção
      htmlBlocks.push(`<pre id="section-${i}" class="mt-3">${line}</pre>`);
      i++;
    } else if (isChordLine(line)) {
      // Linha de acordes
      let chordLine = addClassToChords(line);
      let tabBlock = [];

      // Verifica se as próximas linhas são tabulações
      let j = i + 1;
      while (j < lines.length && isTabLine(lines[j].trim())) {
        tabBlock.push(lines[j].trim());
        j++;
      }

      if (tabBlock.length > 0) {
        // Combina a linha de acordes com as linhas de tabulação
        htmlBlocks.push(
          `<pre id="combined-${i}" class="mt-1">${chordLine}\n${tabBlock.join(
            "\n"
          )}</pre>`
        );
        i = j; // Pule as linhas processadas
      } else {
        // Só a linha de acordes, sem tabulação
        htmlBlocks.push(`<pre id="chord-${i}" class="mt-1">${chordLine}</pre>`);
        i++;
      }
    } else if (isTabLine(line)) {
      // Inicia um bloco de tabulação sem notas anteriores
      let tabBlock = [line];

      // Coleta até as próximas 5 linhas de tabulação
      for (let j = 1; j < 6 && i + j < lines.length; j++) {
        const nextLine = lines[i + j].trim();
        if (isTabLine(nextLine)) {
          tabBlock.push(nextLine);
        } else {
          break;
        }
      }

      htmlBlocks.push(
        `<pre id="tab-${i}" class="mt-0">${tabBlock.join("\n")}</pre>`
      );
      i += tabBlock.length; // Pula as linhas que já foram processadas
    } else if (isBlankLine(line)) {
      // Inicia um bloco de espaço
      let spaceBlock = [line];

      htmlBlocks.push(
        `<pre id="space-${i}" class="my-5">${spaceBlock.join("\n")}</pre>`
      );
      i += spaceBlock.length; // Pula as linhas que já foram processadas
    } else {
      // Trata linha regular
      htmlBlocks.push(`<pre id="line-${i}" class="mt-1">${line}</pre>`);
      i++;
    }
  }

  return {
    htmlBlocks,
  };
};
