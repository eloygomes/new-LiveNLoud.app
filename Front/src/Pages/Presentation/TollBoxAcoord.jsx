/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { IoChevronForward, IoChevronBack } from "react-icons/io5";

import ScrollControlPanel from "./ScrollControlPanel";
import ToolBoxMini from "./ToolBoxMini";
import ToolBoxTunerMini from "./ToolBoxTunerMini";
import ToolBoxChordLibraryMini from "./ToolBoxChordLibraryMini";
import ToolBoxEditControls from "./ToolBoxEditControls";
import SongInstrumentNotes from "../SongInstrumentNotes";

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
  onToggleMarksVisibility,
  progressionBadgeSide = "right",
  transposeSteps = 0,
  setTransposeSteps,
  displayKey = "--",
  showProgressionMarkers = false,
  isTouchLayout = false,
  closeToolBox,
  activeTouchPanel,
  setActiveTouchPanel,
  touchFontSizeLabel = "100%",
  decreaseTouchFontSize,
  increaseTouchFontSize,
  setNotesModalStatus,
  onOpenInstrumentNotes,
  instrumentNotes = "",
  onInstrumentNotesChange,
  onSaveInstrumentNotes,
  isSavingNotes = false,
  onSelectInstrument = () => {},
  onChangeProgressionBadgeSide,
  activeProgressionMarkSettings,
  onDecreaseActiveMarkWidth,
  onIncreaseActiveMarkWidth,
  onDecreaseActiveMarkHeight,
  onIncreaseActiveMarkHeight,
}) {
  const [instLinkPageStatus, setInstLinkPageStatus] = useState({}); // Armazena quais instrumentos estão ativos (true/false)

  // Estados para controlar qual ferramenta está ativa
  const [TunerStatus, setTunerStatus] = useState(false);
  const [MetronomeStatus, setMetronomeStatus] = useState(true);
  const [ChordLibraryStatus, setChordLibraryStatus] = useState(false);
  const [activeDesktopPanel, setActiveDesktopPanel] = useState(null);

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
    setActiveTouchPanel?.("panel-editor");
  };

  const handleTouchSave = async () => {
    await handleSaveCifra();
    setActiveTouchPanel?.(null);
    closeToolBox?.();
  };

  const handleTouchDiscard = () => {
    handleDiscardDraft();
    setActiveTouchPanel?.(null);
    closeToolBox?.();
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
      onToggleMarksVisibility={onToggleMarksVisibility}
      touchFontSizeLabel={touchFontSizeLabel}
      showProgressionMarkers={showProgressionMarkers}
      progressionBadgeSide={progressionBadgeSide}
      onChangeProgressionBadgeSide={onChangeProgressionBadgeSide}
      onDecreaseFontSize={decreaseTouchFontSize}
      onIncreaseFontSize={increaseTouchFontSize}
      activeProgressionMarkSettings={activeProgressionMarkSettings}
      onDecreaseActiveMarkWidth={onDecreaseActiveMarkWidth}
      onIncreaseActiveMarkWidth={onIncreaseActiveMarkWidth}
      onDecreaseActiveMarkHeight={onDecreaseActiveMarkHeight}
      onIncreaseActiveMarkHeight={onIncreaseActiveMarkHeight}
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
                onClick={() => onSelectInstrument(key)}
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

  const renderTransposeContent = () => (
    <div className={isTouchLayout ? "space-y-3" : " space-y-3"}>
      <div className="py-3 text-black">
        <div className="text-center text-[0.7rem] font-black uppercase tracking-[0.14em] text-black/55">
          Tom
        </div>
        <div className="mt-3 flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            className="neuphormism-b-btn flex h-8 w-28 items-center justify-center rounded-[14px] text-xl font-black text-black"
            onClick={() => setTransposeSteps?.((value) => value + 1)}
            aria-label="Transpose up"
          >
            +
          </button>
          <div className="min-w-0 py-3 text-center">
            <div className="text-[2rem] font-black leading-none">
              {displayKey}
            </div>
            <div className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-black/55">
              {transposeSteps > 0
                ? `+${transposeSteps} semitons`
                : `${transposeSteps} semitons`}
            </div>
          </div>
          <button
            type="button"
            className="neuphormism-b-btn flex h-8 w-28 items-center justify-center rounded-[14px] text-xl font-black text-black"
            onClick={() => setTransposeSteps?.((value) => value - 1)}
            aria-label="Transpose down"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );

  const renderLayoutContent = () => (
    <div className={isTouchLayout ? "space-y-3" : "space-y-3"}>
      <div className="flex flex-col items-start gap-2 rounded-[14px] px-1 py-1">
        <div className="text-sm font-black text-black">
          Progression marks
        </div>
        <button
          type="button"
          className={`w-full rounded-[14px] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] ${
            showProgressionMarkers
              ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
              : isTouchLayout
                ? "bg-white text-black"
                : "neuphormism-b-se text-black"
          }`}
          onClick={() => onToggleMarksVisibility?.()}
        >
          {showProgressionMarkers ? "On" : "Off"}
        </button>
      </div>
    </div>
  );

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
    <div className={isTouchLayout ? "" : "my-4"}>
      <ScrollControlPanel isTouchLayout={isTouchLayout} />
    </div>
  );

  const renderNotesContent = () => (
    <div className={isTouchLayout ? "" : "my-3"}>
      <button
        type="button"
        className={
          isTouchLayout
            ? "w-full rounded-[14px] bg-white px-3 py-3 text-left text-sm font-bold text-black"
            : "neuphormism-b-btn-gold w-full rounded-[14px] bg-[goldenrod] px-3 py-3 text-center text-sm font-black text-black"
        }
        onClick={() => {
          if (isTouchLayout) {
            setActiveTouchPanel?.("panel-notes");
            return;
          }
          if (typeof onOpenInstrumentNotes === "function") {
            onOpenInstrumentNotes();
            return;
          }
          setNotesModalStatus?.(true);
        }}
      >
        Open Notes
      </button>
    </div>
  );

  const hasVideos = embedLinks.length > 0;
  const sections = [
    {
      id: "panel-editor",
      label: "Editor",
      content: renderEditorContent(),
      open: openTouchEditorDetails,
    },
    {
      id: "panel-transpose",
      label: "Transpose",
      content: renderTransposeContent(),
    },
    {
      id: "panel-notes",
      label: "Notes",
      content: isTouchLayout ? (
        <SongInstrumentNotes
          instrumentName={instrumentSelected}
          title={`${instrumentSelected} notes`}
          value={instrumentNotes}
          onChange={onInstrumentNotesChange}
          onSave={onSaveInstrumentNotes}
          isSaving={isSavingNotes}
          mobile
        />
      ) : (
        renderNotesContent()
      ),
    },
    {
      id: "panel1",
      label: "Instruments",
      content: renderInstrumentsContent(),
    },
    {
      id: "panel-layout",
      label: "Layout",
      content: renderLayoutContent(),
    },
    {
      id: "panel-font",
      label: "Font Size",
      content: renderFontSizeContent(),
    },
    ...(hasVideos
      ? [{ id: "panel2", label: "Videos", content: renderVideosContent() }]
      : []),
    { id: "panel4", label: "Highlight", content: renderHighlightContent() },
    { id: "panel5", label: "Tools", content: renderToolsContent() },
    { id: "panel6", label: "Scrolling", content: renderScrollingContent() },
  ];

  if (isTouchLayout) {
    const touchSections = [
      {
        id: "panel-editor",
        label: "Editor",
        content: renderEditorContent(),
        open: openTouchEditorDetails,
      },
      {
        id: "panel-transpose",
        label: "Transpose",
        content: renderTransposeContent(),
      },
      {
        id: "panel-layout",
        label: "Layout",
        content: renderLayoutContent(),
      },
      {
        id: "panel-font",
        label: "Font Size",
        content: renderFontSizeContent(),
      },
      {
        id: "panel-notes",
        label: "Notes",
        content: (
          <SongInstrumentNotes
            instrumentName={instrumentSelected}
            title={`${instrumentSelected} notes`}
            value={instrumentNotes}
            onChange={onInstrumentNotesChange}
            onSave={onSaveInstrumentNotes}
            isSaving={isSavingNotes}
            mobile
          />
        ),
      },
      {
        id: "panel1",
        label: "Instruments",
        content: renderInstrumentsContent(),
      },
      ...(hasVideos
        ? [{ id: "panel2", label: "Videos", content: renderVideosContent() }]
        : []),
      { id: "panel4", label: "Highlight", content: renderHighlightContent() },
      { id: "panel5", label: "Tools", content: renderToolsContent() },
      { id: "panel6", label: "Scrolling", content: renderScrollingContent() },
    ];

    const activeSection = touchSections.find(
      (section) => section.id === activeTouchPanel,
    );

    if (activeSection?.id === "panel-editor") {
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

    if (activeSection) {
      return (
        <div className="space-y-4">
          <div className="mb-1 text-[1.5rem] font-black tracking-tight text-black">
            {activeSection.label}
          </div>
          {activeSection.content}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {touchSections.map((section) => {
          const shouldBlinkEditor =
            section.id === "panel-editor" &&
            isEditing &&
            activeTouchPanel !== "panel-editor";
          return (
            <div key={section.id}>
              <button
                type="button"
                className={`neuphormism-b-btn flex w-full items-center justify-between rounded-[14px] px-4 py-3 text-left text-lg font-black text-black shadow-[0_4px_10px_rgba(0,0,0,0.04)] ${
                  shouldBlinkEditor
                    ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite] bg-[#ececec]"
                    : "bg-[#ececec]"
                }`}
                onClick={() => {
                  section.open?.();
                  if (!section.open) {
                    setActiveTouchPanel?.(section.id);
                  }
                }}
              >
                <span>{section.label}</span>
                <span className="text-2xl leading-none">+</span>
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  const activeDesktopSection = sections.find(
    (section) => section.id === activeDesktopPanel,
  );

  return (
    <div className="space-y-2">
      {activeDesktopSection ? (
        <div className="neuphormism-b rounded-lg p-2">
          <button
            type="button"
            className="neuphormism-b-btn mb-3 flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-left text-sm font-black text-black"
            onClick={() => setActiveDesktopPanel(null)}
          >
            <IoChevronBack className="h-4 w-4" />
            <span>{activeDesktopSection.label}</span>
          </button>
          <div className="neuphormism-b rounded-[14px] p-2 text-sm font-semibold">
            {activeDesktopSection.id === "panel-editor" ? (
              <div className="max-h-[68vh] overflow-y-auto">
                {activeDesktopSection.content}
              </div>
            ) : (
              activeDesktopSection.content
            )}
          </div>
        </div>
      ) : (
        sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="neuphormism-b flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold text-black"
            onClick={() => {
              section.open?.();
              setActiveDesktopPanel(section.id);
            }}
          >
            <span>{section.label}</span>
            <IoChevronForward className="h-4 w-4" />
          </button>
        ))
      )}
    </div>
  );
}
