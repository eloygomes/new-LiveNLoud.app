export const processSongCifra = (songCifra) => {
  // Função para dividir a cifra em seções com base nos rótulos
  const splitSections = (cifra) => {
    // Verifica se cifra é uma string válida
    if (typeof cifra !== "string" || cifra.length === 0) {
      console.error("Cifra inválida ou vazia");
      return [];
    }

    // Padrão para identificar rótulos na cifra, ex: [Refrão], [Solo Final]
    const sectionPattern = /\[(.*?)\]/g;
    let sections = [];
    let match;
    let lastIndex = 0;
    let currentLabel = null;

    // Loop para encontrar todas as correspondências do padrão de rótulo
    while ((match = sectionPattern.exec(cifra)) !== null) {
      // Captura o conteúdo entre o último índice e o início do novo rótulo
      if (lastIndex !== match.index) {
        sections.push({
          label: currentLabel,
          content: cifra.slice(lastIndex, match.index).trim(),
        });
      }
      // Atualiza o rótulo atual
      currentLabel = match[1];
      lastIndex = match.index + match[0].length;
    }

    // Adiciona o conteúdo restante após o último rótulo
    if (lastIndex < cifra.length) {
      sections.push({
        label: currentLabel,
        content: cifra.slice(lastIndex).trim(),
      });
    }

    // Retorna apenas as seções que possuem conteúdo
    return sections.filter((section) => section.content);
  };

  // Função para detectar se o conteúdo é uma tablatura (TAB)
  const isTabContent = (content) => {
    const lines = content.split("\n");
    const tabLines = lines.filter((line) => /^\s*(E|B|G|D|A|e)\|/.test(line));
    return tabLines.length >= 3;
  };

  // Função para normalizar strings (remove acentos e transforma em minúsculas)
  const normalizeString = (str) => {
    return str
      .normalize("NFD") // Decompõe caracteres especiais
      .replace(/[\u0300-\u036f]/g, "") // Remove marcas de diacríticos
      .toLowerCase(); // Converte para minúsculas
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
      // ... outros sinônimos
    ],
    verse: [
      "verso",
      "estrofe",
      "parte",
      "seção",
      "secao",
      // ... outros sinônimos
    ],
    chorus: [
      "refrão",
      "refrao",
      "refrão principal",
      // ... outros sinônimos
    ],
    solo: [
      "solo",
      "solo instrumental",
      "solo de guitarra",
      // ... outros sinônimos
    ],
    bridge: [
      "ponte",
      "bridge",
      "transição",
      "transicao",
      // ... outros sinônimos
    ],
    // Você pode adicionar mais classes e sinônimos conforme necessário
  };

  // Função para formatar cada seção da cifra em HTML
  const formatSection = (() => {
    let tabCounter = 0; // Contador para os TABs

    return (section, index) => {
      // Normaliza o rótulo da seção
      const label = section.label ? normalizeString(section.label) : "";
      console.log("label", label);

      // Gera um identificador único para a seção
      const id = `section-${label.replace(/\s+/g, "-")}-${index}`;
      console.log("id", id);

      // Verifica se o conteúdo é uma TAB
      if (isTabContent(section.content)) {
        tabCounter++;
        const tabId = `tab${String(tabCounter).padStart(2, "0")}`;
        return `<pre id="${tabId}" class="tab">${section.content}</pre>`;
      }

      // Função para determinar a classe com base no rótulo
      const getClassFromLabel = (label) => {
        for (const [className, synonyms] of Object.entries(labelMap)) {
          for (const synonym of synonyms) {
            if (label.includes(normalizeString(synonym))) {
              return className;
            }
          }
        }
        // Retorna 'other' se não encontrar correspondência
        return "other";
      };

      // Obtém a classe apropriada para a seção
      const className = getClassFromLabel(label);

      // Retorna a seção formatada em HTML
      return `<pre id="${id}" class="${className}">${section.content}</pre>`;
    };
  })();

  // Função para formatar todas as seções da cifra
  const formatCifra = (sections) =>
    sections.map((section, index) => formatSection(section, index));

  // Divide a cifra em seções
  const sections = splitSections(songCifra);
  console.log("sections", sections);
  // Formata as seções em HTML
  const formattedSections = formatCifra(sections);
  console.log("formattedSections", formattedSections);

  // Retorna um objeto com as seções formatadas em HTML
  return {
    htmlBlocks: formattedSections,
  };
};
