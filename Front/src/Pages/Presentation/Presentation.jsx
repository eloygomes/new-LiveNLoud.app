/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ToolBox from "./ToolBox";
import { useRef } from "react";
import SnackBar from "../../Tools/SnackBar";
import MobileSnackBar from "../../Tools/MobileSnackBar";

import { processSongCifra } from "./ProcessSongCifra";
import { inferDisplayKey, transposeCifra } from "./transposeCifra";
import PresentationChordTooltip from "./PresentationChordTooltip";
import ChordSheetJS from "chordsheetjs";
import GuitarProViewerModal from "../../components/GuitarPro/GuitarProViewerModal";
import {
  buildInstrumentPresentationLayouts,
  clampLiveCifraZoomPercent,
  getPresentationBlockSpacingPx,
  getPresentationContentDebugSummary,
  getPresentationLayoutSettingsSnapshot,
  getPresentationLayoutsDebugSummary,
  getProgressionColumnsDebugSummary,
  shouldDropBlankLinesForPresentationFlow,
} from "./presentationLayoutHelpers";
import ConfirmationModal from "./components/ConfirmationModal";
import TouchVideoMenu from "./components/TouchVideoMenu";
import PresentationHorizontalNav from "./components/PresentationHorizontalNav";
import PresentationStatusState from "./components/PresentationStatusState";
import PresentationLiveHeader from "./components/PresentationLiveHeader";
import PresentationTopBar from "./components/PresentationTopBar";
import PresentationColumns from "./components/PresentationColumns";
import { PRESENTATION_INSTRUMENTS } from "./helpers/presentationConstants";
import {
  buildProgressionBlocks,
  getPresentationLayoutModeStorageKey,
  getPresentationLayoutsStorageKey,
  getVisibleBlocksDebugSummary,
  instrumentHasPresentationContent,
  isInstrumentRegistered,
  logPresentationDebug,
  normalizePresentationInstrumentValue,
  safeDecodeURIComponent,
  toolBoxBtnStatusChange,
} from "./helpers/presentationUtils";
import { buildProgressionRenderModel } from "./helpers/progressionRenderModel";
import { usePresentationCifraEditor } from "./hooks/usePresentationCifraEditor";
import { usePresentationChordTooltip } from "./hooks/usePresentationChordTooltip";
import { usePresentationInstrumentNotes } from "./hooks/usePresentationInstrumentNotes";
import { usePresentationLayoutStorageSync } from "./hooks/usePresentationLayoutStorageSync";
import { usePresentationLayoutUpdater } from "./hooks/usePresentationLayoutUpdater";
import { usePresentationLiveMode } from "./hooks/usePresentationLiveMode";
import { usePresentationMediaControls } from "./hooks/usePresentationMediaControls";
import { usePresentationNavigation } from "./hooks/usePresentationNavigation";
import { usePresentationProgressionControls } from "./hooks/usePresentationProgressionControls";
import { usePresentationRouteData } from "./hooks/usePresentationRouteData";
import {
  collectEditedPresentationBlocksFromNode,
  moveEnterToNextEditableBlock,
  removeEmptyEditableLine,
} from "./helpers/editableCifraDom";

function Presentation() {
  const navigate = useNavigate();
  const {
    artist: routeArtist,
    song: routeSong,
    instrument: routeInstrument,
  } = useParams();
  const decodedRouteArtist = useMemo(
    () => safeDecodeURIComponent(routeArtist),
    [routeArtist],
  );
  const decodedRouteSong = useMemo(
    () => safeDecodeURIComponent(routeSong),
    [routeSong],
  );
  const decodedRouteInstrument = useMemo(
    () =>
      normalizePresentationInstrumentValue(
        safeDecodeURIComponent(routeInstrument || "keys"),
      ),
    [routeInstrument],
  );
  const presentationRouteKey = `${decodedRouteArtist}::${decodedRouteSong}::${decodedRouteInstrument}`;
  const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(false);
  const [artistFromURL, setArtistFromURL] = useState("");
  const [songFromURL, setSongFromURL] = useState("");
  const [songDataFetched, setSongDataFetched] = useState();
  const [instrumentSelected, setInstrumentSelected] = useState("keys");
  const [embedLinks, setEmbedLinks] = useState([]);

  const [hideTabs, setHideTabs] = useState(false); // Estado para controlar a visibilidade das tabs
  const [hideChords, setHideChords] = useState(false); // Estado para controlar a visibilidade dos acordes

  const [transposeSteps, setTransposeSteps] = useState(0);
  const [isExpandedCifra, setIsExpandedCifra] = useState(false);

  const [selectContenttoShow, setSelectContenttoShow] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [hasEditedCifraContent, setHasEditedCifraContent] = useState(false);
  const [hasEditedLayoutContent, setHasEditedLayoutContent] = useState(false);
  const [selectedBlockKeys, setSelectedBlockKeys] = useState([]);
  const [activeProgressionMarkControl, setActiveProgressionMarkControl] =
    useState(null);
  const [toolBoxRequestedPanel, setToolBoxRequestedPanel] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [setlistSongs, setSetlistSongs] = useState([]);
  const [isRouteSongLoading, setIsRouteSongLoading] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });
  const presentationContentRef = useRef(null);
  const editOriginalCifraRef = useRef("");
  const editOriginalLayoutsRef = useRef(null);
  const {
    tooltip: activeChordTooltip,
    selectedVariationIndex: selectedChordVariationIndex,
    applyChordVariation: handleApplyChordVariation,
    handleTooltipEnter,
    handleTooltipLeave,
    hideTooltip,
  } = usePresentationChordTooltip({
    contentRef: presentationContentRef,
    isEditing,
  });

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, []);

  const pushSnackbarMessage = useCallback((title, message) => {
    setShowSnackBar(true);
    setSnackbarMessage({ title, message });
  }, []);

  const chordHelpers = useMemo(() => {
    const moduleRef =
      (ChordSheetJS && ChordSheetJS.ChordSheetJS) || ChordSheetJS || {};
    const ParserCtor = moduleRef.ChordProParser;
    const FormatterCtor = moduleRef.ChordProFormatter;

    return {
      parser: ParserCtor ? new ParserCtor() : null,
      formatter: FormatterCtor ? new FormatterCtor() : null,
    };
  }, []);

  const normalizeCifra = useCallback(
    (value = "") => {
      if (!value || typeof value !== "string") return "";
      const sanitizedValue = value.replace(/\u00a0/g, " ");
      try {
        if (!chordHelpers.parser || !chordHelpers.formatter) {
          return sanitizedValue;
        }
        const parsed = chordHelpers.parser.parse(sanitizedValue);
        return chordHelpers.formatter.format(parsed);
      } catch (error) {
        console.warn("ChordSheetJS parse/format falhou:", error);
        return sanitizedValue;
      }
    },
    [chordHelpers],
  );

  const currentInstrumentData = useMemo(() => {
    if (!songDataFetched || !instrumentSelected) return {};
    return songDataFetched[instrumentSelected] || {};
  }, [songDataFetched, instrumentSelected]);

  const activeLayoutVariant = isExpandedCifra ? "expanded" : "default";
  const instrumentPresentationLayouts = useMemo(
    () => buildInstrumentPresentationLayouts(currentInstrumentData),
    [currentInstrumentData],
  );
  const activePresentationLayout =
    instrumentPresentationLayouts[activeLayoutVariant];
  const songCifraData = activePresentationLayout?.songCifra || "";
  const songLyrics = currentInstrumentData?.songLyrics || "";
  const songChords = currentInstrumentData?.songChords || "";
  const songTabs = currentInstrumentData?.songTabs || "";
  const isTwoColumns = isExpandedCifra;
  const showProgressionMarkers = Boolean(
    activePresentationLayout?.showProgressionMarkers,
  );
  const progressionMarkOverrides =
    activePresentationLayout?.progressionMarkOverrides || {};
  const touchFontSizeStep = activePresentationLayout?.fontSizeStep ?? 0;
  const blockSpacingStep = activePresentationLayout?.blockSpacingStep ?? 0;
  const blockSpacingPx = getPresentationBlockSpacingPx(blockSpacingStep);
  const blockSpacingLabel = `${blockSpacingPx}px`;
  const activeLayoutLabel = isExpandedCifra
    ? "Expanded layout"
    : "Default layout";

  const normalizedSongCifra = useMemo(
    () => normalizeCifra(songCifraData),
    [songCifraData, normalizeCifra],
  );
  const editableSongCifra = normalizedSongCifra;

  // Conteúdo que deve ser mostrado de acordo com a seleção do usuário
  const contentSelected = useMemo(() => {
    const defaultContent =
      normalizedSongCifra || songChords || songTabs || songLyrics || "";

    switch (selectContenttoShow) {
      case "tabs":
        return songTabs;
      case "chords":
        return songChords;
      case "lyrics":
        return songLyrics;
      case "full":
        return defaultContent;
      default:
        return defaultContent;
    }
  }, [
    selectContenttoShow,
    normalizedSongCifra,
    songLyrics,
    songChords,
    songTabs,
  ]);

  const availableInstrumentOptions = useMemo(() => {
    if (!songDataFetched) return [];

    return PRESENTATION_INSTRUMENTS.filter(
      (instrument) =>
        isInstrumentRegistered(songDataFetched, instrument.key) &&
        instrumentHasPresentationContent(songDataFetched[instrument.key]),
    );
  }, [songDataFetched]);

  const isCurrentInstrumentUnavailable = Boolean(
    songDataFetched &&
    instrumentSelected &&
    (!isInstrumentRegistered(songDataFetched, instrumentSelected) ||
      !instrumentHasPresentationContent(songDataFetched[instrumentSelected])),
  );

  const {
    canOpenGuitarPro,
    closeGuitarProViewer,
    closeTouchVideo,
    closeTouchVideoMenu,
    guitarProViewerOpen,
    isTouchVideoActive,
    isTouchVideoMenuOpen,
    isVideoModalOpen,
    openGuitarProViewer,
    openTouchVideoMenu,
    resetMediaControls,
    selectedGuitarProFile,
    setIsTouchVideoActive,
    setIsVideoModalOpen,
    setTouchVideoLink,
    touchVideoLink,
  } = usePresentationMediaControls({
    instrumentSelected,
    songDataFetched,
  });

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPseudoLiveMode, setIsPseudoLiveMode] = useState(false);
  const [liveCifraZoomPercent, setLiveCifraZoomPercent] = useState(120);
  const [activeLiveColumnKey, setActiveLiveColumnKey] = useState("");
  const [notesModalStatus, setNotesModalStatus] = useState(false);
  const [resizingProgressionWidths, setResizingProgressionWidths] = useState(
    {},
  );
  const liveModeRootRef = useRef(null);
  const draggedProgressionGroupKeyRef = useRef("");
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;
  const effectiveLiveMode = isLiveMode || isPseudoLiveMode;
  const touchFontSizeRem = useMemo(
    () => Math.max(0.58, Math.min(1.18, 0.82 + touchFontSizeStep * 0.08)),
    [touchFontSizeStep],
  );
  const presentationFontScale = touchFontSizeRem / 0.82;
  const touchFontSizeLabel = `${Math.round(presentationFontScale * 100)}%`;
  const liveCifraZoomScale =
    clampLiveCifraZoomPercent(liveCifraZoomPercent) / 100;
  const liveCifraZoomLabel = `${clampLiveCifraZoomPercent(liveCifraZoomPercent)}%`;
  const adjustLiveCifraZoom = useCallback((delta) => {
    setLiveCifraZoomPercent((current) =>
      clampLiveCifraZoomPercent(current + delta),
    );
  }, []);

  const getMobileTitleSizeClass = useCallback((value = "", type = "song") => {
    const length = String(value || "").trim().length;

    if (type === "song") {
      if (length > 30) return "text-[1.8rem] leading-[1.95rem]";
      if (length > 22) return "text-[2rem] leading-[2.1rem]";
      if (length > 14) return "text-[2.2rem] leading-[2.3rem]";
      return "text-[2.4rem] leading-[2.45rem]";
    }

    if (length > 28) return "text-[1.4rem] leading-[1.55rem]";
    if (length > 20) return "text-[1.55rem] leading-[1.7rem]";
    if (length > 14) return "text-[1.7rem] leading-[1.85rem]";
    return "text-[1.85rem] leading-[1.95rem]";
  }, []);

  const presentationLayoutIdentity = `${artistFromURL}::${songFromURL}::${instrumentSelected}`;
  const presentationLayoutStorageKey = useMemo(
    () =>
      getPresentationLayoutsStorageKey({
        artist: artistFromURL,
        song: songFromURL,
        instrument: instrumentSelected,
      }),
    [artistFromURL, instrumentSelected, songFromURL],
  );
  const presentationLayoutModeStorageKey = useMemo(
    () =>
      getPresentationLayoutModeStorageKey({
        artist: artistFromURL,
        song: songFromURL,
        instrument: instrumentSelected,
      }),
    [artistFromURL, instrumentSelected, songFromURL],
  );
  const presentationLayoutSettingsSnapshot = useMemo(
    () => getPresentationLayoutSettingsSnapshot(instrumentPresentationLayouts),
    [instrumentPresentationLayouts],
  );
  const lastLoggedColumnsSnapshotRef = useRef("");

  usePresentationLayoutStorageSync({
    currentInstrumentData,
    instrumentPresentationLayouts,
    instrumentSelected,
    isExpandedCifra,
    isRouteSongLoading,
    presentationLayoutIdentity,
    presentationLayoutModeStorageKey,
    presentationLayoutSettingsSnapshot,
    presentationLayoutStorageKey,
    setIsExpandedCifra,
    setSongDataFetched,
    songDataFetched,
  });

  const {
    adjustActiveBlockSpacingStep,
    adjustActiveFontSizeStep,
    setActiveShowProgressionMarkers,
    updateActivePresentationLayout,
  } = usePresentationLayoutUpdater({
    activeLayoutVariant,
    instrumentSelected,
    presentationLayoutIdentity,
    setHasEditedLayoutContent,
    setSongDataFetched,
  });

  const shouldUseTwoColumns = isTwoColumns;
  const shouldUseHorizontalColumnFlow = isExpandedCifra && shouldUseTwoColumns;
  const shouldDropBlankLinesForHorizontalFlow =
    shouldDropBlankLinesForPresentationFlow({
      shouldUseHorizontalColumnFlow,
    });
  const shouldApplyProgressionBlockDimensions = !effectiveLiveMode || isEditing;
  const shouldUseExpandedVerticalFlow = isExpandedCifra && !shouldUseTwoColumns;
  const renderContentSelected = contentSelected;
  const transposedContent = useMemo(
    () => transposeCifra(renderContentSelected, transposeSteps),
    [renderContentSelected, transposeSteps],
  );
  const displayKey = useMemo(
    () => inferDisplayKey(transposedContent || renderContentSelected),
    [renderContentSelected, transposedContent],
  );

  // Processar o songCifraData usando o algoritmo fornecido
  // console.log("htmlBlocks", htmlBlocks);

  // const { htmlBlocks } = processSongCifra(songCifraData);
  // const { htmlBlocks } = processSongCifra(songChords);
  // const { htmlBlocks } = processSongCifra(songLyrics);
  // const { htmlBlocks } = processSongCifra(songTabs);

  // const { htmlBlocks } = processSongCifra(contentSelected);
  const isParsableString =
    typeof transposedContent === "string" &&
    transposedContent.trim() !== "" &&
    transposedContent !== "Loading...";

  const htmlBlocks = useMemo(() => {
    if (!isParsableString) {
      return [];
    }

    try {
      return processSongCifra(transposedContent).htmlBlocks || [];
    } catch (e) {
      console.warn("processSongCifra falhou, usando fallback vazio:", e);
      return [];
    }
  }, [isParsableString, transposedContent]);

  const visibleContentBlocks = useMemo(
    () =>
      buildProgressionBlocks(htmlBlocks, {
        hideTabs,
        dropBlankLines: shouldDropBlankLinesForHorizontalFlow,
      }),
    [hideTabs, htmlBlocks, shouldDropBlankLinesForHorizontalFlow],
  );

  const progressionRenderModel = useMemo(
    () =>
      buildProgressionRenderModel({
        visibleContentBlocks,
        progressionMarkOverrides,
        resizingProgressionWidths,
        shouldUseHorizontalColumnFlow,
      }),
    [
      progressionMarkOverrides,
      resizingProgressionWidths,
      shouldUseHorizontalColumnFlow,
      visibleContentBlocks,
    ],
  );
  const progressionRenderGroups = progressionRenderModel.groups;
  const activeProgressionRenderColumns = progressionRenderModel.activeColumns;

  const {
    draftCifra,
    handleDiscardDraft,
    handleSaveCifra,
    hasDraftChanges,
    isSavingCifra,
    markCifraContentAsEdited,
    openEditorToolBox,
    saveError,
    setDraftCifra,
    setSaveError,
    startEditingCifra,
  } = usePresentationCifraEditor({
    activeLayoutVariant,
    activeProgressionRenderColumns,
    currentInstrumentData,
    editableSongCifra,
    editOriginalCifraRef,
    editOriginalLayoutsRef,
    hasEditedCifraContent,
    hasEditedLayoutContent,
    instrumentPresentationLayouts,
    instrumentSelected,
    isEditing,
    isExpandedCifra,
    presentationContentRef,
    presentationLayoutIdentity,
    presentationLayoutStorageKey,
    pushSnackbarMessage,
    setActiveProgressionMarkControl,
    setHasEditedCifraContent,
    setHasEditedLayoutContent,
    setIsEditing,
    setSelectedBlockKeys,
    setSongDataFetched,
    setToolBoxBtnStatus,
    setToolBoxRequestedPanel,
    songDataFetched,
    visibleContentBlocks,
  });

  const collectEditedPresentationBlocksExcluding = useCallback(
    (excludedBlockKeys = []) => {
      return collectEditedPresentationBlocksFromNode({
        contentNode: presentationContentRef.current,
        fallbackCifra: draftCifra,
        excludedBlockKeys,
      });
    },
    [draftCifra],
  );

  const resetTransientPresentationState = useCallback(() => {
    hideTooltip();
    setToolBoxBtnStatus(false);
    setNotesModalStatus(false);
    resetMediaControls();
    setIsEditing(false);
    setSaveError("");
    setHasEditedCifraContent(false);
    setHasEditedLayoutContent(false);
    editOriginalLayoutsRef.current = null;
    presentationContentRef.current?.scrollTo?.({ top: 0, left: 0 });
  }, [hideTooltip, resetMediaControls, setSaveError]);

  const {
    goToEditSong,
    goToInstrument,
    goToSetlistSong,
    nextSetlistSong,
    previousSetlistSong,
  } = usePresentationNavigation({
    artistFromURL,
    decodedRouteArtist,
    decodedRouteInstrument,
    decodedRouteSong,
    instrumentSelected,
    navigate,
    resetTransientPresentationState,
    setArtistFromURL,
    setEmbedLinks,
    setInstrumentSelected,
    setIsRouteSongLoading,
    setSongDataFetched,
    setSongFromURL,
    setlistSongs,
    songFromURL,
  });

  useEffect(() => {
    resetTransientPresentationState();
  }, [presentationRouteKey, resetTransientPresentationState]);

  useEffect(() => {
    const columns = getProgressionColumnsDebugSummary(
      activeProgressionRenderColumns,
    );
    const snapshot = JSON.stringify({
      identity: presentationLayoutIdentity,
      activeLayoutVariant,
      isEditing,
      showProgressionMarkers,
      shouldUseHorizontalColumnFlow,
      columns,
    });

    if (lastLoggedColumnsSnapshotRef.current === snapshot) return;
    lastLoggedColumnsSnapshotRef.current = snapshot;

    logPresentationDebug("columns:rendered", {
      identity: presentationLayoutIdentity,
      activeLayoutVariant,
      isEditing,
      showProgressionMarkers,
      shouldUseHorizontalColumnFlow,
      visibleBlockCount: visibleContentBlocks.length,
      columns,
      overrides: activePresentationLayout?.progressionMarkOverrides || {},
    });
  }, [
    activeLayoutVariant,
    activePresentationLayout,
    activeProgressionRenderColumns,
    isEditing,
    presentationLayoutIdentity,
    shouldUseHorizontalColumnFlow,
    showProgressionMarkers,
    visibleContentBlocks.length,
  ]);

  // console.log("songLyrics", songLyrics);
  // console.log("songChords", songChords);
  // console.log("songTabs", songTabs);

  // console.log("htmlBlocks", htmlBlocks);
  // console.log("htmlBlocks", typeof htmlBlocks); // objeto

  // console.log("songCifraData", songCifraData);
  // console.log("songCifraData", typeof songCifraData); // string

  // console.log("htmlBlocks", htmlBlocks);

  usePresentationRouteData({
    decodedRouteArtist,
    decodedRouteInstrument,
    decodedRouteSong,
    instrumentSelected,
    artistFromURL,
    songFromURL,
    navigate,
    setArtistFromURL,
    setEmbedLinks,
    setInstrumentSelected,
    setIsRouteSongLoading,
    setSetlistSongs,
    setSongDataFetched,
    setSongFromURL,
  });

  const {
    enterLiveMode,
    exitLiveMode,
    focusLiveViewport,
    scrollExpandedLayout,
  } = usePresentationLiveMode({
    activeProgressionRenderColumns,
    closeTouchVideo,
    effectiveLiveMode,
    hideChords,
    hideTooltip,
    isEditing,
    isTouchLayout,
    liveModeRootRef,
    presentationContentRef,
    pushSnackbarMessage,
    selectContenttoShow,
    setActiveLiveColumnKey,
    setActiveShowProgressionMarkers,
    setIsLiveMode,
    setIsPseudoLiveMode,
    shouldUseHorizontalColumnFlow,
  });

  // Função para alternar a visibilidade das tabs
  const toggleTabsVisibility = () => {
    setHideTabs(!hideTabs);
  };

  const {
    handleInstrumentNotesChange,
    handleSaveInstrumentNotes,
    instrumentNotes,
    isSavingNotes,
    openInstrumentNotesWindow,
  } = usePresentationInstrumentNotes({
    artistFromURL,
    currentInstrumentData,
    instrumentSelected,
    pushSnackbarMessage,
    setNotesModalStatus,
    setSongDataFetched,
    songFromURL,
  });

  const toggleMarksVisibility = useCallback(() => {
    setActiveShowProgressionMarkers((current) => !current);
  }, [setActiveShowProgressionMarkers]);

  const {
    activeProgressionMarkSettings,
    adjustActiveProgressionMarkHeight,
    adjustActiveProgressionMarkWidth,
    handleDropProgressionGroup,
    handleDropProgressionGroupOnColumn,
    handleStartProgressionResize,
  } = usePresentationProgressionControls({
    activeProgressionMarkControl,
    activeProgressionRenderColumns,
    draggedProgressionGroupKeyRef,
    isEditing,
    presentationContentRef,
    presentationLayoutIdentity,
    progressionMarkOverrides,
    progressionRenderGroups,
    resizingProgressionWidths,
    setResizingProgressionWidths,
    updateActivePresentationLayout,
  });

  const toggleSelectedBlockKeys = useCallback((blockKeys = []) => {
    if (!blockKeys.length) return;

    setSelectedBlockKeys((current) => {
      const currentSet = new Set(current);
      const allSelected = blockKeys.every((blockKey) =>
        currentSet.has(blockKey),
      );

      if (allSelected) {
        blockKeys.forEach((blockKey) => currentSet.delete(blockKey));
      } else {
        blockKeys.forEach((blockKey) => currentSet.add(blockKey));
      }

      return Array.from(currentSet);
    });
  }, []);

  const handleDeleteSelectedBlocks = useCallback(
    (blockKeysToDelete = selectedBlockKeys) => {
      const uniqueBlockKeys = Array.from(new Set(blockKeysToDelete)).filter(
        Boolean,
      );
      if (!uniqueBlockKeys.length) return;

      const nextDraftCifra =
        collectEditedPresentationBlocksExcluding(uniqueBlockKeys);
      const deletedBlockKeySet = new Set(uniqueBlockKeys);

      updateActivePresentationLayout((currentLayout) => {
        const currentOverrides = currentLayout.progressionMarkOverrides || {};
        const nextOverrides = Object.fromEntries(
          Object.entries(currentOverrides).filter(
            ([blockKey]) => !deletedBlockKeySet.has(blockKey),
          ),
        );

        return {
          ...currentLayout,
          songCifra: nextDraftCifra,
          progressionMarkOverrides: nextOverrides,
        };
      });

      setDraftCifra(nextDraftCifra);
      setHasEditedCifraContent(false);
      setSelectedBlockKeys([]);
      setActiveProgressionMarkControl(null);
    },
    [
      collectEditedPresentationBlocksExcluding,
      selectedBlockKeys,
      updateActivePresentationLayout,
    ],
  );

  const requestDeleteActiveProgressionMark = useCallback(() => {
    const blockKeys = activeProgressionMarkSettings?.blockKeys || [];
    if (!isEditing || !blockKeys.length) return;

    setConfirmationModal({
      title: "Delete block",
      message:
        "This will remove the selected block from the current cifra. This action cannot be undone after saving.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: () => {
        handleDeleteSelectedBlocks(blockKeys);
        setConfirmationModal(null);
      },
    });
  }, [activeProgressionMarkSettings, handleDeleteSelectedBlocks, isEditing]);

  useEffect(() => {
    if (!isEditing || !selectedBlockKeys.length) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(".presentation-render-content-block")
      ) {
        return;
      }

      event.preventDefault();
      handleDeleteSelectedBlocks();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDeleteSelectedBlocks, isEditing, selectedBlockKeys.length]);

  return (
    <div
      ref={liveModeRootRef}
      tabIndex={effectiveLiveMode ? -1 : undefined}
      className={`flex min-h-0 justify-center ${
        effectiveLiveMode ? "h-[100dvh]" : "h-full"
      } ${effectiveLiveMode ? "presentation-live-shell" : ""} ${
        isPseudoLiveMode ? "overflow-hidden" : ""
      }`}
      onMouseDown={effectiveLiveMode ? focusLiveViewport : undefined}
    >
      <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
        {isTouchLayout ? (
          <MobileSnackBar snackbarMessage={snackbarMessage} />
        ) : (
          <SnackBar snackbarMessage={snackbarMessage} />
        )}
      </div>
      {!effectiveLiveMode && (
        <ToolBox
          toolBoxBtnStatus={toolBoxBtnStatus}
          setToolBoxBtnStatus={setToolBoxBtnStatus}
          toolBoxBtnStatusChange={toolBoxBtnStatusChange}
          embedLinks={embedLinks}
          songFromURL={songFromURL}
          artistFromURL={artistFromURL}
          instrumentSelected={instrumentSelected}
          songDataFetched={songDataFetched}
          toggleTabsVisibility={toggleTabsVisibility}
          hideChords={hideChords}
          setHideChords={setHideChords}
          selectContenttoShow={selectContenttoShow}
          setSelectContenttoShow={setSelectContenttoShow}
          isEditing={isEditing}
          isSavingCifra={isSavingCifra}
          hasDraftChanges={hasDraftChanges}
          songCifraData={songCifraData}
          handleSaveCifra={handleSaveCifra}
          handleDiscardDraft={handleDiscardDraft}
          startEditingCifra={startEditingCifra}
          onToggleMarksVisibility={toggleMarksVisibility}
          transposeSteps={transposeSteps}
          setTransposeSteps={setTransposeSteps}
          displayKey={displayKey}
          showProgressionMarkers={showProgressionMarkers}
          isTouchLayout={isTouchLayout}
          touchFontSizeLabel={touchFontSizeLabel}
          decreaseTouchFontSize={() => adjustActiveFontSizeStep(-1)}
          increaseTouchFontSize={() => adjustActiveFontSizeStep(1)}
          blockSpacingLabel={blockSpacingLabel}
          decreaseBlockSpacing={() => adjustActiveBlockSpacingStep(-1)}
          increaseBlockSpacing={() => adjustActiveBlockSpacingStep(1)}
          onVideoModalChange={setIsVideoModalOpen}
          linktoplay={touchVideoLink}
          setLinktoplay={setTouchVideoLink}
          videoModalStatus={isTouchVideoActive}
          setVideoModalStatus={setIsTouchVideoActive}
          instrumentNotes={instrumentNotes}
          onInstrumentNotesChange={handleInstrumentNotesChange}
          onSaveInstrumentNotes={handleSaveInstrumentNotes}
          notesModalStatus={notesModalStatus}
          setNotesModalStatus={setNotesModalStatus}
          onOpenInstrumentNotes={openInstrumentNotesWindow}
          isSavingNotes={isSavingNotes}
          onSelectInstrument={goToInstrument}
          requestedPanel={toolBoxRequestedPanel}
          activeProgressionMarkSettings={activeProgressionMarkSettings}
          onDecreaseActiveMarkWidth={() =>
            adjustActiveProgressionMarkWidth(-20)
          }
          onIncreaseActiveMarkWidth={() => adjustActiveProgressionMarkWidth(20)}
          onDecreaseActiveMarkHeight={() =>
            adjustActiveProgressionMarkHeight(-20)
          }
          onIncreaseActiveMarkHeight={() =>
            adjustActiveProgressionMarkHeight(20)
          }
          onRequestDeleteActiveMark={requestDeleteActiveProgressionMark}
        />
      )}
      <ConfirmationModal
        open={Boolean(confirmationModal)}
        title={confirmationModal?.title}
        message={confirmationModal?.message}
        confirmLabel={confirmationModal?.confirmLabel}
        cancelLabel={confirmationModal?.cancelLabel}
        onConfirm={confirmationModal?.onConfirm}
        onCancel={() => setConfirmationModal(null)}
      />
      <div
        className={`container mx-auto h-full min-h-0 ${
          effectiveLiveMode || isExpandedCifra ? "max-w-none px-0" : ""
        }`}
      >
        <div
          className={`flex min-h-0 flex-col ${
            effectiveLiveMode ? "h-[100dvh]" : "h-full"
          } ${
            effectiveLiveMode || isExpandedCifra
              ? "w-full max-w-none px-0"
              : "w-11/12 2xl:w-9/12 mx-auto"
          }`}
        >
          <PresentationTopBar
            visible={!effectiveLiveMode}
            isTouchLayout={isTouchLayout}
            isTouchVideoActive={isTouchVideoActive}
            touchVideoLink={touchVideoLink}
            songFromURL={songFromURL}
            artistFromURL={artistFromURL}
            activeLayoutLabel={activeLayoutLabel}
            previousSetlistSong={previousSetlistSong}
            nextSetlistSong={nextSetlistSong}
            getMobileTitleSizeClass={getMobileTitleSizeClass}
            toolBoxBtnStatus={toolBoxBtnStatus}
            isEditing={isEditing}
            isVideoModalOpen={isVideoModalOpen}
            openEditorToolBox={openEditorToolBox}
            onToggleToolBox={() =>
              toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
            }
            onOpenTouchVideoMenu={openTouchVideoMenu}
            isExpandedCifra={isExpandedCifra}
            onToggleExpanded={() => setIsExpandedCifra((value) => !value)}
            onGoToEditSong={goToEditSong}
            instrumentSelected={instrumentSelected}
            canOpenGuitarPro={canOpenGuitarPro}
            onOpenGuitarProViewer={openGuitarProViewer}
            onEnterLiveMode={enterLiveMode}
            onGoToSetlistSong={goToSetlistSong}
            onTouchVideoLinkChange={setTouchVideoLink}
            onTouchVideoActiveChange={setIsTouchVideoActive}
            onVideoModalChange={setIsVideoModalOpen}
          />
          <PresentationLiveHeader
            effectiveLiveMode={effectiveLiveMode}
            isTouchLayout={isTouchLayout}
            songFromURL={songFromURL}
            artistFromURL={artistFromURL}
            liveCifraZoomLabel={liveCifraZoomLabel}
            blockSpacingLabel={blockSpacingLabel}
            onDecreaseZoom={() => adjustLiveCifraZoom(-10)}
            onIncreaseZoom={() => adjustLiveCifraZoom(10)}
            onDecreaseSpacing={() => adjustActiveBlockSpacingStep(-1)}
            onIncreaseSpacing={() => adjustActiveBlockSpacingStep(1)}
            onExit={exitLiveMode}
          />
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <TouchVideoMenu
            open={isTouchLayout && isTouchVideoActive && isTouchVideoMenuOpen}
            onClose={closeTouchVideoMenu}
            onCloseVideo={closeTouchVideo}
          />

          <PresentationHorizontalNav
            open={shouldUseHorizontalColumnFlow}
            effectiveLiveMode={effectiveLiveMode}
            onNavigate={scrollExpandedLayout}
          />

          <div
            ref={presentationContentRef}
            tabIndex={effectiveLiveMode ? 0 : -1}
            title={
              !effectiveLiveMode &&
              !isEditing &&
              ["default", "full"].includes(selectContenttoShow)
                ? "Double-click to edit"
                : undefined
            }
            className={`min-h-0 flex-1 ${
              effectiveLiveMode
                ? "presentation-live-content"
                : `presentation-scroll-content neuphormism-b overflow-y-auto ${isTouchLayout ? "p-4" : "px-10 py-5"}`
            } ${hideChords ? "hide-chords" : ""} ${
              selectContenttoShow === "tabs" ? "presentation-tabs-only" : ""
            } ${
              shouldUseHorizontalColumnFlow
                ? "presentation-expanded-cifra-horizontal"
                : ""
            } ${
              shouldUseExpandedVerticalFlow
                ? "presentation-expanded-cifra-vertical"
                : ""
            }`}
            style={{
              "--touch-presentation-font-scale": String(presentationFontScale),
              "--presentation-live-cifra-zoom": String(liveCifraZoomScale),
              fontSize: effectiveLiveMode
                ? `${presentationFontScale * liveCifraZoomScale}rem`
                : isTouchLayout
                  ? `${touchFontSizeRem}rem`
                  : `${presentationFontScale}rem`,
              lineHeight: 1.45,
            }}
            onDoubleClick={
              !effectiveLiveMode &&
              !isEditing &&
              ["default", "full"].includes(selectContenttoShow)
                ? startEditingCifra
                : undefined
            }
          >
            {isRouteSongLoading || isCurrentInstrumentUnavailable ? (
              <PresentationStatusState
                mode={isRouteSongLoading ? "loading" : "unavailable"}
                effectiveLiveMode={effectiveLiveMode}
                songFromURL={songFromURL}
                artistFromURL={artistFromURL}
                instrumentSelected={instrumentSelected}
                availableInstrumentOptions={availableInstrumentOptions}
                onSelectInstrument={goToInstrument}
              />
            ) : (
              <div
                className={`presentation-content-flow ${
                  shouldUseTwoColumns ? "presentation-two-columns" : ""
                } ${
                  shouldUseHorizontalColumnFlow
                    ? "presentation-horizontal-columns"
                    : ""
                }`}
                key={`${activeLayoutVariant}-${isEditing ? "editing" : "viewing"}`}
                style={{
                  "--presentation-block-gap": `${blockSpacingPx}px`,
                }}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBeforeInput={isEditing ? markCifraContentAsEdited : undefined}
                onPaste={
                  isEditing ? () => setHasEditedCifraContent(true) : undefined
                }
                onCut={
                  isEditing ? () => setHasEditedCifraContent(true) : undefined
                }
                onKeyDown={
                  isEditing
                    ? (event) => {
                        if (moveEnterToNextEditableBlock(event)) {
                          return;
                        }
                        if (removeEmptyEditableLine(event)) {
                          setHasEditedCifraContent(true);
                        }
                      }
                    : undefined
                }
                onDragOver={
                  isEditing
                    ? (event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }
                    : undefined
                }
                onDrop={
                  isEditing ? handleDropProgressionGroupOnColumn : undefined
                }
              >
                <PresentationColumns
                  columns={activeProgressionRenderColumns}
                  selectContenttoShow={selectContenttoShow}
                  showProgressionMarkers={showProgressionMarkers}
                  effectiveLiveMode={effectiveLiveMode}
                  shouldUseHorizontalColumnFlow={shouldUseHorizontalColumnFlow}
                  shouldApplyProgressionBlockDimensions={
                    shouldApplyProgressionBlockDimensions
                  }
                  resizingProgressionWidths={resizingProgressionWidths}
                  selectedBlockKeys={selectedBlockKeys}
                  isEditing={isEditing}
                  draggedProgressionGroupKeyRef={draggedProgressionGroupKeyRef}
                  onSetActiveProgressionMarkControl={
                    setActiveProgressionMarkControl
                  }
                  onHandleDropProgressionGroup={handleDropProgressionGroup}
                  onToggleSelectedBlockKeys={toggleSelectedBlockKeys}
                  onHandleDeleteSelectedBlocks={handleDeleteSelectedBlocks}
                  onHandleStartProgressionResize={handleStartProgressionResize}
                  activeLiveColumnKey={activeLiveColumnKey}
                />
              </div>
            )}
          </div>
          {!isEditing && (
            <PresentationChordTooltip
              tooltip={activeChordTooltip}
              selectedVariationIndex={selectedChordVariationIndex}
              onApplyVariation={handleApplyChordVariation}
              onTooltipEnter={handleTooltipEnter}
              onTooltipLeave={handleTooltipLeave}
              onClose={hideTooltip}
            />
          )}
        </div>
      </div>
      <GuitarProViewerModal
        open={guitarProViewerOpen}
        onClose={closeGuitarProViewer}
        file={selectedGuitarProFile}
        songTitle={songFromURL}
        artistName={artistFromURL}
        instrumentName={instrumentSelected}
      />
    </div>
  );
}

export default Presentation;
