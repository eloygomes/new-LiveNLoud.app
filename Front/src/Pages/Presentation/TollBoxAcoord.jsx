/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import FloatingBtns from "./FloatingBtns";
import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function TollBoxAcoord({
  embedLinks,
  setLinktoplay,
  setVideoModalStatus,
  songFromURL,
  artistFromURL,
  instrumentSelected,
}) {
  const [expanded, setExpanded] = useState(false); // Estado para controlar o acordeão aberto

  const handlePlayClick = (url) => {
    setLinktoplay(url); // Atualiza o link do vídeo para ser reproduzido
    setVideoModalStatus(true); // Abre o modal do player
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false); // Abre apenas o acordeão clicado, fecha os outros
  };

  return (
    <div>
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
            <li className="hover:font-semibold flex flex-row">
              <button
                type="button"
                className={`w-1/2 p-2 m-2 text-sm ${
                  instrumentSelected === "guitar01"
                    ? "neuphormism-b-btn"
                    : "neuphormism-b-btn-desactivated"
                }`}
              >
                {instrumentSelected === "guitar01" ? (
                  <Link
                    to={`/presentation/${artistFromURL}/${songFromURL}/guitar01}`}
                  >
                    G1
                  </Link>
                ) : (
                  "G1"
                )}
              </button>

              <button
                type="button"
                className={`w-1/2 p-2 m-2 text-sm ${
                  instrumentSelected === "guitar02"
                    ? "neuphormism-b-btn"
                    : "neuphormism-b-btn-desactivated"
                }`}
              >
                {instrumentSelected === "guitar02" ? (
                  <Link
                    to={`/presentation/${artistFromURL}/${songFromURL}/guitar02}`}
                  >
                    G2
                  </Link>
                ) : (
                  "G2"
                )}
              </button>
            </li>
            <li className="hover:font-semibold flex flex-row">
              <button
                type="button"
                className={`w-1/2 p-2 m-2 text-sm ${
                  instrumentSelected === "bass"
                    ? "neuphormism-b-btn"
                    : "neuphormism-b-btn-desactivated"
                }`}
              >
                {instrumentSelected === "bass" ? (
                  <Link
                    to={`/presentation/${artistFromURL}/${songFromURL}/bass}`}
                  >
                    B
                  </Link>
                ) : (
                  "B"
                )}
              </button>

              <button
                type="button"
                className={`w-1/2 p-2 m-2 text-sm ${
                  instrumentSelected === "keys"
                    ? "neuphormism-b-btn"
                    : "neuphormism-b-btn-desactivated"
                }`}
              >
                {instrumentSelected === "keys" ? (
                  <Link
                    to={`/presentation/${artistFromURL}/${songFromURL}/keys}`}
                  >
                    K
                  </Link>
                ) : (
                  "K"
                )}
              </button>
            </li>
            <li className="hover:font-semibold flex flex-row">
              <button
                type="button"
                className={`w-1/2 p-2 m-2 text-sm ${
                  instrumentSelected === "drums"
                    ? "neuphormism-b-btn"
                    : "neuphormism-b-btn-desactivated"
                }`}
              >
                {instrumentSelected === "drums" ? (
                  <Link
                    to={`/presentation/${artistFromURL}/${songFromURL}/drums}`}
                  >
                    D
                  </Link>
                ) : (
                  "D"
                )}
              </button>
              <button
                type="button"
                className={`w-1/2 p-2 m-2 text-sm ${
                  instrumentSelected === "voice"
                    ? "neuphormism-b-btn"
                    : "neuphormism-b-btn-desactivated"
                }`}
              >
                {instrumentSelected === "voice" ? (
                  <Link
                    to={`/presentation/${artistFromURL}/${songFromURL}/voice}`}
                  >
                    V
                  </Link>
                ) : (
                  "V"
                )}
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

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

      <Accordion
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
          Navegation
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          <ul className="mb-5">
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">intro</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">verse</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">chorus</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">bridge</a>
            </li>
            <li className="hover:bg-gray-300 neuphormism-b-se  p-2 my-3 font-normal">
              <a href="#">chorus</a>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

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
              <button type="button" className="neuphormism-b-se w-full my-2">
                notes
              </button>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                lyrics
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

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
            <li className="hover:font-semibold">
              <div className="p-10 rounded-md mb-2 neuphormism-b"></div>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                tuner
              </button>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                metronome
              </button>
            </li>
            <li className="hover:font-semibold">
              <button type="button" className="neuphormism-b-se w-full my-2">
                chord library
              </button>
            </li>
          </ul>
        </AccordionDetails>
      </Accordion>

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
