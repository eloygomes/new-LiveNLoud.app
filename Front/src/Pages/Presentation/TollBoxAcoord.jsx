/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { FaFilePen, FaSliders } from "react-icons/fa6";
import {
  GiDrumKit,
  GiGuitar,
  GiGuitarBassHead,
  GiMicrophone,
  GiPianoKeys,
} from "react-icons/gi";
import {
  IoArrowDownCircle,
  IoChevronBack,
  IoChevronForward,
  IoDocumentText,
  IoMusicalNotes,
  IoPlayCircle,
  IoSwapVertical,
  IoVideocam,
  IoVideocamOff,
} from "react-icons/io5";

import ScrollControlPanel from "./ScrollControlPanel";
import ToolBoxEditControls from "./ToolBoxEditControls";
import SongInstrumentNotes from "../SongInstrumentNotes";
import GuitarProIcon from "../../components/GuitarPro/GuitarProIcon";

// Uma lista de instrumentos, igual ao que você usa em DashList2Items
const instrumentLabels = [
  { key: "guitar01", label: "Guitar 01", short: "G1", icon: GiGuitar },
  { key: "guitar02", label: "Guitar 02", short: "G2", icon: GiGuitar },
  { key: "bass", label: "Bass", short: "B", icon: GiGuitarBassHead },
  { key: "keys", label: "Keys", short: "K", icon: GiPianoKeys },
  { key: "drums", label: "Drums", short: "D", icon: GiDrumKit },
  { key: "voice", label: "Voice", short: "V", icon: GiMicrophone },
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
  linktoplay,
  onVideoModalChange,
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
  transposeSteps = 0,
  setTransposeSteps,
  displayKey = "--",
  showProgressionMarkers = false,
  isExpandedCifra = false,
  isTouchLayout = false,
  closeToolBox,
  closeToolBoxWithoutDiscard,
  activeTouchPanel,
  setActiveTouchPanel,
  touchFontSizeLabel = "100%",
  decreaseTouchFontSize,
  increaseTouchFontSize,
  blockSpacingLabel = "32px",
  decreaseBlockSpacing,
  increaseBlockSpacing,
  setNotesModalStatus,
  onOpenInstrumentNotes,
  instrumentNotes = "",
  onInstrumentNotesChange,
  onSaveInstrumentNotes,
  isSavingNotes = false,
  onSelectInstrument = () => {},
  onGoToEditSong,
  canOpenGuitarPro = false,
  onOpenGuitarProViewer,
  onEnterLiveMode,
  isTouchVideoActive = false,
  onCloseTouchVideo,
  requestedPanel,
}) {
  const [instLinkPageStatus, setInstLinkPageStatus] = useState({}); // Armazena quais instrumentos estão ativos (true/false)

  const [activeDesktopPanel, setActiveDesktopPanel] = useState(null);

  useEffect(() => {
    if (songDataFetched && songDataFetched.instruments) {
      setInstLinkPageStatus(songDataFetched.instruments);
    }
  }, [songDataFetched]);

  useEffect(() => {
    if (!requestedPanel?.id) return;

    if (isTouchLayout) {
      setActiveTouchPanel?.(requestedPanel.id);
      return;
    }

    setActiveDesktopPanel(requestedPanel.id);
  }, [isTouchLayout, requestedPanel, setActiveTouchPanel]);

  const handlePlayClick = (url) => {
    setLinktoplay(url);
    setVideoModalStatus(true);
  };

  if (!songDataFetched || !songDataFetched.instruments) {
    return <div>Carregando...</div>;
  }

  // Montamos um array de arrays, cada subarray com 2 instrumentos (exemplo)
  const chunkedInstruments = chunkArray(instrumentLabels, 2);

  const openEditorDetails = () => {
    if (!isEditing && songCifraData) {
      startEditingCifra();
    }

    setActiveTouchPanel?.("panel-editor");
  };

  const handleTouchSave = async () => {
    await handleSaveCifra();
    setActiveTouchPanel?.(null);
    closeToolBoxWithoutDiscard?.();
  };

  const handleTouchDiscard = () => {
    handleDiscardDraft();
    setActiveTouchPanel?.(null);
    closeToolBoxWithoutDiscard?.();
  };

  const runTouchAction = (action) => {
    action?.();
  };

  const renderStepControl = ({
    label,
    value,
    decreaseLabel,
    increaseLabel,
    onDecrease,
    onIncrease,
    disabled = false,
  }) => (
    <div
      className={
        isTouchLayout
          ? "rounded-[12px] px-1 py-1"
          : "rounded-[16px] px-1 py-2"
      }
    >
      <div
        className={
          isTouchLayout
            ? "mb-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-black/55"
            : "mb-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-black/55"
        }
      >
        {label}
      </div>
      <div
        className={`grid items-center rounded-[16px] px-1 py-1 ${
          isTouchLayout
            ? "grid-cols-[2.15rem_minmax(0,1fr)_2.15rem] gap-1.5"
            : "grid-cols-[2.6rem_minmax(0,1fr)_2.6rem] gap-2"
        } ${disabled ? "opacity-45" : ""}`}
      >
        <button
          type="button"
          className={
            isTouchLayout
              ? "neuphormism-b-btn flex h-8 w-full items-center justify-center rounded-[12px] text-base font-bold leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
              : "neuphormism-b-btn flex h-10 w-full items-center justify-center rounded-[14px] text-[1.25rem] font-bold leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
          }
          onClick={onDecrease}
          disabled={disabled}
          aria-label={decreaseLabel}
        >
          -
        </button>
        <div
          className={
            isTouchLayout
              ? "min-w-0 rounded-[12px] bg-white/55 px-2 py-2 text-center text-xs font-bold leading-none text-black"
              : "min-w-0 rounded-[14px] bg-white/55 px-2 py-2.5 text-center text-sm font-bold leading-none text-black"
          }
          aria-label={`${label} value`}
        >
          {value}
        </div>
        <button
          type="button"
          className={
            isTouchLayout
              ? "neuphormism-b-btn flex h-8 w-full items-center justify-center rounded-[12px] text-base font-bold leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
              : "neuphormism-b-btn flex h-10 w-full items-center justify-center rounded-[14px] text-[1.25rem] font-bold leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
          }
          onClick={onIncrease}
          disabled={disabled}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  );

  const renderToggleControl = ({
    label,
    active,
    activeText,
    inactiveText,
    onClick,
  }) => (
    <div
      className={
        isTouchLayout
          ? "flex flex-col gap-1.5 rounded-[12px] px-1 py-1"
          : "flex flex-col gap-2 rounded-[16px] px-1 py-2"
      }
    >
      <div
        className={
          isTouchLayout
            ? "text-xs font-bold text-black"
            : "text-sm font-bold text-black"
        }
      >
        {label}
      </div>
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-[14px] font-bold uppercase tracking-[0.1em] transition active:scale-[0.98] ${
          isTouchLayout ? "h-9 px-2.5 text-xs" : "h-[42px] px-3 text-sm"
        } ${
          active
            ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
            : "neuphormism-b-se text-black"
        }`}
        onClick={onClick}
      >
        <span>{active ? activeText : inactiveText}</span>
        <span
          className={`${
            isTouchLayout ? "h-3.5 w-7" : "h-4 w-8"
          } rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] ${
            active ? "bg-[goldenrod]" : "bg-white"
          }`}
        >
          <span
            className={`${
              isTouchLayout ? "h-2.5 w-2.5" : "h-3 w-3"
            } block rounded-full bg-black transition ${
              active ? (isTouchLayout ? "translate-x-3.5" : "translate-x-4") : ""
            }`}
          />
        </span>
      </button>
    </div>
  );

  const renderEditorContent = () => (
    <div className={isTouchLayout ? "space-y-3" : "space-y-4"}>
      <div className={isTouchLayout ? "space-y-2" : "space-y-3"}>
        {renderLayoutContent()}
      </div>
      <ToolBoxEditControls
        isEditing={isEditing}
        isSavingCifra={isSavingCifra}
        hasDraftChanges={hasDraftChanges}
        handleSaveCifra={isTouchLayout ? handleTouchSave : handleSaveCifra}
        handleDiscardDraft={
          isTouchLayout ? handleTouchDiscard : handleDiscardDraft
        }
        isTouchLayout={isTouchLayout}
      />
    </div>
  );

  const renderInstrumentsContent = () => {
    if (isTouchLayout) {
      return (
        <ul className="space-y-2">
          {instrumentLabels.map((instrument) => {
            const { key, label, short, icon: Icon } = instrument;
            const isActive = instLinkPageStatus[key];
            const isSelected = key === instrumentSelected;
            const sharedClass =
              "neuphormism-b-btn flex min-h-10 w-full items-center justify-between rounded-[12px] px-2.5 py-1.5 text-left text-[0.82rem] font-bold shadow-[0_3px_8px_rgba(0,0,0,0.04)]";

            return isActive ? (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectInstrument(key)}
                  className={`${sharedClass} ${
                    isSelected
                      ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(218,165,32,0.28)]"
                      : "bg-[#ececec] text-black"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] font-black uppercase text-black/50">
                    {short}
                  </span>
                </button>
              </li>
            ) : (
              <li key={key}>
                <button
                  type="button"
                  className={`${sharedClass} cursor-not-allowed bg-[#ececec] text-gray-400 opacity-55`}
                  disabled
                  aria-disabled="true"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] font-black uppercase">
                    {short}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <ul className="mb-5">
        {chunkedInstruments.map((row, rowIndex) => (
          <li key={rowIndex} className="hover:font-semibold flex flex-row">
            {row.map((instrument) => {
              const { key, label } = instrument;
              const isActive = instLinkPageStatus[key];
              const isSelected = key === instrumentSelected;
              const sharedClass = "w-1/2 p-2 m-2 text-sm";
              return isActive ? (
                <button
                  key={key}
                  onClick={() => onSelectInstrument(key)}
                  className={`${sharedClass} ${
                    isSelected
                      ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(218,165,32,0.28)]"
                      : "neuphormism-b-btn"
                  } flex justify-center items-center rounded text-center`}
                >
                  {label}
                </button>
              ) : (
                <button
                  key={key}
                  type="button"
                  className={`${sharedClass} neuphormism-b-btn-desactivated`}
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
  };

  const renderVideosContent = () => (
    <ul>
      {isTouchLayout && linktoplay ? (
        <li className="mb-3">
          <ToolBoxYT
            linktoplay={linktoplay}
            setVideoModalStatus={setVideoModalStatus}
            setLinktoplay={setLinktoplay}
            isTouchLayout
            onVideoModalChange={onVideoModalChange}
            renderInline
            iframeHeight={208}
          />
        </li>
      ) : null}
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
                ? "w-full rounded-[12px] bg-white px-3 py-2 text-left text-xs font-bold text-black"
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

  const renderTransposeContent = () => (
    <div className={isTouchLayout ? "space-y-2" : "space-y-3"}>
      <div className={isTouchLayout ? "py-1 text-black" : "py-3 text-black"}>
        <div
          className={
            isTouchLayout
              ? "text-center text-[0.62rem] font-bold uppercase tracking-[0.14em] text-black/55"
              : "text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-black/55"
          }
        >
          Tom
        </div>
        <div
          className={
            isTouchLayout
              ? "mt-3 grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3"
              : "mt-4 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-3"
          }
        >
          <button
            type="button"
            className={
              isTouchLayout
                ? "neuphormism-b-btn flex h-10 w-full items-center justify-center rounded-[12px] text-base font-bold text-black"
                : "neuphormism-b-btn flex h-11 w-full items-center justify-center rounded-[14px] text-xl font-bold text-black"
            }
            onClick={() => setTransposeSteps?.((value) => value - 1)}
            aria-label="Transpose down"
          >
            -
          </button>
          <div
            className={
              isTouchLayout
                ? "min-w-0 py-1.5 text-center"
                : "min-w-0 py-3 text-center"
            }
          >
            <div
              className={
                isTouchLayout
                  ? "text-[1.55rem] font-bold leading-none"
                  : "text-[2rem] font-bold leading-none"
              }
            >
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
            className={
              isTouchLayout
                ? "neuphormism-b-btn flex h-10 w-full items-center justify-center rounded-[12px] text-base font-bold text-black"
                : "neuphormism-b-btn flex h-11 w-full items-center justify-center rounded-[14px] text-xl font-bold text-black"
            }
            onClick={() => setTransposeSteps?.((value) => value + 1)}
            aria-label="Transpose up"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const renderLayoutContent = () => (
    <div className={isTouchLayout ? "space-y-2" : "space-y-3"}>
      {renderStepControl({
        label: "Font size",
        value: touchFontSizeLabel,
        decreaseLabel: "Decrease font size",
        increaseLabel: "Increase font size",
        onDecrease: decreaseTouchFontSize,
        onIncrease: increaseTouchFontSize,
      })}

      {renderStepControl({
        label: "Block spacing",
        value: blockSpacingLabel,
        decreaseLabel: "Decrease block spacing",
        increaseLabel: "Increase block spacing",
        onDecrease: decreaseBlockSpacing,
        onIncrease: increaseBlockSpacing,
      })}

      {renderToggleControl({
        label: "Progression marks",
        active: showProgressionMarkers,
        activeText: "On",
        inactiveText: "Off",
        onClick: onToggleMarksVisibility,
      })}
    </div>
  );

  const renderScrollingContent = () => (
    <div className={isTouchLayout ? "" : "my-4"}>
      <ScrollControlPanel isTouchLayout={isTouchLayout} />
    </div>
  );

  const hasVideos = embedLinks.length > 0;
  const openNotesWindow = () => {
    if (isTouchLayout) {
      setActiveTouchPanel?.("panel-notes");
      return;
    }
    if (typeof onOpenInstrumentNotes === "function") {
      onOpenInstrumentNotes();
      return;
    }
    setNotesModalStatus?.(true);
  };
  const editorSection = {
    id: "panel-editor",
    label: "Editor",
    content: renderEditorContent(),
    open: openEditorDetails,
  };
  const menuSections = [
    {
      id: "panel-transpose",
      label: "Transpose",
      content: renderTransposeContent(),
    },
    {
      id: "panel-notes",
      label: "Notes",
      action: openNotesWindow,
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
      ) : null,
    },
    {
      id: "panel1",
      label: "Instruments",
      content: renderInstrumentsContent(),
    },
    ...(hasVideos
      ? [{ id: "panel2", label: "Videos", content: renderVideosContent() }]
      : []),
    ...(isExpandedCifra
      ? []
      : [{ id: "panel6", label: "Scrolling", content: renderScrollingContent() }]),
  ];
  const sections = [editorSection, ...menuSections];

  if (isTouchLayout) {
    const touchMenuIconClass = "h-4 w-4";
    const editorTouchSection = {
      id: "panel-editor",
      label: "Editor",
      icon: <FaFilePen className={touchMenuIconClass} />,
      content: renderEditorContent(),
      open: openEditorDetails,
    };
    const menuTouchSections = [
      ...(typeof onGoToEditSong === "function"
        ? [
            {
              id: "action-song-settings",
              label: "Song Settings",
              icon: <FaSliders className={touchMenuIconClass} />,
              action: () => runTouchAction(onGoToEditSong),
            },
          ]
        : []),
      ...(instrumentSelected !== "voice" &&
      typeof onOpenGuitarProViewer === "function"
        ? [
            {
              id: "action-guitar-pro",
              label: "Guitar Pro",
              icon: <GuitarProIcon active={canOpenGuitarPro} compact />,
              disabled: !canOpenGuitarPro,
              action: () => runTouchAction(onOpenGuitarProViewer),
            },
          ]
        : []),
      ...(typeof onEnterLiveMode === "function"
        ? [
            {
              id: "action-live",
              label: "LIVE",
              icon: <IoPlayCircle className={touchMenuIconClass} />,
              tone: "gold",
              action: () => {
                runTouchAction(onEnterLiveMode);
                closeToolBoxWithoutDiscard?.();
              },
            },
          ]
        : []),
      ...(isTouchVideoActive && typeof onCloseTouchVideo === "function"
        ? [
            {
              id: "action-close-video",
              label: "Close Video",
              icon: <IoVideocamOff className={touchMenuIconClass} />,
              action: () => runTouchAction(onCloseTouchVideo),
            },
          ]
        : []),
      {
        id: "panel-transpose",
        label: "Transpose",
        icon: <IoSwapVertical className={touchMenuIconClass} />,
        content: renderTransposeContent(),
      },
      {
        id: "panel-notes",
        label: "Notes",
        icon: <IoDocumentText className={touchMenuIconClass} />,
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
        icon: <IoMusicalNotes className={touchMenuIconClass} />,
        content: renderInstrumentsContent(),
      },
      ...(hasVideos
        ? [
            {
              id: "panel2",
              label: "Videos",
              icon: <IoVideocam className={touchMenuIconClass} />,
              content: renderVideosContent(),
            },
          ]
        : []),
      ...(isExpandedCifra
        ? []
        : [
            {
              id: "panel6",
              label: "Scrolling",
              icon: <IoArrowDownCircle className={touchMenuIconClass} />,
              content: renderScrollingContent(),
            },
          ]),
    ];
    const touchSections = [editorTouchSection, ...menuTouchSections];

    const activeSection = touchSections.find(
      (section) => section.id === activeTouchPanel,
    );

    if (activeSection) {
      return <div className="space-y-3">{activeSection.content}</div>;
    }

    return (
      <div className="space-y-2">
        {menuTouchSections.map((section) => {
          const shouldBlinkEditor =
            section.id === "panel-editor" &&
            isEditing &&
            activeTouchPanel !== "panel-editor";
          return (
            <div key={section.id}>
              <button
                type="button"
                disabled={section.disabled}
                className={`neuphormism-b-btn flex min-h-[3.35rem] w-full items-center justify-between rounded-[14px] px-3.5 py-2.5 text-left text-[0.95rem] font-bold text-black shadow-[0_6px_14px_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:opacity-45 ${
                  section.tone === "gold"
                    ? "!bg-[goldenrod] !text-black"
                    : "bg-[#ececec]"
                } ${
                  shouldBlinkEditor
                    ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite]"
                    : ""
                }`}
                onClick={() => {
                  if (section.action) {
                    section.action();
                    return;
                  }
                  section.open?.();
                  if (!section.open) {
                    setActiveTouchPanel?.(section.id);
                  }
                }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {section.icon ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {section.icon}
                    </span>
                  ) : null}
                  <span className="truncate">{section.label}</span>
                </span>
                {section.action ? (
                  <IoChevronForward className="h-4 w-4 shrink-0" />
                ) : (
                  <span className="text-lg leading-none">+</span>
                )}
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
            className="neuphormism-b-btn mb-3 flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-left text-sm font-bold text-black"
            onClick={() => setActiveDesktopPanel(null)}
          >
            <IoChevronBack className="h-4 w-4" />
            <span>{activeDesktopSection.label}</span>
          </button>
          <div className="neuphormism-b rounded-[14px] p-2 text-sm font-semibold">
            {activeDesktopSection.id === "panel-editor" ? (
              <div className="max-h-[82vh] overflow-y-auto">
                {activeDesktopSection.content}
              </div>
            ) : (
              activeDesktopSection.content
            )}
          </div>
        </div>
      ) : (
        menuSections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="neuphormism-b flex min-h-[4.25rem] w-full items-center justify-between rounded-[16px] px-5 py-4 text-left text-base font-bold text-black shadow-[0_8px_18px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
            onClick={() => {
              if (section.action) {
                section.action();
                return;
              }
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
