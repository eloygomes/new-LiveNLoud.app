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

  // Função para detectar se a linha contém acordes (notas)
  const containsChord = (line) => {
    const chordPattern =
      /(^|\s)([A-G][#b]?m?(sus|add|dim|aug|maj|min|[0-9])*(\/[A-G][#b]?)?)(\s|$)/g;
    return chordPattern.test(line.trim());
  };

  // Função para envolver as notas musicais com a classe `notespresentation`
  const addClassToChords = (line) => {
    const chordPattern =
      /(^|\s)([A-G][#b]?m?(maj7?|sus[24]?|add|dim|aug|7|9|11|13|m7|maj|min|6|5)?(\/[A-G][#b]?)?)(\s|$)/g;
    return line.replace(chordPattern, (match, p1, chord, p3) => {
      return `${p1}<span class="notespresentation">${chord}</span>`;
    });
  };

  // Função para processar a cifra linha por linha e dividir em seções
  const splitSections = (cifra) => {
    if (typeof cifra !== "string" || cifra.length === 0) {
      console.error("Cifra inválida ou vazia");
      return [];
    }

    const lines = cifra.split("\n");
    const sections = [];
    let currentSection = { label: null, content: "", type: "text" };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const labelMatch = line.match(/^\s*\[(.+?)\]\s*$/);
      if (labelMatch) {
        // Salva a seção atual antes de iniciar uma nova
        if (currentSection.content.trim()) {
          sections.push({
            ...currentSection,
            content: currentSection.content.trim(),
          });
        }
        // Inicia uma nova seção com o rótulo detectado
        const label = labelMatch[1];
        currentSection = {
          label: label,
          content: "",
          type: getClassFromLabel(label),
        };
        continue;
      }

      // Verifica se a linha contém acordes (notas) e adiciona a classe `notespresentation`
      if (containsChord(line)) {
        currentSection.content += addClassToChords(line) + "\n";
      } else {
        currentSection.content += line + "\n";
      }
    }

    // Adiciona a última seção
    if (currentSection.content.trim()) {
      sections.push({
        ...currentSection,
        content: currentSection.content.trim(),
      });
    }

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

  // Retorna um objeto com as seções formatadas em HTML
  return {
    htmlBlocks: formattedSections,
  };
};
