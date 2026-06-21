import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ToolBox from "./ToolBox";
import { useRef } from "react";
import SnackBar from "../../Tools/SnackBar";
import MobileSnackBar from "../../Tools/MobileSnackBar";

import PresentationChordTooltip from "./PresentationChordTooltip";
import ChordSheetJS from "chordsheetjs";
import GuitarProViewerModal from "../../components/GuitarPro/GuitarProViewerModal";
import {
  getPresentationContentDebugSummary,
  getPresentationLayoutSettingsSnapshot,
  getPresentationLayoutsDebugSummary,
  getProgressionColumnsDebugSummary,
} from "./presentationLayoutHelpers";
import PresentationHorizontalNav from "./components/PresentationHorizontalNav";
import PresentationStatusState from "./components/PresentationStatusState";
import PresentationLiveHeader from "./components/PresentationLiveHeader";
import PresentationTopBar from "./components/PresentationTopBar";
import PresentationColumns from "./components/PresentationColumns";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "./helpers/presentationConstants";
import {
  getPresentationLayoutModeStorageKey,
  getPresentationLayoutsStorageKey,
  logPresentationDebug,
  normalizePresentationInstrumentValue,
  safeDecodeURIComponent,
  toolBoxBtnStatusChange,
} from "./helpers/presentationUtils";
import { usePresentationCifraEditor } from "./hooks/usePresentationCifraEditor";
import { usePresentationChordTooltip } from "./hooks/usePresentationChordTooltip";
import { usePresentationInstrumentAvailability } from "./hooks/usePresentationInstrumentAvailability";
import { usePresentationInstrumentNotes } from "./hooks/usePresentationInstrumentNotes";
import { usePresentationLayoutStorageSync } from "./hooks/usePresentationLayoutStorageSync";
import { usePresentationLayoutUpdater } from "./hooks/usePresentationLayoutUpdater";
import { usePresentationLiveMode } from "./hooks/usePresentationLiveMode";
import { usePresentationMediaControls } from "./hooks/usePresentationMediaControls";
import { usePresentationNavigation } from "./hooks/usePresentationNavigation";
import { usePresentationRenderModel } from "./hooks/usePresentationRenderModel";
import { usePresentationRouteData } from "./hooks/usePresentationRouteData";
import { usePresentationSongData } from "./hooks/usePresentationSongData";
import { usePresentationVisualScale } from "./hooks/usePresentationVisualScale";
import {
  moveEnterToNextEditableBlock,
  moveToAdjacentEditableBlock,
  removeEmptyEditableLine,
} from "./helpers/editableCifraDom";

function getInitialExpandedCifraState({ artist, song, instrument }) {
  if (typeof window === "undefined") return false;

  const storageKey = getPresentationLayoutModeStorageKey({
    artist,
    song,
    instrument,
  });

  return window.localStorage.getItem(storageKey) === "expanded";
}

function getIsPresentationTouchLayout() {
  if (typeof window === "undefined") return false;

  const navigatorRef = window.navigator;
  const userAgent = navigatorRef?.userAgent || "";
  const isIosDevice =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigatorRef?.platform === "MacIntel" &&
      Number(navigatorRef?.maxTouchPoints || 0) > 1);
  const hasCoarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  return (
    window.innerWidth < 768 ||
    isIosDevice ||
    (window.innerWidth <= 1366 && hasCoarsePointer)
  );
}

const PRESERVED_LIVE_NAVIGATION_KEY = "presentation:preserve-live-navigation";

function getShouldRestorePreservedLiveMode() {
  if (typeof window === "undefined") return false;

  const rawTimestamp = window.sessionStorage.getItem(
    PRESERVED_LIVE_NAVIGATION_KEY,
  );
  window.sessionStorage.removeItem(PRESERVED_LIVE_NAVIGATION_KEY);

  const timestamp = Number(rawTimestamp);
  if (!Number.isFinite(timestamp)) return false;

  return Date.now() - timestamp < 10000;
}

function PresentationLiveSetlistScreen({
  artistFromURL,
  onBackToCifra,
  onSelectSong,
  setlistSongs,
  songFromURL,
}) {
  const normalizedCurrentArtist = String(artistFromURL || "")
    .trim()
    .toLowerCase();
  const normalizedCurrentSong = String(songFromURL || "").trim().toLowerCase();

  return (
    <div className="presentation-live-setlist-screen" aria-label="Live setlist">
      <div className="presentation-live-setlist-screen-header">
        <div>
          <div className="presentation-live-setlist-eyebrow">LIVE</div>
          <div className="presentation-live-setlist-title">Setlist</div>
        </div>
        <button
          type="button"
          className="presentation-live-setlist-back-button"
          onClick={onBackToCifra}
          aria-label="Back to live cifra"
        >
          Cifra
        </button>
      </div>

      <div className="presentation-live-setlist-list">
        {setlistSongs.length ? (
          setlistSongs.map((song, index) => {
            const itemArtist = String(song?.artist || "").trim();
            const itemSong = String(song?.song || "").trim();
            const isCurrent =
              itemArtist.toLowerCase() === normalizedCurrentArtist &&
              itemSong.toLowerCase() === normalizedCurrentSong;

            return (
              <button
                type="button"
                key={`${itemArtist}-${itemSong}-${index}`}
                className={`presentation-live-setlist-item ${
                  isCurrent ? "presentation-live-setlist-item-active" : ""
                }`}
                onClick={() => onSelectSong(song)}
                aria-current={isCurrent ? "true" : undefined}
              >
                <span className="presentation-live-setlist-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="presentation-live-setlist-copy">
                  <span className="presentation-live-setlist-song">
                    {itemSong || "Untitled"}
                  </span>
                  <span className="presentation-live-setlist-artist">
                    {itemArtist || "Unknown artist"}
                  </span>
                </span>
                {isCurrent ? (
                  <span className="presentation-live-setlist-now">Live</span>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className="presentation-live-setlist-empty">
            No songs in this setlist.
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [artistFromURL, setArtistFromURL] = useState(decodedRouteArtist);
  const [songFromURL, setSongFromURL] = useState(decodedRouteSong);
  const [songDataFetched, setSongDataFetched] = useState();
  const [instrumentSelected, setInstrumentSelected] =
    useState(decodedRouteInstrument);
  const [embedLinks, setEmbedLinks] = useState([]);

  const [hideTabs, setHideTabs] = useState(false); // Estado para controlar a visibilidade das tabs
  const [hideChords, setHideChords] = useState(false); // Estado para controlar a visibilidade dos acordes

  const [transposeSteps, setTransposeSteps] = useState(0);
  const [isExpandedCifra, setIsExpandedCifra] = useState(() =>
    getInitialExpandedCifraState({
      artist: decodedRouteArtist,
      song: decodedRouteSong,
      instrument: decodedRouteInstrument,
    }),
  );

  const [selectContenttoShow, setSelectContenttoShow] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [hasEditedCifraContent, setHasEditedCifraContent] = useState(false);
  const [hasEditedLayoutContent, setHasEditedLayoutContent] = useState(false);
  const [toolBoxRequestedPanel, setToolBoxRequestedPanel] = useState(null);
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
      if (sanitizedValue.includes(PRESENTATION_COLUMN_BREAK_MARKER)) {
        return sanitizedValue;
      }
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

  const {
    activeLayoutLabel,
    activeLayoutVariant,
    activePresentationLayout,
    blockSpacingStep,
    contentSelected,
    currentInstrumentData,
    editableSongCifra,
    instrumentPresentationLayouts,
    isTwoColumns,
    progressionMarkOverrides,
    showProgressionMarkers,
    songCifraData,
    touchFontSizeStep,
  } = usePresentationSongData({
    instrumentSelected,
    isExpandedCifra,
    normalizeCifra,
    selectContenttoShow,
    songDataFetched,
  });
  const isTouchLayout = getIsPresentationTouchLayout();
  const {
    adjustLiveCifraZoom,
    blockSpacingLabel,
    blockSpacingPx,
    liveCifraZoomLabel,
    liveCifraZoomScale,
    presentationFontScale,
    touchFontSizeLabel,
    touchFontSizeRem,
  } = usePresentationVisualScale({
    blockSpacingStep,
    isTouchLayout,
    touchFontSizeStep,
  });

  const { availableInstrumentOptions, isCurrentInstrumentUnavailable } =
    usePresentationInstrumentAvailability({
      instrumentSelected,
      songDataFetched,
    });

  const {
    canOpenGuitarPro,
    closeGuitarProViewer,
    closeTouchVideo,
    guitarProViewerOpen,
    isTouchVideoActive,
    isVideoModalOpen,
    openGuitarProViewer,
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
  const [isPseudoLiveMode, setIsPseudoLiveMode] = useState(() =>
    getShouldRestorePreservedLiveMode(),
  );
  const [liveView, setLiveView] = useState("cifra");
  const [activeLiveColumnKey, setActiveLiveColumnKey] = useState("");
  const [notesModalStatus, setNotesModalStatus] = useState(false);
  const liveModeRootRef = useRef(null);
  const effectiveLiveMode = isLiveMode || isPseudoLiveMode;
  const shouldUseFullBleedLayout =
    effectiveLiveMode || (!isTouchLayout && isExpandedCifra);

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
  } = usePresentationLayoutUpdater({
    activeLayoutVariant,
    instrumentSelected,
    presentationLayoutIdentity,
    setHasEditedLayoutContent,
    setSongDataFetched,
  });

  const {
    activeProgressionRenderColumns,
    displayKey,
    shouldUseExpandedVerticalFlow,
    shouldUseHorizontalColumnFlow,
    shouldUseTwoColumns,
    visibleContentBlocks,
  } = usePresentationRenderModel({
    contentSelected,
    hideTabs,
    isExpandedCifra,
    isTwoColumns,
    progressionMarkOverrides,
    transposeSteps,
  });

  const {
    handleDiscardDraft,
    handleSaveCifra,
    hasDraftChanges,
    isSavingCifra,
    markCifraContentAsEdited,
    openEditorToolBox,
    saveError,
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
    setHasEditedCifraContent,
    setHasEditedLayoutContent,
    setIsEditing,
    setSongDataFetched,
    setToolBoxBtnStatus,
    setToolBoxRequestedPanel,
    shouldUseHorizontalColumnFlow,
    songDataFetched,
    visibleContentBlocks,
  });

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
    shouldUseHorizontalColumnFlow: shouldUseHorizontalColumnFlow && liveView !== "setlist",
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

  const goToLiveSetlistSong = useCallback(
    (song) => {
      goToSetlistSong(song, { preserveLiveMode: true });
      setLiveView("cifra");
    },
    [goToSetlistSong],
  );

  return (
    <div
      ref={liveModeRootRef}
      tabIndex={effectiveLiveMode ? -1 : undefined}
      className={`flex h-full min-h-0 justify-center ${
        effectiveLiveMode ? "presentation-live-shell" : ""
      } ${
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
          onGoToEditSong={goToEditSong}
          canOpenGuitarPro={canOpenGuitarPro}
          onOpenGuitarProViewer={openGuitarProViewer}
          onEnterLiveMode={enterLiveMode}
          isTouchVideoActive={isTouchVideoActive}
          onCloseTouchVideo={closeTouchVideo}
          requestedPanel={toolBoxRequestedPanel}
        />
      )}
      <div
        className={`container mx-auto h-full min-h-0 ${
          shouldUseFullBleedLayout ? "max-w-none px-0" : ""
        }`}
      >
        <div
          className={`flex h-full min-h-0 flex-col ${
            shouldUseFullBleedLayout
              ? "w-full max-w-none px-0"
              : "w-11/12 2xl:w-9/12 mx-auto"
          }`}
        >
          <PresentationTopBar
            visible={!effectiveLiveMode}
            isTouchLayout={isTouchLayout}
            isTouchVideoActive={isTouchVideoActive}
            songFromURL={songFromURL}
            artistFromURL={artistFromURL}
            activeLayoutLabel={activeLayoutLabel}
            previousSetlistSong={previousSetlistSong}
            nextSetlistSong={nextSetlistSong}
            toolBoxBtnStatus={toolBoxBtnStatus}
            isEditing={isEditing}
            isVideoModalOpen={isVideoModalOpen}
            openEditorToolBox={openEditorToolBox}
            onToggleToolBox={() =>
              toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
            }
            isExpandedCifra={isExpandedCifra}
            onToggleExpanded={() => setIsExpandedCifra((value) => !value)}
            onGoToEditSong={goToEditSong}
            instrumentSelected={instrumentSelected}
            canOpenGuitarPro={canOpenGuitarPro}
            onOpenGuitarProViewer={openGuitarProViewer}
            onEnterLiveMode={enterLiveMode}
            onGoToSetlistSong={goToSetlistSong}
          />
          <PresentationLiveHeader
            effectiveLiveMode={effectiveLiveMode}
            isTouchLayout={isTouchLayout}
            songFromURL={songFromURL}
            artistFromURL={artistFromURL}
            previousSetlistSong={previousSetlistSong}
            nextSetlistSong={nextSetlistSong}
            liveView={liveView}
            liveCifraZoomLabel={liveCifraZoomLabel}
            blockSpacingLabel={blockSpacingLabel}
            onDecreaseZoom={() => adjustLiveCifraZoom(-10)}
            onIncreaseZoom={() => adjustLiveCifraZoom(10)}
            onDecreaseSpacing={() => adjustActiveBlockSpacingStep(-1)}
            onIncreaseSpacing={() => adjustActiveBlockSpacingStep(1)}
            onOpenSetlist={() => setLiveView("setlist")}
            onCloseSetlist={() => setLiveView("cifra")}
            onGoToSetlistSong={goToLiveSetlistSong}
            onExit={() => {
              setLiveView("cifra");
              exitLiveMode();
            }}
          />
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <PresentationHorizontalNav
            open={shouldUseHorizontalColumnFlow && liveView !== "setlist"}
            effectiveLiveMode={effectiveLiveMode}
            onNavigate={scrollExpandedLayout}
          />

          <div
            ref={presentationContentRef}
            tabIndex={effectiveLiveMode ? 0 : -1}
            title={
              !effectiveLiveMode &&
              !isEditing &&
              !activeChordTooltip &&
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
              effectiveLiveMode && isTouchLayout
                ? "presentation-live-content-touch"
                : ""
            } ${
              effectiveLiveMode && liveView === "setlist"
                ? "presentation-live-setlist-content"
                : ""
            } ${
              shouldUseHorizontalColumnFlow && liveView !== "setlist"
                ? "presentation-expanded-cifra-horizontal"
                : ""
            } ${
              shouldUseExpandedVerticalFlow && liveView !== "setlist"
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
            {effectiveLiveMode && liveView === "setlist" ? (
              <PresentationLiveSetlistScreen
                artistFromURL={artistFromURL}
                onBackToCifra={() => setLiveView("cifra")}
                onSelectSong={goToLiveSetlistSong}
                setlistSongs={setlistSongs}
                songFromURL={songFromURL}
              />
            ) : isRouteSongLoading || isCurrentInstrumentUnavailable ? (
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
                onInput={isEditing ? markCifraContentAsEdited : undefined}
                onPaste={
                  isEditing ? () => setHasEditedCifraContent(true) : undefined
                }
                onCut={
                  isEditing ? () => setHasEditedCifraContent(true) : undefined
                }
                onKeyDown={
                  isEditing
                    ? (event) => {
                        if (moveToAdjacentEditableBlock(event)) {
                          setHasEditedCifraContent(true);
                          return;
                        }
                        if (moveEnterToNextEditableBlock(event)) {
                          return;
                        }
                        if (removeEmptyEditableLine(event)) {
                          setHasEditedCifraContent(true);
                        }
                      }
                    : undefined
                }
              >
                <PresentationColumns
                  columns={activeProgressionRenderColumns}
                  selectContenttoShow={selectContenttoShow}
                  showProgressionMarkers={showProgressionMarkers}
                  effectiveLiveMode={effectiveLiveMode}
                  shouldUseHorizontalColumnFlow={shouldUseHorizontalColumnFlow}
                  selectedBlockKeys={[]}
                  activeLiveColumnKey={activeLiveColumnKey}
                  isEditing={isEditing}
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
