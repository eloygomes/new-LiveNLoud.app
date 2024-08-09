import FAKEDATA from "../../../FAKEDATA";

// Função para processar a cifra da música
const processSongCifra = (songCifra) => {
  const splitSections = (cifra) => {
    const sectionPattern = /\[(.*?)\]/g;
    return cifra.split(sectionPattern).filter(Boolean);
  };

  const formatSection = (section) => {
    if (section.includes("Intro")) {
      return `<pre class="intro">${section}</pre>`;
    } else if (
      section.includes("Parte") ||
      section.includes("Primeira Parte")
    ) {
      return `<pre class="verse">${section}</pre>`;
    } else if (section.includes("Refrão")) {
      return `<pre class="chorus">${section}</pre>`;
    } else if (section.includes("Solo")) {
      return `<pre class="solo">${section}</pre>`;
    } else if (section.includes("Ponte")) {
      return `<pre class="bridge">${section}</pre>`;
    } else {
      return `<pre class="other">${section}</pre>`;
    }
  };

  const formatCifra = (sections) => sections.map(formatSection);

  const sections = splitSections(songCifra);
  const formattedSections = formatCifra(sections);

  return {
    htmlBlocks: formattedSections,
  };
};

function Presentation() {
  const songCifraData = FAKEDATA[0].guitar01.songCifra;

  // Processar o songCifraData usando o algoritmo fornecido
  const { htmlBlocks } = processSongCifra(songCifraData);

  return (
    <div className="flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-col my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">{FAKEDATA[0].Song}</h1>
            <h1 className="text-4xl font-bold">{FAKEDATA[0].Artist}</h1>
          </div>
          <div className="flex flex-col neuphormism-b p-5">
            {htmlBlocks.map((item, index) => (
              <div
                key={index}
                className="flex flex-col"
                dangerouslySetInnerHTML={{
                  __html: item,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Presentation;
