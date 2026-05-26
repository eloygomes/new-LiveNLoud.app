/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaDownLeftAndUpRightToCenter,
  FaGear,
  FaPenToSquare,
  FaUpRightAndDownLeftFromCenter,
} from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import ToolBox from "./ToolBox";
import {
  allDataFromOneSong,
  fetchUserSongs,
  loadDashboardVisibleSongs,
  loadSelectedSetlists,
  updateLastPlayed,
  updateInstrumentNotes,
  updateSongEntry,
} from "../../Tools/Controllers";
import { useRef } from "react";
import SnackBar from "../../Tools/SnackBar";
import MobileSnackBar from "../../Tools/MobileSnackBar";
import ToolBoxYT from "./ToolBoxYT";
import DraggableComponent from "./DraggableComponent";

import { processSongCifra } from "./ProcessSongCifra";
import { inferDisplayKey, transposeCifra } from "./transposeCifra";
import PresentationChordTooltip, {
  findChordTooltipData,
} from "./PresentationChordTooltip";
import {
  getRegisteredScrollController,
  registerScrollViewport,
  unregisterScrollViewport,
} from "./presentationScrollController";
import ChordSheetJS from "chordsheetjs";
import GuitarProViewerModal from "../../components/GuitarPro/GuitarProViewerModal";
import GuitarProIcon from "../../components/GuitarPro/GuitarProIcon";
import {
  buildInstrumentPresentationLayouts,
  getPresentationLayoutSettingsSnapshot,
  normalizePresentationLayoutVariant,
  toPresentationLayoutPayload,
} from "./presentationLayoutHelpers";

const toolBoxBtnStatusChange = (status, setStatus) => {
  setStatus(!status);
};

const PRESENTATION_INSTRUMENTS = [
  { key: "guitar01", label: "Guitar 1" },
  { key: "guitar02", label: "Guitar 2" },
  { key: "bass", label: "Bass" },
  { key: "keys", label: "Keys" },
  { key: "drums", label: "Drums" },
  { key: "voice", label: "Voice" },
];
const PRESENTATION_INSTRUMENT_MAP = { keyboard: "keys", key: "keys" };

const safeDecodeURIComponent = (value = "") => {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
};

const normalizePresentationInstrumentValue = (value = "") => {
  const normalized = PRESENTATION_INSTRUMENT_MAP[value] || value || "keys";
  return PRESENTATION_INSTRUMENTS.some(
    (instrument) => instrument.key === normalized,
  )
    ? normalized
    : "keys";
};

const PROGRESSION_MARKER_COLORS = [
  "#d4a017",
  "#3d7eff",
  "#2a9d8f",
  "#e76f51",
  "#8a5cf6",
  "#c44569",
];

const getProgressionMarkerTitle = (block = "", progressionIndex = null) => {
  const sectionMatch = block.match(/\[([^\]]+)\]/);
  if (sectionMatch?.[1]) return sectionMatch[1];
  if (progressionIndex == null) return "";
  return `Part ${progressionIndex}`;
};

const getColumnLabelFromIndex = (value = 1) => {
  let index = Math.max(1, Number.parseInt(value, 10) || 1);
  let label = "";

  while (index > 0) {
    index -= 1;
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26);
  }

  return label;
};

const MAX_EXPANDED_COLUMN_LINE_UNITS = 32;

const estimateHtmlLineUnits = (html = "") => {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/pre>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ");

  return Math.max(
    1,
    text
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0).length,
  );
};

const splitHtmlBlockByPreElements = (html = "") => {
  const preMatches = Array.from(html.matchAll(/<pre\b[\s\S]*?<\/pre>/gi)).map(
    (match) => match[0],
  );

  if (preMatches.length <= 1) {
    return [html];
  }

  const wrapperMatch = html.match(/^<div\b([^>]*)>/i);
  const wrapperAttributes = wrapperMatch?.[1] || "";

  return preMatches.map(
    (preHtml, index) =>
      `<div${wrapperAttributes} data-column-fragment="${index + 1}">\n${preHtml}\n</div>`,
  );
};

const splitBlocksIntoColumnChunks = (
  blocks = [],
  maxLineUnits = MAX_EXPANDED_COLUMN_LINE_UNITS,
) => {
  const chunks = [];
  let currentChunk = [];
  let currentLineUnits = 0;

  blocks.forEach((entry) => {
    splitHtmlBlockByPreElements(entry.block).forEach((fragmentHtml, index) => {
      const fragment = {
        ...entry,
        block:
          index === 0 && fragmentHtml === entry.block
            ? entry.block
            : fragmentHtml,
        blockKey:
          index === 0
            ? entry.blockKey
            : `${entry.blockKey}-fragment-${index + 1}`,
      };
      const lineUnits = estimateHtmlLineUnits(fragment.block);

      if (
        currentChunk.length &&
        currentLineUnits + lineUnits > maxLineUnits
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentLineUnits = 0;
      }

      currentChunk.push(fragment);
      currentLineUnits += lineUnits;
    });
  });

  if (currentChunk.length) {
    chunks.push(currentChunk);
  }

  return chunks.length ? chunks : [blocks];
};

const buildProgressionBlocks = (htmlBlocks, { hideTabs = false } = {}) => {
  let progressionCounter = 0;

  return htmlBlocks.reduce((blocksToRender, block, index) => {
    const classMatch = block.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1].split(" ") : [];

    const shouldHideTabBlock =
      hideTabs &&
      (classes.includes("presentation-combined-tab-chords") ||
        classes.includes("presentation-tab") ||
        classes.includes("presentation-tab-section"));

    if (shouldHideTabBlock) {
      return blocksToRender;
    }

    const isProgressionEligible =
      !classes.includes("presentation-blank-line") &&
      !block.includes('class="presentation-blank-line"');

    const progressionIndex = isProgressionEligible ? ++progressionCounter : null;

    blocksToRender.push({
      block,
      classes,
      index,
      blockKey: `block-${index}`,
      isProgressionEligible,
      progressionIndex,
      progressionTitle: getProgressionMarkerTitle(block, progressionIndex),
    });

    return blocksToRender;
  }, []);
};

const getPresentationLayoutsStorageKey = ({
  artist = "",
  song = "",
  instrument = "",
} = {}) =>
  [
    "presentation-layouts",
    String(artist || "").trim().toLowerCase(),
    String(song || "").trim().toLowerCase(),
    String(instrument || "").trim().toLowerCase(),
  ].join("::");

const getPresentationLayoutModeStorageKey = ({
  artist = "",
  song = "",
  instrument = "",
} = {}) =>
  [
    "presentation-layout-mode",
    String(artist || "").trim().toLowerCase(),
    String(song || "").trim().toLowerCase(),
    String(instrument || "").trim().toLowerCase(),
  ].join("::");

const instrumentHasPresentationContent = (instrumentData) => {
  if (!instrumentData) return false;

  const presentationLayouts = buildInstrumentPresentationLayouts(instrumentData);
  if (
    [presentationLayouts.default, presentationLayouts.expanded].some(
      (layout) =>
        typeof layout.songCifra === "string" &&
        layout.songCifra.trim() !== "" &&
        layout.songCifra !== "Loading...",
    )
  ) {
    return true;
  }

  return ["songCifra", "songChords", "songTabs", "songLyrics"].some(
    (field) => {
      const value = instrumentData[field];
      return (
        typeof value === "string" &&
        value.trim() !== "" &&
        value !== "Loading..."
      );
    },
  );
};

const isInstrumentRegistered = (songData, instrumentKey) =>
  Boolean(
    songData?.instruments?.[instrumentKey] ||
      songData?.[instrumentKey]?.active === true ||
      songData?.[instrumentKey]?.active === "true" ||
      instrumentHasPresentationContent(songData?.[instrumentKey]),
  );

function Presentation() {
  const navigate = useNavigate();
  const { artist: routeArtist, song: routeSong, instrument: routeInstrument } =
    useParams();
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
  const [marksEditorOpen, setMarksEditorOpen] = useState(false);

  const [selectContenttoShow, setSelectContenttoShow] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [draftCifra, setDraftCifra] = useState("");
  const [isSavingCifra, setIsSavingCifra] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [setlistSongs, setSetlistSongs] = useState([]);
  const [isRouteSongLoading, setIsRouteSongLoading] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });
  const [activeChordTooltip, setActiveChordTooltip] = useState(null);
  const [selectedChordVariations, setSelectedChordVariations] = useState({});
  const [
    selectedChordOccurrenceVariations,
    setSelectedChordOccurrenceVariations,
  ] = useState({});
  const presentationContentRef = useRef(null);
  const tooltipHideTimeoutRef = useRef(null);
  const editOriginalCifraRef = useRef("");

  const clearTooltipHideTimeout = useCallback(() => {
    if (tooltipHideTimeoutRef.current) {
      window.clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }
  }, []);

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
  const progressionBadgeSide =
    activePresentationLayout?.progressionBadgeSide === "left" ? "left" : "right";
  const progressionMarkOverrides =
    activePresentationLayout?.progressionMarkOverrides || {};
  const touchFontSizeStep = activePresentationLayout?.fontSizeStep ?? 0;
  const activeLayoutLabel = isExpandedCifra
    ? "Expanded layout"
    : "Default layout";

  const normalizedSongCifra = useMemo(
    () => normalizeCifra(songCifraData),
    [songCifraData, normalizeCifra],
  );
  const editableSongCifra = normalizedSongCifra;

  useEffect(() => {
    if (!isEditing) {
      setDraftCifra(editableSongCifra);
    }
  }, [editableSongCifra, isEditing]);

  const previousActiveLayoutVariantRef = useRef(activeLayoutVariant);

  useEffect(() => {
    if (previousActiveLayoutVariantRef.current === activeLayoutVariant) return;

    previousActiveLayoutVariantRef.current = activeLayoutVariant;
    setDraftCifra(editableSongCifra);
    setSaveError("");
  }, [activeLayoutVariant, editableSongCifra]);

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

  const handleDataFromAPI = (data, instrumentSelected) => {
    if (data && data[instrumentSelected]) {
      return data[instrumentSelected];
    } else {
      console.log("Instrumento não encontrado ou data é undefined");
      return null;
    }
  };

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

  const normalizePresentationInstrument = useCallback((value = "") => {
    return normalizePresentationInstrumentValue(value);
  }, []);

  const resetTransientPresentationState = useCallback(() => {
    clearTooltipHideTimeout();
    setActiveChordTooltip(null);
    setToolBoxBtnStatus(false);
    setNotesModalStatus(false);
    setIsVideoModalOpen(false);
    setIsTouchVideoActive(false);
    setIsTouchVideoMenuOpen(false);
    setGuitarProViewerOpen(false);
    setSelectedGuitarProFile(null);
    setIsEditing(false);
    setSaveError("");
    setMarksEditorOpen(false);
    presentationContentRef.current?.scrollTo?.({ top: 0, left: 0 });
  }, [clearTooltipHideTimeout]);

  const navigatePresentationPath = useCallback(
    (path) => {
      resetTransientPresentationState();

      if (
        document.fullscreenElement &&
        typeof document.exitFullscreen === "function"
      ) {
        try {
          document.exitFullscreen();
        } catch (error) {
          console.warn("Failed to exit fullscreen before navigation:", error);
        }
      }

      if (window.location.pathname === path) {
        setIsRouteSongLoading(false);
        return;
      }

      navigate(path);
    },
    [navigate, resetTransientPresentationState],
  );

  useEffect(() => {
    resetTransientPresentationState();
  }, [presentationRouteKey, resetTransientPresentationState]);

  const goToInstrument = useCallback(
    (instrumentKey) => {
      if (!instrumentKey) return;

      const nextInstrument = normalizePresentationInstrumentValue(instrumentKey);
      setIsRouteSongLoading(true);
      setInstrumentSelected(nextInstrument);

      navigatePresentationPath(
        `/presentation/${encodeURIComponent(
          decodedRouteArtist || artistFromURL || "",
        )}/${encodeURIComponent(decodedRouteSong || songFromURL || "")}/${encodeURIComponent(
          nextInstrument,
        )}`,
      );
    },
    [
      artistFromURL,
      decodedRouteArtist,
      decodedRouteSong,
      navigatePresentationPath,
      songFromURL,
    ],
  );

  const goToEditSong = useCallback(() => {
    localStorage.setItem("song", songFromURL || "");
    localStorage.setItem("artist", artistFromURL || "");

    navigate(
      `/editsong/${encodeURIComponent(
        decodedRouteArtist || artistFromURL || "",
      )}/${encodeURIComponent(decodedRouteSong || songFromURL || "")}`,
    );
  }, [artistFromURL, decodedRouteArtist, decodedRouteSong, navigate, songFromURL]);

  const startEditingCifra = () => {
    editOriginalCifraRef.current = editableSongCifra;
    setSaveError("");
    setIsEditing(true);
    setDraftCifra(editableSongCifra);
    setActiveShowProgressionMarkers(true);
  };

  const handleDiscardDraft = () => {
    setDraftCifra(editOriginalCifraRef.current || editableSongCifra);
    setIsEditing(false);
    setSaveError("");
  };

  const [lastSaveTimestamp, setLastSaveTimestamp] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPseudoLiveMode, setIsPseudoLiveMode] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [guitarProViewerOpen, setGuitarProViewerOpen] = useState(false);
  const [selectedGuitarProFile, setSelectedGuitarProFile] = useState(null);
  const [touchVideoLink, setTouchVideoLink] = useState("");
  const [isTouchVideoActive, setIsTouchVideoActive] = useState(false);
  const [isTouchVideoMenuOpen, setIsTouchVideoMenuOpen] = useState(false);
  const [notesModalStatus, setNotesModalStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [resizingProgressionWidths, setResizingProgressionWidths] = useState({});
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
  const guitarProFiles = useMemo(
    () =>
      Array.isArray(songDataFetched?.guitarProFiles)
        ? songDataFetched.guitarProFiles
        : [],
    [songDataFetched],
  );
  const hasGuitarProFiles = guitarProFiles.length > 0;
  const canOpenGuitarPro = instrumentSelected !== "voice" && hasGuitarProFiles;

  const openGuitarProViewer = useCallback(() => {
    if (instrumentSelected === "voice" || !guitarProFiles.length) return;

    let file = guitarProFiles[0];
    if (guitarProFiles.length > 1) {
      const optionsText = guitarProFiles
        .map((entry, index) => `${index + 1}. ${entry.originalName}`)
        .join("\n");
      const selection = window.prompt(`Qual arquivo deseja abrir?\n${optionsText}`);
      const selectedIndex = Number.parseInt(selection || "", 10) - 1;
      file = guitarProFiles[selectedIndex];
      if (!file) return;
    }

    setSelectedGuitarProFile(file);
    setGuitarProViewerOpen(true);
  }, [guitarProFiles, instrumentSelected]);

  const currentSetlistSongIndex = useMemo(() => {
    const normalizedArtist = (artistFromURL || decodedRouteArtist)
      .trim()
      .toLowerCase();
    const normalizedSong = (songFromURL || decodedRouteSong)
      .trim()
      .toLowerCase();

    if (!normalizedArtist || !normalizedSong) return -1;

    return setlistSongs.findIndex(
      (song) =>
        (song.artist || "").trim().toLowerCase() === normalizedArtist &&
        (song.song || "").trim().toLowerCase() === normalizedSong,
    );
  }, [artistFromURL, decodedRouteArtist, decodedRouteSong, setlistSongs, songFromURL]);

  const previousSetlistSong =
    currentSetlistSongIndex > 0
      ? setlistSongs[currentSetlistSongIndex - 1]
      : null;
  const nextSetlistSong =
    currentSetlistSongIndex >= 0 &&
    currentSetlistSongIndex < setlistSongs.length - 1
      ? setlistSongs[currentSetlistSongIndex + 1]
      : null;

  const goToSetlistSong = useCallback(
    (song) => {
      if (!song) return;

      const nextArtist = String(song.artist || "").trim();
      const nextSong = String(song.song || "").trim();
      if (!nextArtist || !nextSong) return;

      const nextInstrument = instrumentSelected || decodedRouteInstrument;
      setIsRouteSongLoading(true);
      setArtistFromURL(nextArtist);
      setSongFromURL(nextSong);
      setSongDataFetched(undefined);
      setEmbedLinks([]);

      navigatePresentationPath(
        `/presentation/${encodeURIComponent(nextArtist)}/${encodeURIComponent(
          nextSong,
        )}/${encodeURIComponent(
          nextInstrument,
        )}`,
      );
    },
    [
      decodedRouteInstrument,
      instrumentSelected,
      navigatePresentationPath,
    ],
  );

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

  const focusLiveViewport = useCallback(() => {
    const contentNode = presentationContentRef.current;
    if (!contentNode) return;

    try {
      window.focus();
    } catch {}

    requestAnimationFrame(() => {
      contentNode.focus({ preventScroll: true });
    });
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
  const lastHydratedLayoutIdentityRef = useRef("");
  const skipNextLayoutPersistRef = useRef(false);
  const skipNextModePersistRef = useRef(false);

  const updatePresentationLayoutVariant = useCallback(
    (variantKey, update) => {
      setSongDataFetched((prev) => {
        if (!prev || !instrumentSelected) return prev;

        const currentInstrument = prev[instrumentSelected] || {};
        const currentLayouts = buildInstrumentPresentationLayouts(
          currentInstrument,
        );
        const currentVariantLayout = currentLayouts[variantKey];
        const nextVariantLayoutInput =
          typeof update === "function"
            ? update(currentVariantLayout, currentLayouts)
            : {
                ...currentVariantLayout,
                ...(update || {}),
              };
        const nextVariantLayout = normalizePresentationLayoutVariant(
          nextVariantLayoutInput,
          {
            fallbackSongCifra:
              currentVariantLayout?.songCifra || currentInstrument.songCifra || "",
            defaultTwoColumns: variantKey === "expanded",
          },
        );
        const nextLayouts = {
          ...currentLayouts,
          [variantKey]: nextVariantLayout,
        };
        const nextInstrument = {
          ...currentInstrument,
          presentationLayouts: toPresentationLayoutPayload(nextLayouts),
          songCifra: nextLayouts.default.songCifra,
        };

        return {
          ...prev,
          [instrumentSelected]: nextInstrument,
          updateIn: new Date().toISOString().split("T")[0],
        };
      });
    },
    [instrumentSelected],
  );

  const updateActivePresentationLayout = useCallback(
    (update) => {
      updatePresentationLayoutVariant(activeLayoutVariant, update);
    },
    [activeLayoutVariant, updatePresentationLayoutVariant],
  );

  const setActiveShowProgressionMarkers = useCallback(
    (valueOrUpdater) => {
      updateActivePresentationLayout((currentLayout) => ({
        ...currentLayout,
        showProgressionMarkers:
          typeof valueOrUpdater === "function"
            ? valueOrUpdater(currentLayout.showProgressionMarkers)
            : Boolean(valueOrUpdater),
      }));
    },
    [updateActivePresentationLayout],
  );

  const toggleActiveProgressionBadgeSide = useCallback(() => {
    updateActivePresentationLayout((currentLayout) => ({
      ...currentLayout,
      progressionBadgeSide:
        currentLayout?.progressionBadgeSide === "left" ? "right" : "left",
    }));
  }, [updateActivePresentationLayout]);

  const adjustActiveFontSizeStep = useCallback(
    (delta) => {
      updateActivePresentationLayout((currentLayout) => ({
        ...currentLayout,
        fontSizeStep: clampPresentationFontSizeStep(
          (currentLayout.fontSizeStep ?? 0) + delta,
        ),
      }));
    },
    [updateActivePresentationLayout],
  );

  const handleSaveCifra = async () => {
    if (!instrumentSelected || !songDataFetched) {
      setSaveError("Sem dados da música carregados para salvar.");
      pushSnackbarMessage(
        "Erro",
        "Sem dados da música carregados para salvar.",
      );
      return;
    }
    setIsSavingCifra(true);
    setSaveError("");

    const currentLayouts = buildInstrumentPresentationLayouts(currentInstrumentData);
    const nextLayouts = {
      ...currentLayouts,
      [activeLayoutVariant]: normalizePresentationLayoutVariant(
        {
          ...currentLayouts[activeLayoutVariant],
          songCifra: draftCifra,
        },
        {
          fallbackSongCifra: draftCifra,
          defaultTwoColumns: activeLayoutVariant === "expanded",
        },
      ),
    };
    const persistedLayouts = toPresentationLayoutPayload(nextLayouts);
    const updatedBlock = {
      ...currentInstrumentData,
      songCifra: nextLayouts.default.songCifra,
      presentationLayouts: persistedLayouts,
    };

    const nextSongData = {
      ...(songDataFetched || {}),
      [instrumentSelected]: updatedBlock,
      updateIn: new Date().toISOString().split("T")[0],
    };

    try {
      await updateSongEntry(nextSongData);

      setSongDataFetched((prev) => ({
        ...(prev || {}),
        ...nextSongData,
        [instrumentSelected]: {
          ...updatedBlock,
          presentationLayouts: toPresentationLayoutPayload(nextLayouts),
        },
      }));
      setIsEditing(false);
      const timestamp = new Date().toLocaleTimeString();
      setLastSaveTimestamp(timestamp);
      pushSnackbarMessage("Salvo", `Último salvamento às ${timestamp}`);
    } catch (error) {
      setSaveError("Não foi possível salvar a cifra. Tente novamente.");
      pushSnackbarMessage(
        "Erro",
        "Não foi possível salvar a cifra. Tente novamente.",
      );
      console.error("Erro ao salvar cifra:", error);
    } finally {
      setIsSavingCifra(false);
    }
  };

  const hasDraftChanges =
    ((isEditing ? editOriginalCifraRef.current : editableSongCifra) || "") !==
    (draftCifra || "");
  const shouldUseTwoColumns = isTwoColumns;
  const shouldUseHorizontalColumnFlow = isExpandedCifra && shouldUseTwoColumns;
  const shouldUseExpandedVerticalFlow = isExpandedCifra && !shouldUseTwoColumns;
  const renderContentSelected =
    isEditing && ["default", "full"].includes(selectContenttoShow)
      ? draftCifra
      : contentSelected;
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
    () => buildProgressionBlocks(htmlBlocks, { hideTabs }),
    [hideTabs, htmlBlocks],
  );

  const progressionRenderGroups = useMemo(() => {
    const groupedBlocks = new Map();

    visibleContentBlocks.forEach((entry, visibleIndex) => {
      const blockKey = entry.blockKey || `block-${entry.index}`;
      const override = progressionMarkOverrides[blockKey] || {};
      const rawPosition = override.position ?? entry.progressionIndex;
      const numericPosition =
        Number.parseInt(rawPosition, 10) || entry.progressionIndex || visibleIndex + 1;
      const groupKey = entry.isProgressionEligible
        ? `progression-${numericPosition}`
        : `raw-${entry.index}`;
      const existingGroup = groupedBlocks.get(groupKey);
      const fallbackTitle = entry.progressionTitle;
      const width = Number.isFinite(Number(override.width))
        ? Number(override.width)
        : undefined;
      const height = Number.isFinite(Number(override.height))
        ? Number(override.height)
        : undefined;

      if (existingGroup) {
        existingGroup.blocks.push(entry);
        existingGroup.blockKeys.push(blockKey);
        existingGroup.width = existingGroup.width ?? width;
        existingGroup.height = existingGroup.height ?? height;
        return;
      }

      groupedBlocks.set(groupKey, {
        groupKey,
        blockKeys: [blockKey],
        blocks: [entry],
        isProgressionEligible: entry.isProgressionEligible,
        columnIndex: numericPosition,
        displayPosition: numericPosition,
        displayTitle: override.title ?? fallbackTitle,
        firstVisibleIndex: visibleIndex,
        width,
        height,
      });
    });

    return Array.from(groupedBlocks.values()).sort((left, right) => {
      if (left.isProgressionEligible && right.isProgressionEligible) {
        return left.columnIndex - right.columnIndex;
      }

      return left.firstVisibleIndex - right.firstVisibleIndex;
    });
  }, [progressionMarkOverrides, visibleContentBlocks]);

  const progressionRenderColumns = useMemo(() => {
    let visualColumnIndex = 0;

    return progressionRenderGroups.flatMap((group) => {
      if (!group.isProgressionEligible) {
        visualColumnIndex += 1;
        return [
          {
            ...group,
            visualColumnIndex,
            visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
          },
        ];
      }

      const chunks = splitBlocksIntoColumnChunks(group.blocks);

      return chunks.map((blocksChunk, chunkIndex) => {
        visualColumnIndex += 1;
        return {
          ...group,
          baseGroupKey: group.groupKey,
          groupKey:
            chunkIndex === 0
              ? group.groupKey
              : `${group.groupKey}-overflow-${chunkIndex + 1}`,
          blocks: blocksChunk,
          blockKeys: group.blockKeys,
          isOverflowContinuation: chunkIndex > 0,
          visualColumnIndex,
          visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
        };
      });
    });
  }, [progressionRenderGroups]);

  const activeProgressionRenderColumns = useMemo(() => {
    if (shouldUseHorizontalColumnFlow) {
      return progressionRenderColumns;
    }

    return progressionRenderGroups.map((group, index) => {
      const visualColumnIndex =
        Number.parseInt(group.displayPosition, 10) || index + 1;

      return {
        ...group,
        baseGroupKey: group.groupKey,
        visualColumnIndex,
        visualColumnLabel: getColumnLabelFromIndex(visualColumnIndex),
      };
    });
  }, [
    progressionRenderColumns,
    progressionRenderGroups,
    shouldUseHorizontalColumnFlow,
  ]);

  const marksEditorSource = useMemo(() => {
    if (!isEditing || !["default", "full"].includes(selectContenttoShow)) {
      return transposedContent;
    }
    return transposeCifra(draftCifra, transposeSteps);
  }, [
    draftCifra,
    isEditing,
    selectContenttoShow,
    transposedContent,
    transposeSteps,
  ]);

  const markEntries = useMemo(() => {
    if (
      typeof marksEditorSource !== "string" ||
      marksEditorSource.trim() === "" ||
      marksEditorSource === "Loading..."
    ) {
      return [];
    }

    try {
      const sourceBlocks =
        processSongCifra(marksEditorSource).htmlBlocks || [];
      return buildProgressionBlocks(sourceBlocks, { hideTabs: false })
        .filter((entry) => entry.isProgressionEligible)
        .map((entry) => {
          const override = progressionMarkOverrides[entry.blockKey] || {};
          return {
            blockKey: entry.blockKey,
            defaultPosition: entry.progressionIndex,
            position: override.position ?? entry.progressionIndex,
            columnLabel: getColumnLabelFromIndex(
              override.position ?? entry.progressionIndex,
            ),
            title: override.title ?? entry.progressionTitle,
          };
        });
    } catch {
      return [];
    }
  }, [marksEditorSource, progressionMarkOverrides]);

  // console.log("songLyrics", songLyrics);
  // console.log("songChords", songChords);
  // console.log("songTabs", songTabs);

  // console.log("htmlBlocks", htmlBlocks);
  // console.log("htmlBlocks", typeof htmlBlocks); // objeto

  // console.log("songCifraData", songCifraData);
  // console.log("songCifraData", typeof songCifraData); // string

  // console.log("htmlBlocks", htmlBlocks);

  const didPingRef = useRef(false);

  const scheduleTooltipHide = useCallback(() => {
    clearTooltipHideTimeout();
    tooltipHideTimeoutRef.current = window.setTimeout(() => {
      setActiveChordTooltip(null);
      tooltipHideTimeoutRef.current = null;
    }, 150);
  }, [clearTooltipHideTimeout]);

  const buildTooltipState = useCallback(
    (chordElement, chordData) => {
      const rect = chordElement.getBoundingClientRect();
      const isExpanded =
        activeChordTooltip?.data?.chordId === chordData.chordId;
      const tooltipWidth = isExpanded ? 860 : 184;
      const spacing = 14;
      const safeLeft = Math.min(
        Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
        window.innerWidth - tooltipWidth - 12,
      );

      return {
        chord: chordData.chordLabel,
        data: chordData,
        position: {
          x: safeLeft,
          y: rect.bottom + spacing,
        },
      };
    },
    [activeChordTooltip],
  );

  const updateChordTooltip = useCallback(
    (target) => {
      clearTooltipHideTimeout();

      if (!(target instanceof HTMLElement)) {
        setActiveChordTooltip(null);
        return;
      }

      const chordElement = target.closest(".notespresentation[data-chord]");
      if (!chordElement) {
        setActiveChordTooltip(null);
        return;
      }

      const rawChord = chordElement.getAttribute("data-chord") || "";
      const chordId = chordElement.getAttribute("data-chord-id") || "";
      const chordData = findChordTooltipData(rawChord);

      if (!chordData) {
        setActiveChordTooltip(null);
        return;
      }

      const nextTooltipData = {
        ...chordData,
        chordId,
      };

      setActiveChordTooltip(buildTooltipState(chordElement, nextTooltipData));
    },
    [buildTooltipState, clearTooltipHideTimeout],
  );

  const handleApplyChordVariation = useCallback(
    ({ chordLabel, chordId, variationIndex, applyToAll }) => {
      if (applyToAll) {
        setSelectedChordVariations((current) => ({
          ...current,
          [chordLabel]: variationIndex,
        }));
      } else {
        setSelectedChordOccurrenceVariations((current) => ({
          ...current,
          [chordId]: variationIndex,
        }));
      }
      clearTooltipHideTimeout();
      setActiveChordTooltip(null);
    },
    [clearTooltipHideTimeout],
  );

  const getSelectedVariationIndex = useCallback(
    (tooltipData) => {
      if (!tooltipData) return 0;
      if (
        Object.prototype.hasOwnProperty.call(
          selectedChordOccurrenceVariations,
          tooltipData.chordId,
        )
      ) {
        return selectedChordOccurrenceVariations[tooltipData.chordId];
      }
      return selectedChordVariations[tooltipData.chordLabel] ?? 0;
    },
    [selectedChordOccurrenceVariations, selectedChordVariations],
  );

  const handleTooltipEnter = useCallback(() => {
    clearTooltipHideTimeout();
  }, [clearTooltipHideTimeout]);

  const handleTooltipLeave = useCallback(() => {
    scheduleTooltipHide();
  }, [scheduleTooltipHide]);

  const handleCloseTooltip = useCallback(() => {
    clearTooltipHideTimeout();
    setActiveChordTooltip(null);
  }, [clearTooltipHideTimeout]);

  useEffect(() => {
    if (!artistFromURL || !songFromURL || !instrumentSelected) return;

    // evita chamada dupla no StrictMode (dev)
    if (didPingRef.current) return;
    didPingRef.current = true;

    updateLastPlayed(songFromURL, artistFromURL, instrumentSelected).catch(
      (e) => console.error("updateLastPlayed error:", e),
    );
  }, [artistFromURL, songFromURL, instrumentSelected]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        didPingRef.current = false;
        const decodedArtist = decodedRouteArtist;
        const decodedSong = decodedRouteSong;
        const requestedInstrument = decodedRouteInstrument;

        setIsRouteSongLoading(true);
        setInstrumentSelected(requestedInstrument);
        setSongFromURL(decodedSong);
        setArtistFromURL(decodedArtist);
        setSongDataFetched(undefined);
        setEmbedLinks([]);
        localStorage.setItem("song", decodedSong);
        localStorage.setItem("artist", decodedArtist);

        const dataFromSong = await allDataFromOneSong(decodedArtist, decodedSong);
        const dataFromSongparsedResult = JSON.parse(dataFromSong);
        const hydratedSongData = { ...dataFromSongparsedResult };

        if (!active) return;

        PRESENTATION_INSTRUMENTS.forEach(({ key }) => {
          const instrumentData = hydratedSongData[key];
          if (!instrumentData) return;

          const sanitizedLayouts = buildInstrumentPresentationLayouts(
            instrumentData,
          );

          hydratedSongData[key] = {
            ...instrumentData,
            songCifra: sanitizedLayouts.default.songCifra || instrumentData.songCifra || "",
            presentationLayouts: toPresentationLayoutPayload(sanitizedLayouts),
          };
        });

        const firstAvailableInstrument =
          PRESENTATION_INSTRUMENTS.find(
            ({ key }) =>
              isInstrumentRegistered(hydratedSongData, key) &&
              instrumentHasPresentationContent(hydratedSongData[key]),
          )?.key || requestedInstrument;
        const selectedInstrument =
          isInstrumentRegistered(hydratedSongData, requestedInstrument) &&
          instrumentHasPresentationContent(hydratedSongData[requestedInstrument])
            ? requestedInstrument
            : firstAvailableInstrument;

        setSongDataFetched(hydratedSongData);
        setEmbedLinks(
          Array.isArray(hydratedSongData.embedVideos)
            ? hydratedSongData.embedVideos
            : [],
        );
        setInstrumentSelected(selectedInstrument);

        if (selectedInstrument !== requestedInstrument) {
          navigate(
            `/presentation/${encodeURIComponent(
              decodedArtist,
            )}/${encodeURIComponent(decodedSong)}/${encodeURIComponent(
              selectedInstrument,
            )}`,
            { replace: true },
          );
        }

        handleDataFromAPI(hydratedSongData, selectedInstrument);
      } catch (error) {
        if (!active) return;
        console.error("Error fetching song data:", error);
        setSongDataFetched(null);
        setEmbedLinks([]);
        handleDataFromAPI(null, "");
      } finally {
        if (active) {
          setIsRouteSongLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [
    decodedRouteArtist,
    decodedRouteInstrument,
    decodedRouteSong,
    navigate,
  ]);

  useEffect(() => {
    const loadSetlistNavigation = async () => {
      const currentArtist = decodedRouteArtist.trim().toLowerCase();
      const currentSong = decodedRouteSong.trim().toLowerCase();
      const dashboardVisibleSongs = loadDashboardVisibleSongs();

      if (dashboardVisibleSongs.length && currentArtist && currentSong) {
        const currentSongIsVisibleOnDashboard = dashboardVisibleSongs.some(
          (song) =>
            String(song.artist || "").trim().toLowerCase() === currentArtist &&
            String(song.song || "").trim().toLowerCase() === currentSong,
        );

        if (currentSongIsVisibleOnDashboard) {
          setSetlistSongs(dashboardVisibleSongs);
          return;
        }
      }

      const selectedSetlists = loadSelectedSetlists().map((setlist) =>
        setlist.trim().toLowerCase(),
      );

      const { songs } = await fetchUserSongs();
      if (!selectedSetlists.length) {
        setSetlistSongs(songs);
        return;
      }

      const filteredSongs = songs.filter((song) => {
        const songSetlists = (song.setlist || []).map((setlist) =>
          setlist.trim().toLowerCase(),
        );

        return selectedSetlists.some((setlist) =>
          songSetlists.includes(setlist),
        );
      });

      setSetlistSongs(filteredSongs);
    };

    loadSetlistNavigation();
  }, [decodedRouteArtist, decodedRouteSong]);

  useEffect(() => {
    const contentNode = presentationContentRef.current;
    if (!contentNode || isEditing) return undefined;

    const handleMouseEnter = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest(".notespresentation[data-chord]")) {
        updateChordTooltip(target);
      }
    };

    const handleMouseOut = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest(".notespresentation[data-chord]")) return;

      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof HTMLElement &&
        (nextTarget.closest(".notespresentation[data-chord]") ||
          nextTarget.closest(".presentation-chord-tooltip"))
      ) {
        return;
      }
      scheduleTooltipHide();
    };

    contentNode.addEventListener("mouseover", handleMouseEnter);
    contentNode.addEventListener("mouseout", handleMouseOut);

    return () => {
      contentNode.removeEventListener("mouseover", handleMouseEnter);
      contentNode.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isEditing, scheduleTooltipHide, updateChordTooltip]);

  useEffect(() => {
    if (isEditing) {
      setActiveChordTooltip(null);
      clearTooltipHideTimeout();
    }
  }, [clearTooltipHideTimeout, isEditing]);

  useEffect(
    () => () => {
      clearTooltipHideTimeout();
    },
    [clearTooltipHideTimeout],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenActive = document.fullscreenElement != null;
      setIsLiveMode(fullscreenActive);
      if (fullscreenActive) {
        setIsPseudoLiveMode(false);
        focusLiveViewport();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [focusLiveViewport]);

  useEffect(() => {
    const viewport = presentationContentRef.current;
    if (!viewport) return undefined;

    registerScrollViewport(viewport);
    return () => {
      unregisterScrollViewport(viewport);
    };
  }, [effectiveLiveMode, hideChords, selectContenttoShow, isEditing]);

  const scrollExpandedLayout = useCallback((direction) => {
    const viewport = presentationContentRef.current;
    if (!viewport) return;

    const blocks = Array.from(
      viewport.querySelectorAll(".presentation-render-block"),
    );
    if (!blocks.length) return;

    const columnOffsets = Array.from(
      new Set(blocks.map((block) => Math.round(block.offsetLeft))),
    ).sort((left, right) => left - right);
    if (!columnOffsets.length) return;

    const currentLeft = viewport.scrollLeft + 20;
    const targetLeft =
      direction > 0
        ? columnOffsets.find((offset) => offset > currentLeft + 8) ??
          columnOffsets[columnOffsets.length - 1]
        : columnOffsets
            .slice()
            .reverse()
            .find((offset) => offset < currentLeft - 8) ?? columnOffsets[0];

    viewport.scrollTo({
      left: Math.max(0, targetLeft - 20),
      behavior: "smooth",
    });
  }, []);

  const handlePresentationContentInput = useCallback((event) => {
    const contentBlocks = Array.from(
      event.currentTarget.querySelectorAll(".presentation-render-content-block"),
    );

    if (!contentBlocks.length) {
      setDraftCifra(event.currentTarget.innerText);
      return;
    }

    setDraftCifra(
      contentBlocks
        .map((block) => block.innerText)
        .join("\n\n")
        .trimEnd(),
    );
  }, []);

  useEffect(() => {
    const viewport = presentationContentRef.current;
    if (
      !viewport ||
      !shouldUseHorizontalColumnFlow ||
      isEditing ||
      effectiveLiveMode
    ) {
      return undefined;
    }

    const handleWheel = (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

      if (!delta) return;
      event.preventDefault();
      viewport.scrollLeft += delta;
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [effectiveLiveMode, isEditing, shouldUseHorizontalColumnFlow]);

  useEffect(() => {
    if (!effectiveLiveMode) return undefined;

    focusLiveViewport();

    const handleWindowFocus = () => {
      focusLiveViewport();
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [focusLiveViewport, effectiveLiveMode]);

  useEffect(() => {
    if (!effectiveLiveMode) return undefined;

    const handleLiveNavigation = (event) => {
      const contentNode = presentationContentRef.current;
      if (!contentNode) return;

      const scrollController = getRegisteredScrollController();

      if (scrollController && event.key === " ") {
        event.preventDefault();
        scrollController.toggleAutoScroll();
        return;
      }

      if (scrollController && event.key === "Escape") {
        event.preventDefault();
        scrollController.stopAutoScroll();
        return;
      }

      if (scrollController && event.key === "ArrowLeft") {
        event.preventDefault();
        scrollController.adjustSpeed(-1);
        return;
      }

      if (scrollController && event.key === "ArrowRight") {
        event.preventDefault();
        scrollController.adjustSpeed(1);
        return;
      }

      let delta = 0;
      if (scrollController && event.key === "ArrowDown") {
        event.preventDefault();
        scrollController.handleVerticalAction("down");
        return;
      }
      if (scrollController && event.key === "ArrowUp") {
        event.preventDefault();
        scrollController.handleVerticalAction("up");
        return;
      }
      if (event.key === "PageDown")
        delta = Math.max(320, window.innerHeight * 0.85);
      if (event.key === "PageUp")
        delta = -Math.max(320, window.innerHeight * 0.85);
      if (event.key === "Home") {
        event.preventDefault();
        if (scrollController) {
          scrollController.scrollViewportTo(0);
          return;
        }
        contentNode.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        if (scrollController) {
          scrollController.scrollViewportTo(contentNode.scrollHeight);
          return;
        }
        contentNode.scrollTo({
          top: contentNode.scrollHeight,
          behavior: "smooth",
        });
        return;
      }

      if (!delta) return;
      event.preventDefault();
      contentNode.scrollBy({ top: delta, behavior: "smooth" });
    };

    window.addEventListener("keydown", handleLiveNavigation);
    return () => {
      window.removeEventListener("keydown", handleLiveNavigation);
    };
  }, [effectiveLiveMode]);

  useEffect(() => {
    if (!isTouchLayout) return undefined;

    window.dispatchEvent(
      new CustomEvent("mobile-ui-visibility-change", {
        detail: { hidden: effectiveLiveMode },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("mobile-ui-visibility-change", {
          detail: { hidden: false },
        }),
      );
    };
  }, [effectiveLiveMode, isTouchLayout]);

  useEffect(() => {
    if (!presentationLayoutModeStorageKey || typeof window === "undefined") {
      return;
    }

    skipNextModePersistRef.current = true;
    const storedLayoutMode = window.localStorage.getItem(
      presentationLayoutModeStorageKey,
    );
    setIsExpandedCifra(storedLayoutMode === "expanded");
  }, [presentationLayoutModeStorageKey]);

  useEffect(() => {
    if (
      !presentationLayoutIdentity ||
      !presentationLayoutStorageKey ||
      !songDataFetched
    ) {
      return;
    }

    if (lastHydratedLayoutIdentityRef.current === presentationLayoutIdentity) {
      return;
    }

    lastHydratedLayoutIdentityRef.current = presentationLayoutIdentity;
    skipNextLayoutPersistRef.current = true;

    if (typeof window === "undefined") return;

    try {
      const rawStoredLayouts = window.localStorage.getItem(
        presentationLayoutStorageKey,
      );
      if (!rawStoredLayouts) return;

      const parsedStoredLayouts = JSON.parse(rawStoredLayouts);
      setSongDataFetched((prev) => {
        if (!prev || !instrumentSelected) return prev;

        const currentInstrument = prev[instrumentSelected] || {};
        const currentLayouts = buildInstrumentPresentationLayouts(
          currentInstrument,
        );
        const nextLayouts = {
          default: normalizePresentationLayoutVariant(
            parsedStoredLayouts?.default,
            {
              fallbackSongCifra: currentLayouts.default.songCifra,
              defaultTwoColumns: false,
            },
          ),
          expanded: normalizePresentationLayoutVariant(
            parsedStoredLayouts?.expanded,
            {
              fallbackSongCifra: currentLayouts.expanded.songCifra,
              defaultTwoColumns: true,
            },
          ),
        };
        const currentSnapshot = getPresentationLayoutSettingsSnapshot(
          currentLayouts,
        );
        const nextSnapshot = getPresentationLayoutSettingsSnapshot(nextLayouts);

        if (
          currentSnapshot === nextSnapshot &&
          currentInstrument.songCifra === nextLayouts.default.songCifra
        ) {
          return prev;
        }

        return {
          ...prev,
          [instrumentSelected]: {
            ...currentInstrument,
            songCifra: nextLayouts.default.songCifra,
            presentationLayouts: toPresentationLayoutPayload(nextLayouts),
          },
        };
      });
    } catch (error) {
      console.error("Erro ao hidratar layouts da presentation:", error);
    }
  }, [
    instrumentSelected,
    presentationLayoutIdentity,
    presentationLayoutStorageKey,
    songDataFetched,
  ]);

  useEffect(() => {
    if (!presentationLayoutStorageKey || typeof window === "undefined") return;
    if (skipNextLayoutPersistRef.current) {
      skipNextLayoutPersistRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(
        presentationLayoutStorageKey,
        JSON.stringify(
          toPresentationLayoutPayload(instrumentPresentationLayouts),
        ),
      );
    } catch (error) {
      console.error(
        "Erro ao persistir layouts da presentation no navegador:",
        error,
      );
    }
  }, [
    instrumentPresentationLayouts,
    presentationLayoutSettingsSnapshot,
    presentationLayoutStorageKey,
  ]);

  useEffect(() => {
    if (!presentationLayoutModeStorageKey || typeof window === "undefined") {
      return;
    }
    if (skipNextModePersistRef.current) {
      skipNextModePersistRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(
        presentationLayoutModeStorageKey,
        isExpandedCifra ? "expanded" : "default",
      );
    } catch (error) {
      console.error("Erro ao persistir modo da presentation:", error);
    }
  }, [isExpandedCifra, presentationLayoutModeStorageKey]);

  // Função para alternar a visibilidade das tabs
  const toggleTabsVisibility = () => {
    setHideTabs(!hideTabs);
  };

  const enterLiveMode = async () => {
    const rootNode = liveModeRootRef.current;
    if (!rootNode) return;

    if (isTouchLayout) {
      if (typeof rootNode.requestFullscreen === "function") {
        try {
          await rootNode.requestFullscreen();
          setIsLiveMode(true);
          setIsPseudoLiveMode(false);
          focusLiveViewport();
          return;
        } catch (error) {
          console.warn("Fallback para pseudo LIVE mode:", error);
        }
      }

      setIsPseudoLiveMode(true);
      focusLiveViewport();
      return;
    }

    try {
      await rootNode.requestFullscreen();
      setIsLiveMode(true);
      focusLiveViewport();
    } catch (error) {
      console.error("Não foi possível entrar no modo LIVE:", error);
      pushSnackbarMessage(
        "Erro",
        "Não foi possível abrir o modo LIVE em tela cheia.",
      );
    }
  };

  const exitLiveMode = async () => {
    if (
      document.fullscreenElement &&
      typeof document.exitFullscreen === "function"
    ) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Não foi possível sair do modo LIVE:", error);
      }
    }

    setIsPseudoLiveMode(false);
    setIsLiveMode(false);
  };

  const closeTouchVideo = useCallback(() => {
    setTouchVideoLink("");
    setIsTouchVideoActive(false);
    setIsVideoModalOpen(false);
    setIsTouchVideoMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleForcedCleanup = async () => {
      clearTooltipHideTimeout();
      setActiveChordTooltip(null);
      setIsPseudoLiveMode(false);
      setIsLiveMode(false);
      closeTouchVideo();

      if (
        document.fullscreenElement &&
        typeof document.exitFullscreen === "function"
      ) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.warn("Failed to exit fullscreen during presentation cleanup:", error);
        }
      }
    };

    window.addEventListener("presentation-force-cleanup", handleForcedCleanup);
    return () => {
      window.removeEventListener(
        "presentation-force-cleanup",
        handleForcedCleanup,
      );
    };
  }, [clearTooltipHideTimeout, closeTouchVideo]);

  const instrumentNotes = currentInstrumentData?.notes || "";

  const handleInstrumentNotesChange = useCallback(
    (plainText) => {
      setSongDataFetched((prev) => {
        if (!prev || !instrumentSelected) return prev;
        return {
          ...prev,
          [instrumentSelected]: {
            ...(prev[instrumentSelected] || {}),
            notes: String(plainText || ""),
          },
        };
      });
    },
    [instrumentSelected],
  );

  const handleSaveInstrumentNotes = useCallback(
    async (plainText) => {
      if (!artistFromURL || !songFromURL || !instrumentSelected) {
        pushSnackbarMessage("Erro", "Sem dados da música para salvar notas.");
        return;
      }

      try {
        setIsSavingNotes(true);
        const result = await updateInstrumentNotes({
          artist: artistFromURL,
          song: songFromURL,
          instrument: instrumentSelected,
          notes: plainText,
        });
        if (result?.song) {
          setSongDataFetched((prev) => {
            if (!prev || !instrumentSelected) return result.song;

            const previousInstrument = prev[instrumentSelected] || {};
            const nextInstrument = result.song?.[instrumentSelected] || {};

            return {
              ...prev,
              ...result.song,
              [instrumentSelected]: {
                ...nextInstrument,
                presentationLayouts:
                  nextInstrument.presentationLayouts ||
                  previousInstrument.presentationLayouts,
                songCifra:
                  nextInstrument.songCifra || previousInstrument.songCifra,
              },
            };
          });
        } else {
          handleInstrumentNotesChange(plainText);
        }
        pushSnackbarMessage("Salvo", "Notas salvas com sucesso.");
      } catch (error) {
        console.error("Erro ao salvar notas:", error);
        pushSnackbarMessage("Erro", "Não foi possível salvar as notas.");
      } finally {
        setIsSavingNotes(false);
      }
    },
    [
      artistFromURL,
      handleInstrumentNotesChange,
      instrumentSelected,
      pushSnackbarMessage,
      songFromURL,
    ],
  );

  const openInstrumentNotesWindow = useCallback(() => {
    setNotesModalStatus(true);
    pushSnackbarMessage("Notes", "Notas abertas para este instrumento.");
  }, [pushSnackbarMessage]);

  const toggleMarksEditor = useCallback(() => {
    setMarksEditorOpen((current) => !current);
  }, []);

  const toggleMarksVisibility = useCallback(() => {
    setActiveShowProgressionMarkers((current) => !current);
  }, [setActiveShowProgressionMarkers]);

  const handleChangeMarkTitle = useCallback((blockKey, title) => {
    updateActivePresentationLayout((currentLayout) => ({
      ...currentLayout,
      progressionMarkOverrides: {
        ...(currentLayout.progressionMarkOverrides || {}),
        [blockKey]: {
          ...(currentLayout.progressionMarkOverrides?.[blockKey] || {}),
          title,
        },
      },
    }));
  }, [updateActivePresentationLayout]);

  const handleChangeMarkPosition = useCallback((blockKey, position) => {
    updateActivePresentationLayout((currentLayout) => ({
      ...currentLayout,
      progressionMarkOverrides: {
        ...(currentLayout.progressionMarkOverrides || {}),
        [blockKey]: {
          ...(currentLayout.progressionMarkOverrides?.[blockKey] || {}),
          position,
        },
      },
    }));
  }, [updateActivePresentationLayout]);

  const handleChangeMarkWidth = useCallback((blockKeys, width) => {
    const normalizedWidth = Math.max(260, Math.min(1200, Math.round(width)));

    updateActivePresentationLayout((currentLayout) => {
      const currentOverrides = currentLayout.progressionMarkOverrides || {};
      const nextOverrides = { ...currentOverrides };

      blockKeys.forEach((blockKey) => {
        nextOverrides[blockKey] = {
          ...(currentOverrides[blockKey] || {}),
          width: normalizedWidth,
        };
      });

      return {
        ...currentLayout,
        progressionMarkOverrides: nextOverrides,
      };
    });
  }, [updateActivePresentationLayout]);

  const handleChangeMarkHeight = useCallback((blockKeys, height) => {
    const normalizedHeight = Math.max(80, Math.min(1400, Math.round(height)));

    updateActivePresentationLayout((currentLayout) => {
      const currentOverrides = currentLayout.progressionMarkOverrides || {};
      const nextOverrides = { ...currentOverrides };

      blockKeys.forEach((blockKey) => {
        nextOverrides[blockKey] = {
          ...(currentOverrides[blockKey] || {}),
          height: normalizedHeight,
        };
      });

      return {
        ...currentLayout,
        progressionMarkOverrides: nextOverrides,
      };
    });
  }, [updateActivePresentationLayout]);

  const handleStartProgressionResize = useCallback((event, group) => {
    if (!group?.blockKeys?.length) return;

    event.preventDefault();
    event.stopPropagation();

    const blockNode = event.currentTarget.closest(".presentation-render-block");
    const startX = event.clientX;
    const startY = event.clientY;
    const blockRect = blockNode?.getBoundingClientRect();
    const startWidth = blockRect?.width || group.width || 620;
    const startHeight = blockRect?.height || group.height || 180;
    const axis = event.currentTarget.dataset.resizeAxis || "width";
    const resizingKey = group.baseGroupKey || group.groupKey;

    const handleMouseMove = (moveEvent) => {
      const nextWidth = Math.max(
        260,
        Math.min(1200, startWidth + moveEvent.clientX - startX),
      );
      const nextHeight = Math.max(
        80,
        Math.min(1400, startHeight + moveEvent.clientY - startY),
      );

      setResizingProgressionWidths((current) => ({
        ...current,
        [resizingKey]:
          axis === "height"
            ? { ...(current[resizingKey] || {}), height: nextHeight }
            : { ...(current[resizingKey] || {}), width: nextWidth },
      }));
    };

    const handleMouseUp = (upEvent) => {
      const nextWidth = Math.max(
        260,
        Math.min(1200, startWidth + upEvent.clientX - startX),
      );
      const nextHeight = Math.max(
        80,
        Math.min(1400, startHeight + upEvent.clientY - startY),
      );

      if (axis === "height") {
        handleChangeMarkHeight(group.blockKeys, nextHeight);
      } else {
        handleChangeMarkWidth(group.blockKeys, nextWidth);
      }
      setResizingProgressionWidths((current) => {
        const next = { ...current };
        delete next[resizingKey];
        return next;
      });
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [handleChangeMarkHeight, handleChangeMarkWidth]);

  const handleDropProgressionGroup = useCallback((targetGroupKey) => {
    const draggedGroupKey = draggedProgressionGroupKeyRef.current;
    draggedProgressionGroupKeyRef.current = "";

    if (!draggedGroupKey || draggedGroupKey === targetGroupKey) return;

    const orderedGroups = progressionRenderGroups.filter(
      (group) => group.isProgressionEligible,
    );
    const draggedGroup = orderedGroups.find(
      (group) => group.groupKey === draggedGroupKey,
    );
    const targetIndex = orderedGroups.findIndex(
      (group) => group.groupKey === targetGroupKey,
    );

    if (!draggedGroup || targetIndex < 0) return;

    const withoutDragged = orderedGroups.filter(
      (group) => group.groupKey !== draggedGroupKey,
    );
    withoutDragged.splice(targetIndex, 0, draggedGroup);

    updateActivePresentationLayout((currentLayout) => {
      const currentOverrides = currentLayout.progressionMarkOverrides || {};
      const nextOverrides = { ...currentOverrides };

      withoutDragged.forEach((group, groupIndex) => {
        group.blockKeys.forEach((blockKey) => {
          nextOverrides[blockKey] = {
            ...(currentOverrides[blockKey] || {}),
            position: groupIndex + 1,
          };
        });
      });

      return {
        ...currentLayout,
        progressionMarkOverrides: nextOverrides,
      };
    });
  }, [progressionRenderGroups, updateActivePresentationLayout]);

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
          marksEditorOpen={marksEditorOpen}
          onToggleMarksEditor={toggleMarksEditor}
          onToggleMarksVisibility={toggleMarksVisibility}
          markEntries={markEntries}
          onChangeMarkTitle={handleChangeMarkTitle}
          onChangeMarkPosition={handleChangeMarkPosition}
          progressionBadgeSide={progressionBadgeSide}
          transposeSteps={transposeSteps}
          setTransposeSteps={setTransposeSteps}
          displayKey={displayKey}
          showProgressionMarkers={showProgressionMarkers}
          isTouchLayout={isTouchLayout}
          touchFontSizeLabel={touchFontSizeLabel}
          decreaseTouchFontSize={() => adjustActiveFontSizeStep(-1)}
          increaseTouchFontSize={() => adjustActiveFontSizeStep(1)}
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
          onChangeProgressionBadgeSide={toggleActiveProgressionBadgeSide}
        />
      )}
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
          {!effectiveLiveMode && (
            <div
              className={`my-5 flex shrink-0 justify-between neuphormism-b ${
                isTouchLayout
                  ? "items-stretch gap-3 px-4 py-3"
                  : "flex-row items-end p-4"
              }`}
            >
              <div
                className={`flex min-w-0 flex-1 flex-col ${
                  isTouchLayout ? "pr-1" : ""
                }`}
              >
                {isTouchLayout && isTouchVideoActive ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[goldenrod]">
                          Video Active
                        </div>
                        <div className="truncate text-[1rem] font-bold leading-[1.15rem] text-black/70">
                          {songFromURL} • {artistFromURL}
                        </div>
                      </div>
                    </div>
                    <ToolBoxYT
                      linktoplay={touchVideoLink}
                      setVideoModalStatus={setIsTouchVideoActive}
                      setLinktoplay={setTouchVideoLink}
                      isTouchLayout
                      onVideoModalChange={setIsVideoModalOpen}
                      renderInline
                      iframeHeight={208}
                    />
                  </div>
                ) : (
                  <>
                    <h1
                      className={`font-bold text-black ${
                        isTouchLayout
                          ? `${getMobileTitleSizeClass(songFromURL, "song")} truncate`
                          : "text-4xl"
                      }`}
                      title={songFromURL}
                    >
                      {songFromURL}
                    </h1>
                    <h1
                      className={`font-bold text-black ${
                        isTouchLayout
                          ? `${getMobileTitleSizeClass(artistFromURL, "artist")} truncate`
                          : "text-4xl"
                      }`}
                      title={artistFromURL}
                    >
                      {artistFromURL}
                    </h1>
                  </>
                )}
                {isTouchLayout ? (
                  <div className="mt-8 flex items-stretch gap-1.5 opacity-80">
                    <button
                      type="button"
                      disabled={!previousSetlistSong}
                      className="neuphormism-b-btn px-3 py-1.5 text-[11px] font-black text-black disabled:cursor-not-allowed disabled:opacity-35"
                      onClick={() => goToSetlistSong(previousSetlistSong)}
                      aria-label="Previous song in selected setlist"
                    >
                      &lt;&lt;
                    </button>
                    <button
                      type="button"
                      disabled={!nextSetlistSong}
                      className="neuphormism-b-btn px-3 py-1.5 text-[11px] font-black text-black disabled:cursor-not-allowed disabled:opacity-35"
                      onClick={() => goToSetlistSong(nextSetlistSong)}
                      aria-label="Next song in selected setlist"
                    >
                      &gt;&gt;
                    </button>
                  </div>
                ) : null}
              </div>
              <div
                className={`flex flex-col ${
                  isTouchLayout
                    ? "shrink-0 items-stretch justify-start gap-2"
                    : "items-stretch gap-2"
                }`}
              >
                <div
                  className={
                    isTouchLayout
                      ? "flex h-full flex-col items-stretch justify-between gap-3"
                      : "flex flex-col gap-2"
                  }
                >
                  <div
                    className={
                      isTouchLayout
                        ? "hidden"
                        : "order-2 grid grid-cols-2 gap-1.5 opacity-80"
                    }
                  >
                  <button
                    type="button"
                    disabled={!previousSetlistSong}
                    className={`neuphormism-b-btn font-black text-black disabled:cursor-not-allowed disabled:opacity-35 ${
                      isTouchLayout
                        ? "px-2 py-1 text-[11px]"
                        : "px-3 py-1.5 text-xs"
                    }`}
                    onClick={() => goToSetlistSong(previousSetlistSong)}
                    aria-label="Previous song in selected setlist"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    type="button"
                    disabled={!nextSetlistSong}
                    className={`neuphormism-b-btn font-black text-black disabled:cursor-not-allowed disabled:opacity-35 ${
                      isTouchLayout
                        ? "px-2 py-1 text-[11px]"
                        : "px-3 py-1.5 text-xs"
                    }`}
                    onClick={() => goToSetlistSong(nextSetlistSong)}
                    aria-label="Next song in selected setlist"
                  >
                    &gt;&gt;
                  </button>
                  </div>
                  <div
                    className={
                      isTouchLayout
                        ? "flex shrink-0 flex-col items-stretch justify-end gap-2"
                        : "order-1 flex flex-col items-stretch gap-2"
                    }
                  >
                    {!isTouchLayout ? (
                      <div className="w-full text-center text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
                        {activeLayoutLabel}
                      </div>
                    ) : null}
                    <div
                      className={
                        isTouchLayout
                          ? "flex shrink-0 flex-col items-stretch justify-end gap-2"
                          : "flex flex-row items-stretch gap-3"
                      }
                    >
                      <button
                        type="button"
                        className={`flex items-center justify-center gap-2 neuphormism-b-btn font-black text-black ${
                          toolBoxBtnStatus ||
                          isEditing ||
                          (isTouchLayout &&
                            !toolBoxBtnStatus &&
                            (isVideoModalOpen || isTouchVideoActive))
                            ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite]"
                            : ""
                        } ${isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"}`}
                        onClick={() => {
                          if (isTouchLayout && isTouchVideoActive) {
                            setIsTouchVideoMenuOpen(true);
                            return;
                          }
                          toolBoxBtnStatusChange(
                            toolBoxBtnStatus,
                            setToolBoxBtnStatus,
                          );
                        }}
                        aria-label="Options"
                        title="Open presentation options"
                      >
                        <FaGear
                          className={isTouchLayout ? "h-4 w-4" : "h-6 w-6"}
                        />
                        <span className="sr-only">Options</span>
                      </button>
                      <button
                        type="button"
                        className={`flex items-center justify-center gap-2 font-black ${
                          isExpandedCifra
                            ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
                            : "neuphormism-b-btn text-black"
                        } ${isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"}`}
                        onClick={() => setIsExpandedCifra((value) => !value)}
                        aria-label={
                          isExpandedCifra
                            ? "Disable expanded layout"
                            : "Enable expanded layout"
                        }
                        title={
                          isExpandedCifra
                            ? "Disable expanded layout"
                            : "Enable expanded layout"
                        }
                      >
                        {isExpandedCifra ? (
                          <FaDownLeftAndUpRightToCenter
                            className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"}
                          />
                        ) : (
                          <FaUpRightAndDownLeftFromCenter
                            className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"}
                          />
                        )}
                        <span className="sr-only">Expanded layout</span>
                      </button>
                      <button
                        type="button"
                        className={`flex items-center justify-center gap-2 neuphormism-b-btn font-black text-black ${
                          isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"
                        }`}
                        onClick={goToEditSong}
                        aria-label="Edit song"
                        title="Open this song in the editor"
                      >
                        <FaPenToSquare
                          className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"}
                        />
                        <span className="sr-only">Edit Song</span>
                      </button>
                      {instrumentSelected !== "voice" ? (
                        <button
                          type="button"
                          className={`flex items-center justify-center gap-2 neuphormism-b-btn font-black ${
                            canOpenGuitarPro
                              ? "text-black"
                              : "cursor-not-allowed text-gray-400 opacity-60"
                          } ${isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"}`}
                          onClick={openGuitarProViewer}
                          disabled={!canOpenGuitarPro}
                          aria-label="Open Guitar Pro viewer"
                          title={
                            canOpenGuitarPro
                              ? "Open Guitar Pro viewer"
                              : "No Guitar Pro file available"
                          }
                        >
                          <GuitarProIcon active={canOpenGuitarPro} />
                          <span className="sr-only">Guitar Pro</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`neuphormism-b-btn-gold flex items-center justify-center font-black text-black ${
                          isTouchLayout
                            ? "h-10 w-16 px-3 text-xs tracking-[0.08em]"
                            : "min-w-[6.5rem] px-6 py-3 text-base"
                        }`}
                        onClick={enterLiveMode}
                      >
                        LIVE
                      </button>
                    </div>
                  </div>
                </div>
                {isTouchLayout ? (
                  <style>{`
                    @keyframes mobile-gear-blink {
                      0%, 100% {
                        background: #efefef;
                        color: #111;
                        box-shadow: 0 8px 18px rgba(0,0,0,0.08);
                      }
                      50% {
                        background: goldenrod;
                        color: #111;
                        box-shadow: 0 10px 20px rgba(218,165,32,0.34);
                      }
                    }
                  `}</style>
                ) : null}
              </div>
            </div>
          )}
          {effectiveLiveMode ? (
            <div
              className={
                isTouchLayout ? "px-3 pb-1 pt-2" : "px-8 pb-2 pt-6"
              }
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-black pb-3">
                <div className="min-w-0">
                  {isTouchLayout ? (
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[goldenrod]">
                      # sustenido live
                    </div>
                  ) : null}
                  <div
                    className={
                      isTouchLayout
                        ? "mt-1 text-[1.02rem] font-black leading-[1.05rem] text-white"
                        : "truncate text-3xl font-bold leading-tight text-white"
                    }
                  >
                    {songFromURL}
                  </div>
                  <div
                    className={
                      isTouchLayout
                        ? "mt-0.5 text-[0.82rem] font-bold leading-[0.92rem] text-white/80"
                        : "truncate text-xl font-bold leading-tight text-white/80"
                    }
                  >
                    {artistFromURL}
                  </div>
                </div>
                <button
                  type="button"
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/8 font-black uppercase tracking-[0.1em] text-white ${
                    isTouchLayout
                      ? "px-2.5 py-1.5 text-[10px]"
                      : "px-4 py-2 text-xs"
                  }`}
                  onClick={exitLiveMode}
                >
                  <IoClose
                    className={isTouchLayout ? "h-3.5 w-3.5" : "h-4 w-4"}
                  />
                  Close
                </button>
              </div>
            </div>
          ) : null}
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          {isTouchLayout && isTouchVideoActive && isTouchVideoMenuOpen ? (
            <div className="fixed inset-0 z-[120] bg-black/30">
              <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={() => setIsTouchVideoMenuOpen(false)}
                aria-label="Close video options"
              />
              <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[1.4rem] font-black tracking-tight text-black">
                    Video
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                    onClick={() => setIsTouchVideoMenuOpen(false)}
                    aria-label="Close video options"
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="w-full rounded-[16px] bg-white px-4 py-4 text-left text-base font-black text-black shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                  onClick={closeTouchVideo}
                >
                  Close video
                </button>
              </div>
            </div>
          ) : null}

          {!effectiveLiveMode && shouldUseHorizontalColumnFlow ? (
            <div className="presentation-horizontal-nav-dock">
              <DraggableComponent
                handle=".drag-handle"
                defaultPosition={{ x: 0, y: 0 }}
              >
                <div className="presentation-horizontal-nav-group neuphormism-b">
                  <div className="presentation-horizontal-nav-buttons">
                    <button
                      type="button"
                      className="presentation-horizontal-nav neuphormism-b-btn font-black text-black"
                      onClick={() => scrollExpandedLayout(-1)}
                      aria-label="Navigate left through expanded cifra"
                    >
                      &lt;&lt;
                    </button>
                    <button
                      type="button"
                      className="presentation-horizontal-nav neuphormism-b-btn font-black text-black"
                      onClick={() => scrollExpandedLayout(1)}
                      aria-label="Navigate right through expanded cifra"
                    >
                      &gt;&gt;
                    </button>
                  </div>
                  <div className="drag-handle presentation-horizontal-drag-handle">
                    Click and hold to drag
                  </div>
                </div>
              </DraggableComponent>
            </div>
          ) : null}

          <div
            ref={presentationContentRef}
            tabIndex={effectiveLiveMode ? 0 : -1}
            className={`min-h-0 flex-1 ${
              effectiveLiveMode
                ? "presentation-live-content"
                : `presentation-scroll-content neuphormism-b overflow-y-auto ${isTouchLayout ? "p-4" : "p-5"}`
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
              "--touch-presentation-font-scale": String(
                presentationFontScale,
              ),
              fontSize: isTouchLayout
                ? `${touchFontSizeRem}rem`
                : `${presentationFontScale}rem`,
              lineHeight: 1.45,
            }}
          >
            {isRouteSongLoading ? (
              <div
                className={`flex min-h-[18rem] flex-col items-center justify-center px-4 text-center ${
                  effectiveLiveMode ? "text-white" : "text-black"
                }`}
              >
                <div
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    effectiveLiveMode ? "text-[goldenrod]" : "text-[#a27b13]"
                  }`}
                >
                  Loading song
                </div>
                <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                  {songFromURL || "Loading..."}
                </h2>
                <p
                  className={`mt-2 text-sm font-bold ${
                    effectiveLiveMode ? "text-white/70" : "text-black/60"
                  }`}
                >
                  {artistFromURL || "Preparing presentation"}
                </p>
              </div>
            ) : isCurrentInstrumentUnavailable ? (
              <div
                className={`flex min-h-[18rem] flex-col items-center justify-center px-4 text-center ${
                  effectiveLiveMode ? "text-white" : "text-black"
                }`}
              >
                <div className="max-w-xl">
                  <div
                    className={`text-xs font-black uppercase tracking-[0.18em] ${
                      effectiveLiveMode ? "text-[goldenrod]" : "text-[#a27b13]"
                    }`}
                  >
                    Instrumento indisponível
                  </div>
                  <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                    Esta música ainda não tem cifra para {instrumentSelected}.
                  </h2>
                  <p
                    className={`mt-3 text-sm font-bold sm:text-base ${
                      effectiveLiveMode ? "text-white/70" : "text-black/60"
                    }`}
                  >
                    Abra um dos instrumentos cadastrados com cifra para esta
                    música.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {availableInstrumentOptions.length ? (
                      availableInstrumentOptions.map((instrument) => (
                        <button
                          key={instrument.key}
                          type="button"
                          className="neuphormism-b-btn-gold px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black"
                          onClick={() => goToInstrument(instrument.key)}
                        >
                          {instrument.label}
                        </button>
                      ))
                    ) : (
                      <div
                        className={`text-sm font-bold ${
                          effectiveLiveMode ? "text-white/60" : "text-black/50"
                        }`}
                      >
                        Nenhum instrumento cadastrado com cifra foi encontrado
                        para esta música.
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                contentEditable={isEditing}
                suppressContentEditableWarning
                onInput={isEditing ? handlePresentationContentInput : undefined}
              >
                {activeProgressionRenderColumns.map(
                  (
                    {
                      groupKey,
                      baseGroupKey,
                      blockKeys,
                      blocks,
                      isProgressionEligible,
                      displayPosition,
                      displayTitle,
                      width,
                      height,
                      isOverflowContinuation,
                      visualColumnIndex,
                      visualColumnLabel,
                    },
                    visibleIndex,
                    visibleGroups,
                  ) => {
                    const numericDisplayPosition =
                      Number.parseInt(visualColumnIndex, 10) ||
                      Number.parseInt(displayPosition, 10) ||
                      visibleIndex + 1;
                    const progressionColor =
                      isProgressionEligible
                        ? PROGRESSION_MARKER_COLORS[
                            ((numericDisplayPosition -
                              1) %
                              PROGRESSION_MARKER_COLORS.length)
                          ]
                        : undefined;
                    const resizingDimensions =
                      resizingProgressionWidths[baseGroupKey || groupKey] || {};
                    const displayWidth = resizingDimensions.width ?? width;
                    const displayHeight =
                      isOverflowContinuation &&
                      shouldUseHorizontalColumnFlow
                        ? undefined
                        : resizingDimensions.height ?? height;
                    const headerLabel =
                      visualColumnLabel ||
                      getColumnLabelFromIndex(numericDisplayPosition);

                    return (
                      <div
                        key={groupKey}
                        className={`presentation-render-block ${
                          selectContenttoShow === "tabs"
                            ? "presentation-tab-filter-block"
                            : ""
                        } ${
                          showProgressionMarkers && isProgressionEligible
                            ? "presentation-progression-block"
                            : ""
                        }`}
                        draggable={isEditing && isProgressionEligible}
                        onDragStart={
                          isEditing &&
                          isProgressionEligible &&
                          !isOverflowContinuation
                            ? (event) => {
                                draggedProgressionGroupKeyRef.current =
                                  baseGroupKey || groupKey;
                                event.dataTransfer.effectAllowed = "move";
                              }
                            : undefined
                        }
                        onDragOver={
                          isEditing && isProgressionEligible
                            ? (event) => {
                                event.preventDefault();
                                event.dataTransfer.dropEffect = "move";
                              }
                            : undefined
                        }
                        onDrop={
                          isEditing &&
                          isProgressionEligible &&
                          !isOverflowContinuation
                            ? (event) => {
                                event.preventDefault();
                                handleDropProgressionGroup(
                                  baseGroupKey || groupKey,
                                );
                              }
                            : undefined
                        }
                        style={{
                          ...(!effectiveLiveMode &&
                          visibleIndex === visibleGroups.length - 1 &&
                          !shouldUseHorizontalColumnFlow
                            ? { paddingBottom: 200 }
                            : {}),
                          ...(showProgressionMarkers &&
                          isProgressionEligible &&
                          progressionColor
                            ? { "--progression-color": progressionColor }
                            : {}),
                          ...(displayWidth ? { width: `${displayWidth}px` } : {}),
                          ...(displayHeight
                            ? {
                                minHeight: `${displayHeight}px`,
                              }
                            : {}),
                        }}
                      >
                        {isEditing &&
                        showProgressionMarkers &&
                        isProgressionEligible ? (
                          <div
                            className="presentation-progression-column-header"
                            contentEditable={false}
                          >
                            {headerLabel}
                          </div>
                        ) : null}
                        {showProgressionMarkers && isProgressionEligible ? (
                          <div
                            className={`presentation-progression-badge ${
                              progressionBadgeSide === "left"
                                ? "presentation-progression-badge-left"
                                : "presentation-progression-badge-right"
                            }`}
                            contentEditable={false}
                          >
                            <span className="presentation-progression-badge-number">
                              {displayPosition}
                            </span>
                            <span className="presentation-progression-badge-title">
                              {displayTitle}
                            </span>
                          </div>
                        ) : null}
                        {isEditing &&
                        isProgressionEligible &&
                        !isOverflowContinuation ? (
                          <>
                            <button
                              type="button"
                              className="presentation-progression-drag-handle"
                              draggable
                              onDragStart={(event) => {
                                draggedProgressionGroupKeyRef.current =
                                  baseGroupKey || groupKey;
                                event.dataTransfer.effectAllowed = "move";
                              }}
                              contentEditable={false}
                              aria-label="Reorder progression block"
                            >
                              ::
                            </button>
                            <button
                              type="button"
                              className="presentation-progression-resize-handle"
                              data-resize-axis="width"
                              onMouseDown={(event) =>
                                handleStartProgressionResize(event, {
                                  groupKey,
                                  baseGroupKey,
                                  blockKeys,
                                  width,
                                  height,
                                })
                              }
                              contentEditable={false}
                              aria-label="Resize progression block"
                            >
                              ↔
                            </button>
                            <button
                              type="button"
                              className="presentation-progression-height-handle"
                              data-resize-axis="height"
                              onMouseDown={(event) =>
                                handleStartProgressionResize(event, {
                                  groupKey,
                                  baseGroupKey,
                                  blockKeys,
                                  width,
                                  height,
                                })
                              }
                              contentEditable={false}
                              aria-label="Resize progression block height"
                            >
                              ↕
                            </button>
                          </>
                        ) : null}
                        {blocks.map((entry) => (
                          <div
                            key={entry.blockKey}
                            className="presentation-render-content-block"
                            dangerouslySetInnerHTML={{ __html: entry.block }}
                          />
                        ))}
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
          {!isEditing && (
            <PresentationChordTooltip
              tooltip={activeChordTooltip}
              selectedVariationIndex={getSelectedVariationIndex(
                activeChordTooltip?.data,
              )}
              onApplyVariation={handleApplyChordVariation}
              onTooltipEnter={handleTooltipEnter}
              onTooltipLeave={handleTooltipLeave}
              onClose={handleCloseTooltip}
            />
          )}
        </div>
      </div>
      <GuitarProViewerModal
        open={guitarProViewerOpen}
        onClose={() => setGuitarProViewerOpen(false)}
        file={selectedGuitarProFile}
        songTitle={songFromURL}
        artistName={artistFromURL}
        instrumentName={instrumentSelected}
      />
    </div>
  );
}

export default Presentation;
