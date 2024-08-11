import { useState } from "react";
import FAKEDATA from "../../../FAKEDATA";

// Gear Icon
import { FaGear } from "react-icons/fa6";
import ToolBox from "./ToolBox";

const toolBoxBtnStatusChange = (status, setStatus) => {
  if (status === true) setStatus(false);
  if (status === false) setStatus(true);

  console.log(status);
};

const processSongCifra = (songCifra) => {
  const splitSections = (cifra) => {
    // Separar as seções pelo marcador e o conteúdo subsequente
    const sectionPattern = /\[(.*?)\]/g;
    let sections = [];
    let match;
    let lastIndex = 0;

    while ((match = sectionPattern.exec(cifra)) !== null) {
      if (lastIndex !== match.index) {
        sections.push({
          label:
            sections.length > 0 ? sections[sections.length - 1].label : null,
          content: cifra.slice(lastIndex, match.index).trim(),
        });
      }
      sections.push({
        label: match[1],
        content: "",
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cifra.length) {
      sections.push({
        label: sections.length > 0 ? sections[sections.length - 1].label : null,
        content: cifra.slice(lastIndex).trim(),
      });
    }

    return sections.filter((section) => section.content);
  };

  const formatSection = (section, index) => {
    const label = section.label ? section.label.toLowerCase() : "";
    const id = `section-${label.replace(/\s+/g, "-").toLowerCase()}-${index}`;

    if (label.includes("intro")) {
      return `<pre id="${id}" class="intro">${section.content}</pre>`;
    } else if (label.includes("parte") || label.includes("primeira parte")) {
      return `<pre id="${id}" class="verse">${section.content}</pre>`;
    } else if (label.includes("refrão")) {
      ``;
      return `<pre id="${id}" class="chorus">${section.content}</pre>`;
    } else if (label.includes("solo")) {
      return `<pre id="${id}" class="solo">${section.content}</pre>`;
    } else if (label.includes("ponte")) {
      return `<pre id="${id}" class="bridge">${section.content}</pre>`;
    } else {
      return `<pre id="${id}" class="other">${section.content}</pre>`;
    }
  };

  const formatCifra = (sections) =>
    sections.map((section, index) => formatSection(section, index));

  const sections = splitSections(songCifra);
  const formattedSections = formatCifra(sections);

  return {
    htmlBlocks: formattedSections,
  };
};

function Presentation() {
  const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(false);
  const songCifraData = FAKEDATA[0].guitar01.songCifra;

  // Processar o songCifraData usando o algoritmo fornecido
  const { htmlBlocks } = processSongCifra(songCifraData);

  return (
    <div className="flex justify-center h-screen pt-20">
      <ToolBox
        toolBoxBtnStatus={toolBoxBtnStatus}
        setToolBoxBtnStatus={setToolBoxBtnStatus}
        toolBoxBtnStatusChange={toolBoxBtnStatusChange}
      />
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto">
          <div className="flex flex-row justify-between my-5 neuphormism-b p-5">
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold">{FAKEDATA[0].Song}</h1>
              <h1 className="text-4xl font-bold">{FAKEDATA[0].Artist}</h1>
            </div>
            <div
              className="flex neuphormism-b-btn p-6"
              onClick={() =>
                toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
              }
            >
              <FaGear className="w-8 h-8" />
            </div>
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
