/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";

import ScrollControlPanel from "./ScrollControlPanel";
import ToolBoxMini from "./ToolBoxMini";
import ToolBoxTunerMini from "./ToolBoxTunerMini";
import ToolBoxChordLibraryMini from "./ToolBoxChordLibraryMini";
import ToolBoxEditControls from "./ToolBoxEditControls";

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
  setChordModalStatus,
  setChordPreviewData,
  songFromURL,
  artistFromURL,
  instrumentSelected,
  songDataFetched,
  toggleTabsVisibility,
  hideChords,
  setHideChords,
  selectContenttoShow,
  setSelectContenttoShow,
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
  isTouchLayout = false,
  closeToolBox,
  touchFontSizeLabel = "100%",
  decreaseTouchFontSize,
  increaseTouchFontSize,
}) {
  const [expanded, setExpanded] = useState(false); // Estado para controlar o acordeão aberto
  const [instLinkPageStatus, setInstLinkPageStatus] = useState({}); // Armazena quais instrumentos estão ativos (true/false)
  const [showEditorDetails, setShowEditorDetails] = useState(false);
  const [showFontSizeDetails, setShowFontSizeDetails] = useState(false);

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
    if (isTouchLayout) {
      closeToolBox?.();
    }
  };

  const chordLibraryModal = () => {
    setChordModalStatus(true);
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

  const openTouchEditorDetails = () => {
    if (!isEditing && songCifraData) {
      startEditingCifra();
    }
    setShowEditorDetails(true);
  };

  const handleTouchSave = async () => {
    await handleSaveCifra();
    setShowEditorDetails(false);
    closeToolBox?.();
  };

  const handleTouchDiscard = () => {
    handleDiscardDraft();
    setShowEditorDetails(false);
    closeToolBox?.();
  };

  const openTouchFontSizeDetails = () => {
    setShowFontSizeDetails(true);
  };

  const renderEditorContent = () => (
    <ToolBoxEditControls
      isEditing={isEditing}
      isSavingCifra={isSavingCifra}
      hasDraftChanges={hasDraftChanges}
      songCifraData={songCifraData}
      handleSaveCifra={handleSaveCifra}
      handleDiscardDraft={handleDiscardDraft}
      startEditingCifra={startEditingCifra}
    />
  );

  const renderInstrumentsContent = () => (
    <ul className={isTouchLayout ? "grid grid-cols-2 gap-2" : "mb-5"}>
      {chunkedInstruments.map((row, rowIndex) => (
        <li
          key={rowIndex}
          className={
            isTouchLayout ? "contents" : "hover:font-semibold flex flex-row"
          }
        >
          {row.map((instrument) => {
            const { key, label } = instrument;
            const isActive = instLinkPageStatus[key];
            const isSelected = key === instrumentSelected;
            const sharedClass = isTouchLayout
              ? "rounded-[14px] px-3 py-3 text-sm font-black"
              : "w-1/2 p-2 m-2 text-sm";
            return isActive ? (
              <button
                key={key}
                onClick={() => {
                  window.location.href = `/presentation/${artistFromURL}/${songFromURL}/${key}`;
                }}
                className={`${sharedClass} ${
                  isSelected
                    ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(218,165,32,0.28)]"
                    : isTouchLayout
                      ? "bg-[#ececec] text-black"
                      : "neuphormism-b-btn"
                } flex justify-center items-center rounded text-center`}
              >
                {label}
              </button>
            ) : (
              <button
                key={key}
                type="button"
                className={`${sharedClass} ${isTouchLayout ? "bg-[#ececec] text-gray-400" : "neuphormism-b-btn-desactivated"}`}
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
  );

  const renderVideosContent = () => (
    <ul>
      {embedLinks.map((link, index) => (
        <li
          key={index}
          className={
            isTouchLayout ? "mb-2" : "hover:font-semibold flex flex-row"
          }
        >
          <button
            type="button"
            className={
              isTouchLayout
                ? "w-full rounded-[14px] bg-white px-3 py-3 text-left text-sm font-bold text-black"
                : "neuphormism-b-se  py-2 w-full m-2 text-sm"
            }
            onClick={() => handlePlayClick(link)}
          >
            video {index + 1}
          </button>
        </li>
      ))}
    </ul>
  );

  const renderHighlightContent = () => {
    const activeHighlight = selectContenttoShow || "default";
    const options = [
      { value: "full", activeValues: ["default", "full"], label: "original" },
      { value: "tabs", activeValues: ["tabs"], label: "tabs" },
      { value: "chords", activeValues: ["chords"], label: "notes" },
    ];

    return (
      <ul className={isTouchLayout ? "space-y-4" : "m-2 space-y-3"}>
        {options.map((option) => {
          const isSelected = option.activeValues.includes(activeHighlight);
          return (
            <li key={option.value} className="hover:font-semibold">
              <button
                type="button"
                className={
                  isSelected
                    ? "neuphormism-b-btn-gold w-full rounded-[14px] bg-[goldenrod] px-3 py-3 text-left text-sm font-black text-black"
                    : isTouchLayout
                      ? "w-full rounded-[14px] bg-white px-3 py-3 text-left text-sm font-bold text-black"
                      : "neuphormism-b-se w-full rounded-[14px] px-3 py-3 text-left text-sm font-bold text-black"
                }
                onClick={() => {
                  setSelectContenttoShow(option.value);
                }}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderFontSizeContent = () => (
    <div className="rounded-[18px] px-1 py-3">
      <div className=" flex h-9 w-full pb-8 pt-3  min-w-0 flex-1 items-center justify-center rounded-[14px] px-2 text-center text-[0.95rem] font-black leading-none tracking-tight text-black">
        {touchFontSizeLabel}
      </div>
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          className="neuphormism-b-btn flex h-9 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.25rem] font-black leading-none text-black active:scale-[0.98]"
          onClick={decreaseTouchFontSize}
          aria-label="Decrease font size"
        >
          -
        </button>

        <button
          type="button"
          className="neuphormism-b-btn flex h-9 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.25rem] font-black leading-none text-black active:scale-[0.98]"
          onClick={increaseTouchFontSize}
          aria-label="Increase font size"
        >
          +
        </button>
      </div>
    </div>
  );

  const renderToolsContent = () => (
    <ul className={isTouchLayout ? "space-y-2" : "my-5"}>
      {TunerStatus && (
        <div className="block">
          <ToolBoxTunerMini />
        </div>
      )}
      {MetronomeStatus && (
        <div className="block">
          <ToolBoxMini bpm={bpm} />
        </div>
      )}
      {ChordLibraryStatus && (
        <div className="block">
          <ToolBoxChordLibraryMini
            onOpenPreview={(previewData) => {
              setChordPreviewData(previewData);
              chordLibraryModal();
            }}
          />
        </div>
      )}
      <li className="hover:font-semibold">
        <button
          type="button"
          className={`w-full ${isTouchLayout ? "rounded-[14px] px-3 py-3 text-left text-sm font-bold" : "my-2 py-2"} ${
            TunerStatus
              ? "neuphormism-b-btn-gold text-black bg-[#d9ad26] "
              : isTouchLayout
                ? "bg-white text-black"
                : "neuphormism-b-se"
          }`}
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
          className={`w-full ${isTouchLayout ? "rounded-[14px] px-3 py-3 text-left text-sm font-bold" : "my-2 py-2"} ${
            MetronomeStatus
              ? "neuphormism-b-btn-gold text-black bg-[#d9ad26] "
              : isTouchLayout
                ? "bg-white text-black"
                : "neuphormism-b-se"
          }`}
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
          className={`w-full ${isTouchLayout ? "rounded-[14px] px-3 py-3 text-left text-sm font-bold" : "my-2 py-2"} ${
            ChordLibraryStatus
              ? "neuphormism-b-btn-gold text-black bg-[#d9ad26] "
              : isTouchLayout
                ? "bg-white text-black"
                : "neuphormism-b-se"
          }`}
          onClick={() => {
            setTunerStatus(false);
            setMetronomeStatus(false);
            setChordLibraryStatus(true);
            chordLibraryModal();
          }}
        >
          chord library
        </button>
      </li>
    </ul>
  );

  const renderScrollingContent = () => (
    <div className={isTouchLayout ? "rounded-[16px] bg-[#ececec] p-3" : "my-4"}>
      <ScrollControlPanel />
    </div>
  );

  if (isTouchLayout) {
    if (showEditorDetails) {
      return (
        <div className="space-y-4">
          <div className="mb-1 text-[1.5rem] font-black tracking-tight text-black">
            Editor
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-[14px] bg-[goldenrod] px-4 py-3 text-center text-lg font-black text-black disabled:opacity-50"
              onClick={handleTouchSave}
              disabled={isSavingCifra || !hasDraftChanges}
            >
              {isSavingCifra ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="rounded-[14px] bg-white px-4 py-3 text-center text-lg font-black text-black shadow-[0_4px_10px_rgba(0,0,0,0.04)] disabled:opacity-50"
              onClick={handleTouchDiscard}
              disabled={isSavingCifra}
            >
              Discard
            </button>
          </div>
        </div>
      );
    }

    if (showFontSizeDetails) {
      return (
        <div className="space-y-4">
          <div className="mb-1 text-[1.5rem] font-black tracking-tight text-black">
            Font Size
          </div>
          {renderFontSizeContent()}
        </div>
      );
    }

    const sections = [
      { id: "panel-editor", label: "Editor", content: renderEditorContent() },
      {
        id: "panel-font",
        label: "Font Size",
        content: renderFontSizeContent(),
      },
      {
        id: "panel1",
        label: "Instruments",
        content: renderInstrumentsContent(),
      },
      { id: "panel2", label: "Videos", content: renderVideosContent() },
      { id: "panel4", label: "Highlight", content: renderHighlightContent() },
      { id: "panel5", label: "Tools", content: renderToolsContent() },
      { id: "panel6", label: "Scrolling", content: renderScrollingContent() },
    ];

    return (
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = expanded === section.id;
          const shouldBlinkEditor =
            section.id === "panel-editor" && isEditing && !showEditorDetails;
          return (
            <div key={section.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-[14px] px-4 py-3 text-left text-lg font-black text-black shadow-[0_4px_10px_rgba(0,0,0,0.04)] ${
                  shouldBlinkEditor
                    ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite] bg-[#ececec]"
                    : "bg-[#ececec]"
                }`}
                onClick={() => {
                  if (section.id === "panel-editor") {
                    openTouchEditorDetails();
                    return;
                  }
                  if (section.id === "panel-font") {
                    openTouchFontSizeDetails();
                    return;
                  }
                  setExpanded(isOpen ? false : section.id);
                }}
              >
                <span>{section.label}</span>
                <span className="text-2xl leading-none">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <div className="mt-2 px-1">{section.content}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <Accordion
        expanded={expanded === "panel-editor"}
        onChange={handleAccordionChange("panel-editor")}
        className="mb-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel-editor-content"
          id="panel-editor-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Editor
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          {renderEditorContent()}
        </AccordionDetails>
      </Accordion>

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
          {renderInstrumentsContent()}
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === "panel-font"}
        onChange={handleAccordionChange("panel-font")}
        className="my-2"
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel-font-content"
          id="panel-font-header"
          className="neuphormism-b text-sm font-semibold py-1 rounded-lg"
        >
          Font Size
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          {renderFontSizeContent()}
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
          Videos
        </AccordionSummary>
        <AccordionDetails className="neuphormism-b text-sm font-semibold">
          {renderVideosContent()}
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
          {renderHighlightContent()}
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
          {renderToolsContent()}
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
          {renderScrollingContent()}
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
