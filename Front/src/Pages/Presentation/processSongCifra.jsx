export const processSongCifra = (songCifra) => {
  // Função para normalizar strings (remove acentos e transforma em minúsculas)
  const normalizeString = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Mapeamento de classes para seus sinônimos
  const labelMap = {
    intro: [
      "intro",
      "abertura",
      "inicio",
      "início",
      "preludio",
      "prelúdio",
      "introduction",
    ],
    verse: [
      "verso",
      "estrofe",
      "parte",
      "seção",
      "secao",
      "verse",
      "part",
      "section",
    ],
    chorus: ["refrão", "refrao", "refrão principal", "chorus", "main chorus"],
    solo: ["solo", "solo instrumental", "solo de guitarra", "guitar solo"],
    bridge: ["ponte", "bridge", "transição", "transicao", "transition"],
    tab: [
      "tab",
      "tablatura",
      "riff",
      "tab - intro",
      "tab - riff",
      "tab - final",
      "tab - solo",
    ],
    outro: ["final", "outro", "conclusão", "conclusao", "ending"],
    preChorus: [
      "pré-refrão",
      "pre-refrão",
      "prerefrão",
      "prerefrao",
      "pre-chorus",
    ],
  };

  // Função para determinar a classe com base no rótulo
  const getClassFromLabel = (label) => {
    const normalizedLabel = normalizeString(label);
    for (const [className, synonyms] of Object.entries(labelMap)) {
      for (const synonym of synonyms) {
        if (normalizedLabel.includes(normalizeString(synonym))) {
          return className;
        }
      }
    }
    return "other";
  };

  // Função para detectar se a linha é parte de uma tablatura (TAB)
  const isTabLine = (line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return false;

    // Padrão para detectar linhas que começam com nomes de cordas seguidas por '|'
    const tabLinePattern = /^[eEADGBe][|].*$/;
    if (tabLinePattern.test(trimmedLine)) return true;

    // Padrão para linhas que consistem principalmente de '-', '|', números e espaços
    const tabContentPattern = /^[\s|\-\d~\\/hp()*x]+$/i;
    if (tabContentPattern.test(trimmedLine)) return true;

    return false;
  };

  // Função para detectar se a linha contém acordes
  const containsChord = (line) => {
    const chordPattern =
      /(^|\s)[A-G][#b]?m?(sus|add|dim|aug|maj|min|[0-9])*(\/[A-G][#b]?)?(\s|$)/g;
    return chordPattern.test(line.trim());
  };

  // Função para processar a cifra linha por linha e dividir em seções
  // const splitSections = (cifra) => {
  //   // Verifica se a cifra é uma string válida
  //   if (typeof cifra !== "string" || cifra.length === 0) {
  //     console.error("Cifra inválida ou vazia");
  //     return [];
  //   }

  //   // Divide a cifra em linhas
  //   const lines = cifra.split("\n");

  //   // Array para armazenar as seções
  //   const sections = [];

  //   // Objeto para a seção atual
  //   let currentSection = null;

  //   // Função para verificar se a linha é um rótulo (label)
  //   const isLabelLine = (line) => {
  //     return /^\s*\[.+?\]/.test(line.trim());
  //   };

  //   // Percorre cada linha da cifra
  //   for (let i = 0; i < lines.length; i++) {
  //     let line = lines[i];

  //     // Remove espaços em branco no início e no fim
  //     let trimmedLine = line.trim();

  //     // Se a linha estiver vazia, continua para a próxima
  //     if (trimmedLine.length === 0) {
  //       continue;
  //     }

  //     // Verifica se a linha é "tom:"
  //     if (trimmedLine.toLowerCase().startsWith("tom:")) {
  //       // Se existe uma seção atual com conteúdo, adiciona essa seção ao array
  //       if (currentSection && currentSection.content.trim()) {
  //         sections.push({
  //           ...currentSection,
  //           content: currentSection.content.trim(),
  //         });
  //       }

  //       // Inicia uma nova seção para o "tom"
  //       currentSection = {
  //         label: "tom",
  //         content: line + "\n", // Inclui a linha atual
  //         type: "key", // Tipo "key" para o tom
  //       };

  //       // Avança para a próxima linha
  //       i++;

  //       // Continua adicionando linhas ao "tom" enquanto não for vazia ou um label
  //       while (i < lines.length) {
  //         let nextLine = lines[i];
  //         let trimmedNextLine = nextLine.trim();

  //         // Se a linha está vazia ou é um rótulo, paramos de adicionar
  //         if (trimmedNextLine.length === 0 || isLabelLine(nextLine)) {
  //           i--; // Volta um índice para reprocessar essa linha no próximo loop
  //           break;
  //         }

  //         // Adiciona a linha ao conteúdo da seção "tom"
  //         currentSection.content += nextLine + "\n";

  //         // Avança para a próxima linha
  //         i++;
  //       }

  //       // Adiciona a seção "tom" ao array de seções imediatamente
  //       sections.push({
  //         ...currentSection,
  //         content: currentSection.content.trim(),
  //       });

  //       // Redefine a seção atual para null para não anexar linhas subsequentes
  //       currentSection = null;

  //       // Continua para a próxima iteração
  //       continue;
  //     }

  //     // Verifica se a linha é um rótulo (começa com colchetes [])
  //     if (isLabelLine(trimmedLine)) {
  //       // Se existe uma seção atual com conteúdo, adiciona ao array de seções
  //       if (currentSection && currentSection.content.trim()) {
  //         sections.push({
  //           ...currentSection,
  //           content: currentSection.content.trim(),
  //         });
  //       }

  //       // Extrai o rótulo e o possível conteúdo na mesma linha
  //       const labelMatch = trimmedLine.match(/^\s*\[(.+?)\](.*)$/);
  //       const label = labelMatch[1];
  //       const restOfLine = labelMatch[2];

  //       // Determina o tipo da seção com base no rótulo
  //       const type = getClassFromLabel(label);

  //       // Inicia uma nova seção com o rótulo e tipo
  //       currentSection = {
  //         label: label,
  //         content: line + "\n", // Inclui o rótulo e o possível conteúdo na mesma linha
  //         type: type,
  //       };

  //       // Avança para a próxima linha
  //       i++;

  //       // Continua adicionando linhas à seção atual enquanto não for vazia ou um novo rótulo
  //       while (i < lines.length) {
  //         let nextLine = lines[i];
  //         let trimmedNextLine = nextLine.trim();

  //         // Se a linha está vazia ou é um novo rótulo, paramos de adicionar
  //         if (trimmedNextLine.length === 0 || isLabelLine(nextLine)) {
  //           i--; // Volta um índice para reprocessar essa linha no próximo loop
  //           break;
  //         }

  //         // Adiciona a linha ao conteúdo da seção atual
  //         currentSection.content += nextLine + "\n";

  //         // Avança para a próxima linha
  //         i++;
  //       }

  //       // Não adiciona a seção ao array aqui para permitir adicionar mais linhas se necessário
  //       continue;
  //     }

  //     // Verifica se a linha é uma linha de tablatura (TAB)
  //     if (isTabLine(trimmedLine)) {
  //       // Se a seção atual não for do tipo "tab", salva a seção atual e inicia uma nova
  //       if (!currentSection || currentSection.type !== "tab") {
  //         if (currentSection && currentSection.content.trim()) {
  //           sections.push({
  //             ...currentSection,
  //             content: currentSection.content.trim(),
  //           });
  //         }
  //         currentSection = {
  //           label: null,
  //           content: "",
  //           type: "tab",
  //         };
  //       }
  //       // Adiciona a linha de tablatura ao conteúdo da seção atual
  //       currentSection.content += line + "\n";
  //       continue;
  //     }

  //     // Caso contrário, adiciona a linha à seção atual ou inicia uma nova seção de verso
  //     if (!currentSection) {
  //       // Inicia uma nova seção de verso
  //       currentSection = {
  //         label: null,
  //         content: "",
  //         type: "verse",
  //       };
  //     }

  //     // Adiciona a linha ao conteúdo da seção atual
  //     currentSection.content += line + "\n";
  //   }

  //   // Após o loop, adiciona a última seção ao array de seções
  //   if (currentSection && currentSection.content.trim()) {
  //     sections.push({
  //       ...currentSection,
  //       content: currentSection.content.trim(),
  //     });
  //   }

  //   // Retorna o array de seções divididas
  //   return sections;
  // };

  // Função para processar a cifra linha por linha e dividir em seções
  const splitSections = (cifra) => {
    // Verifica se a cifra é uma string válida
    if (typeof cifra !== "string" || cifra.length === 0) {
      console.error("Cifra inválida ou vazia");
      return [];
    }

    // Divide a cifra em linhas
    const lines = cifra.split("\n");

    // Array para armazenar as seções
    const sections = [];

    // Objeto para a seção atual
    let currentSection = null;

    // Função para verificar se a linha é um rótulo (label)
    const isLabelLine = (line) => {
      return /^\s*\[.+?\]/.test(line.trim());
    };

    // Função para verificar se a linha é uma linha de tab
    const isTabLine = (line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) return false;

      // Padrão para detectar linhas de tab
      const tabLinePattern = /^([eE]?[|].*|.*[-|][-|0-9~\\/hp()*x\s]*)$/;
      return tabLinePattern.test(trimmedLine);
    };

    // Percorre cada linha da cifra
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Remove espaços em branco no início e no fim
      let trimmedLine = line.trim();

      // Verifica se a linha está vazia
      if (trimmedLine.length === 0) {
        // Se estamos em uma seção de tab, uma linha vazia indica o fim do bloco de tab
        if (currentSection && currentSection.type === "tab") {
          // Adiciona a seção atual ao array de seções
          sections.push({
            ...currentSection,
            content: currentSection.content.trim(),
          });
          // Reseta a seção atual
          currentSection = null;
        }
        continue;
      }

      // Verifica se a linha é "tom:"
      if (trimmedLine.toLowerCase().startsWith("tom:")) {
        // [Processamento da seção "tom" conforme antes]

        // Se existe uma seção atual com conteúdo, adiciona essa seção ao array
        if (currentSection && currentSection.content.trim()) {
          sections.push({
            ...currentSection,
            content: currentSection.content.trim(),
          });
        }

        // Inicia uma nova seção para o "tom"
        currentSection = {
          label: "tom",
          content: line + "\n", // Inclui a linha atual
          type: "key", // Tipo "key" para o tom
        };

        // Avança para a próxima linha
        i++;

        // Continua adicionando linhas ao "tom" enquanto não for vazia ou um label
        while (i < lines.length) {
          let nextLine = lines[i];
          let trimmedNextLine = nextLine.trim();

          // Se a linha está vazia ou é um rótulo, paramos de adicionar
          if (trimmedNextLine.length === 0 || isLabelLine(nextLine)) {
            i--; // Volta um índice para reprocessar essa linha no próximo loop
            break;
          }

          // Adiciona a linha ao conteúdo da seção "tom"
          currentSection.content += nextLine + "\n";

          // Avança para a próxima linha
          i++;
        }

        // Adiciona a seção "tom" ao array de seções imediatamente
        sections.push({
          ...currentSection,
          content: currentSection.content.trim(),
        });

        // Redefine a seção atual para null para não anexar linhas subsequentes
        currentSection = null;

        // Continua para a próxima iteração
        continue;
      }

      // Verifica se a linha é um rótulo (começa com colchetes [])
      if (isLabelLine(trimmedLine)) {
        // [Processamento dos rótulos conforme antes]

        // Se existe uma seção atual com conteúdo, adiciona ao array de seções
        if (currentSection && currentSection.content.trim()) {
          sections.push({
            ...currentSection,
            content: currentSection.content.trim(),
          });
        }

        // Extrai o rótulo e o possível conteúdo na mesma linha
        const labelMatch = trimmedLine.match(/^\s*\[(.+?)\](.*)$/);
        const label = labelMatch[1];
        const restOfLine = labelMatch[2];

        // Determina o tipo da seção com base no rótulo
        const type = getClassFromLabel(label);

        // Inicia uma nova seção com o rótulo e tipo
        currentSection = {
          label: label,
          content: line + "\n", // Inclui o rótulo e o possível conteúdo na mesma linha
          type: type,
        };

        // Avança para a próxima linha
        i++;

        // Continua adicionando linhas à seção atual enquanto não for vazia ou um novo rótulo
        while (i < lines.length) {
          let nextLine = lines[i];
          let trimmedNextLine = nextLine.trim();

          // Se a linha está vazia ou é um novo rótulo, paramos de adicionar
          if (trimmedNextLine.length === 0 || isLabelLine(nextLine)) {
            i--; // Volta um índice para reprocessar essa linha no próximo loop
            break;
          }

          // Adiciona a linha ao conteúdo da seção atual
          currentSection.content += nextLine + "\n";

          // Avança para a próxima linha
          i++;
        }

        // Não adiciona a seção ao array aqui para permitir adicionar mais linhas se necessário
        continue;
      }

      // Verifica se a linha é uma linha de tab
      if (isTabLine(trimmedLine)) {
        // Se não estamos em uma seção de tab, iniciamos uma
        if (!currentSection || currentSection.type !== "tab") {
          // Se existe uma seção atual com conteúdo, adiciona ao array de seções
          if (currentSection && currentSection.content.trim()) {
            sections.push({
              ...currentSection,
              content: currentSection.content.trim(),
            });
          }
          // Inicia uma nova seção de tab
          currentSection = {
            label: null,
            content: "",
            type: "tab",
          };
        }
        // Adiciona a linha de tab ao conteúdo da seção atual
        currentSection.content += line + "\n";
        continue;
      } else {
        // Verifica se a linha atual contém acordes
        if (containsChord(trimmedLine)) {
          // Verifica se a próxima linha é uma tab
          if (i + 1 < lines.length && isTabLine(lines[i + 1].trim())) {
            // Inicia uma nova seção de tab se não estivermos em uma
            if (!currentSection || currentSection.type !== "tab") {
              if (currentSection && currentSection.content.trim()) {
                sections.push({
                  ...currentSection,
                  content: currentSection.content.trim(),
                });
              }
              currentSection = {
                label: null,
                content: "",
                type: "tab",
              };
            }
            // Adiciona a linha de acordes à seção de tab
            currentSection.content += line + "\n";
            // Adiciona as linhas de tab seguintes
            i++;
            while (i < lines.length && isTabLine(lines[i].trim())) {
              currentSection.content += lines[i] + "\n";
              i++;
            }
            i--; // Ajusta o índice
            continue;
          } else {
            // Trata como um verso normal
            if (!currentSection || currentSection.type !== "verse") {
              if (currentSection && currentSection.content.trim()) {
                sections.push({
                  ...currentSection,
                  content: currentSection.content.trim(),
                });
              }
              currentSection = {
                label: null,
                content: "",
                type: "verse",
              };
            }
            currentSection.content += line + "\n";
            continue;
          }
        }

        // Se estamos em uma seção de tab e a linha atual não é uma tab, significa que o bloco de tab terminou
        if (currentSection && currentSection.type === "tab") {
          // Adiciona a seção de tab ao array de seções
          sections.push({
            ...currentSection,
            content: currentSection.content.trim(),
          });
          currentSection = null;
        }
      }

      // Caso contrário, adiciona a linha à seção atual ou inicia uma nova seção de verso
      if (!currentSection) {
        // Inicia uma nova seção de verso
        currentSection = {
          label: null,
          content: "",
          type: "verse",
        };
      }

      // Adiciona a linha ao conteúdo da seção atual
      currentSection.content += line + "\n";
    }

    // Após o loop, adiciona a última seção ao array de seções
    if (currentSection && currentSection.content.trim()) {
      sections.push({
        ...currentSection,
        content: currentSection.content.trim(),
      });
    }

    // Retorna o array de seções divididas
    return sections;
  };

  // Função para formatar cada seção da cifra em HTML
  const formatSection = (() => {
    let tabCounter = 0; // Contador para os TABs

    return (section, index) => {
      // Gera um identificador único para a seção
      const label = section.label ? normalizeString(section.label) : "";
      const id = `section-${label.replace(/\s+/g, "-")}-${index}`;

      if (section.type === "tab") {
        tabCounter++;
        const tabId = `tab${String(tabCounter).padStart(2, "0")}`;
        return `<pre id="${tabId}" class="tab">${section.content}</pre>`;
      }

      // Obtém a classe apropriada para a seção
      const className = section.type || "other";

      // Retorna a seção formatada em HTML
      return `<pre id="${id}" class="${className}">${section.content}</pre>`;
    };
  })();

  // Função para formatar todas as seções da cifra
  const formatCifra = (sections) =>
    sections.map((section, index) => formatSection(section, index));

  // Divide a cifra em seções
  const sections = splitSections(songCifra);

  // Formata as seções em HTML
  const formattedSections = formatCifra(sections);

  console.log(formattedSections);

  // Retorna um objeto com as seções formatadas em HTML
  return {
    htmlBlocks: formattedSections,
  };
};
