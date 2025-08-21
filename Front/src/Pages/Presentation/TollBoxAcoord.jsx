/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";

import FloatingBtns from "./FloatingBtns";
import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";
import ToolBoxMini from "./ToolBoxMini";

// Uma lista de instrumentos, igual ao que você usa em DashList2Items
const instrumentLabels = [
  { key: "guitar01", label: "G1" },
  { key: "guitar02", label: "G2" },
  { key: "bass", label: "B" },
  { key: "keys", label: "K" },
  { key: "drums", label: "D" },
  { key: "voice", label: "V" },
];

// Função auxiliar para agrupar o array em pares [ [item1,item2], [item3,item4], ... ]
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export default function TollBoxAcoord({
  embedLinks,
  setLinktoplay,
  setVideoModalStatus,
  songFromURL,
  artistFromURL,
  instrumentSelected,
  songDataFetched,
  toggleTabsVisibility,
  hideChords,
  setHideChords,
  setSelectContenttoShow,
}) {
  const [expanded, setExpanded] = useState(false); // Estado para controlar o acordeão aberto
  const [instLinkPageStatus, setInstLinkPageStatus] = useState({}); // Armazena quais instrumentos estão ativos (true/false)

  // Estados para controlar qual ferramenta está ativa
  const [TunerStatus, setTunerStatus] = useState(false);
  const [MetronomeStatus, setMetronomeStatus] = useState(true);
  const [ChordLibraryStatus, setChordLibraryStatus] = useState(false);

  useEffect(() => {
    if (songDataFetched && songDataFetched.instruments) {
      setInstLinkPageStatus(songDataFetched.instruments);
    }
  }, [songDataFetched]);

  const handlePlayClick = (url) => {
    setLinktoplay(url);
    setVideoModalStatus(true);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (!songDataFetched || !songDataFetched.instruments) {
    return <div>Carregando...</div>;
  }

  // Montamos um array de arrays, cada subarray com 2 instrumentos (exemplo)
  const chunkedInstruments = chunkArray(instrumentLabels, 2);

  const bpm = "120";

  return (
    <div>
      {/* Accordion para Instruments */}
      <Accordion
        expanded={expanded === "panel1"}
        onChange={handleAccordionChange("panel1")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Instruments
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            {chunkedInstruments.map((row, rowIndex) => (
              <li key={rowIndex} className="hover:font-semibold flex flex-row">
                {row.map((instrument) => {
                  const { key, label } = instrument;
                  const isActive = instLinkPageStatus[key]; // true/false
                  return isActive ? (
                    <button
                      key={key}
                      onClick={() => {
                        window.location.href = `/presentation/${artistFromURL}/${songFromURL}/${key}`;
                      }}
                      className="w-1/2 p-2 m-2 text-sm neuphormism-b-btn flex justify-center items-center rounded text-center"
                    >
                      {label}
                    </button>
                  ) : (
                    <button
                      key={key}
                      type="button"
                      className="w-1/2 p-2 m-2 text-sm neuphormism-b-btn-desactivated"
                      disabled
                      aria-disabled="true"
                    >
                      {label}
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Accordion para Embed Links */}
      <Accordion
        expanded={expanded === "panel2"}
        onChange={handleAccordionChange("panel2")}
        className="my-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Embed link
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            {embedLinks.map((link, index) => (
              <li key={index} className="hover:font-semibold flex flex-row">
                <button
                  type="button"
                  className="neuphormism-b-se w-full p-2 m-2 text-sm"
                  onClick={() => handlePlayClick(link)}
                >
                  watch {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Accordion para Navegação */}
      {/* <Accordion
        expanded={expanded === "panel3"}
        onChange={handleAccordionChange("panel3")}
        className="my-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Navigation
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            <li className="hover:bg-gray-300 neuphormism-b-se p-2 my-3 font-normal">
              <a href="#">intro</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se p-2 my-3 font-normal">
              <a href="#">verse</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se p-2 my-3 font-normal">
              <a href="#">chorus</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se p-2 my-3 font-normal">
              <a href="#">bridge</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se p-2 my-3 font-normal">
              <a href="#">chorus</a>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion> */}

      {/* Accordion para Highlight */}
      <Accordion
        expanded={expanded === "panel4"}
        onChange={handleAccordionChange("panel4")}
        className="my-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4-content"
          id="panel4-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Highlight
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="m-2">
            <li className="hover:font-semibold">
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                // onClick={toggleTabsVisibility}
                onClick={() => {
                  setSelectContenttoShow("full");
                }}
              >
                original
              </button>
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                // onClick={toggleTabsVisibility}
                onClick={() => {
                  setSelectContenttoShow("tabs");
                }}
              >
                tabs
              </button>
            </li>
            <li className="hover:font-semibold">
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                // onClick={toggleTabsVisibility}
                onClick={() => {
                  setSelectContenttoShow("chords");
                }}
              >
                notes
              </button>
            </li>
            <li className="hover:font-semibold">
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                onClick={() => {
                  setSelectContenttoShow("lyrics");
                }}
              >
                lyrics
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Accordion para Tools */}
      <Accordion
        expanded={expanded === "panel5"}
        onChange={handleAccordionChange("panel5")}
        className="my-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel5-content"
          id="panel5-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Tools
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="my-5">
            {/* Renderização Condicional dos Componentes */}
            {TunerStatus && (
              <div className="block">
                {/* Substitua pelo seu componente de Tuner */}
                <div className="p-1 rounded-md mb-2 neuphormism-b">
                  <div className="flex flex-col items-center justify-center h-32">
                    <h1 className="text-xl">Tuner Component</h1>
                  </div>
                </div>
              </div>
            )}
            {MetronomeStatus && (
              <div className="block">
                <ToolBoxMini bpm={bpm} />
              </div>
            )}
            {ChordLibraryStatus && (
              <div className="block">
                {/* Substitua pelo seu componente de Chord Library */}
                <div className="p-1 rounded-md mb-2 neuphormism-b">
                  <div className="flex flex-col items-center justify-center h-32">
                    <h1 className="text-xl">Chord Library Component</h1>
                  </div>
                </div>
              </div>
            )}

            {/* Botões para Alternar os Componentes */}
            <li className="hover:font-semibold">
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                onClick={() => {
                  setTunerStatus(true);
                  setMetronomeStatus(false);
                  setChordLibraryStatus(false);
                }}
              >
                tuner
              </button>
            </li>
            <li className="hover:font-semibold">
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                onClick={() => {
                  setTunerStatus(false);
                  setMetronomeStatus(true);
                  setChordLibraryStatus(false);
                }}
              >
                metronome
              </button>
            </li>
            <li className="hover:font-semibold">
              <button
                type="button"
                className="neuphormism-b-se w-full my-2"
                onClick={() => {
                  setTunerStatus(false);
                  setMetronomeStatus(false);
                  setChordLibraryStatus(true);
                }}
              >
                chord library
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Accordion para Scrolling */}
      <Accordion
        expanded={expanded === "panel6"}
        onChange={handleAccordionChange("panel6")}
        className="my-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel6-content"
          id="panel6-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Scrolling
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <div className="my-5">
            <div className="flex flex-row h-44">
              <div className="border-b-2 border-gray-300 w-full mb-36">
                <div className="flex flex-row text-sm font-semibold py-2">
                  SCROLLING
                </div>
              </div>
              <FloatingBtns />
              <FloatingBtnsAutoScroll />
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
