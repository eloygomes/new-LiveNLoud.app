/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import { FaGear, FaPenToSquare } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import ToolBox from "./ToolBox";
import {
  allDataFromOneSong,
  fetchUserSongs,
  loadSelectedSetlists,
  updateLastPlayed,
  updateInstrumentNotes,
  updateSongEntry,
} from "../../Tools/Controllers";
import { useRef } from "react";
import SnackBar from "../../Tools/SnackBar";
import MobileSnackBar from "../../Tools/MobileSnackBar";
import ToolBoxYT from "./ToolBoxYT";

import { processSongCifra } from "./ProcessSongCifra";
import PresentationChordTooltip, {
  findChordTooltipData,
} from "./PresentationChordTooltip";
import {
  getRegisteredScrollController,
  registerScrollViewport,
  unregisterScrollViewport,
} from "./presentationScrollController";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ChordSheetJS from "chordsheetjs";

const escapeHtml = (value = "") =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const plainTextToHtml = (text = "") =>
  text
    .split("\n")
    .map((line) => {
      const displayLine = line.trimStart();
      if (!displayLine.length) {
        return "<p>&nbsp;</p>";
      }
      const preservedSpaces = escapeHtml(displayLine)
        .replace(/ /g, "&nbsp;")
        .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
      return `<p>${preservedSpaces}</p>`;
    })
    .join("");

const editorNonChordWords = new Set([
  "Coração",
  "Dedilhado",
  "Final",
  "Estrofes",
  "Frase",
  "Casta_nhos",
  "Escala",
  "coração",
  "dedilhado",
  "final",
  "estrofes",
  "frase",
  "casta_nhos",
  "escala",
  "Fontes",
]);

const editorChordRegexString =
  "([A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?(?:\\/[A-G](?:#|b)?(?:[a-zA-Z0-9º°+]*)(?:\\([^)]+\\))?)?)";
const editorChordValidationRegex = new RegExp(
  "^" + editorChordRegexString + "$",
);
const editorChordPattern = new RegExp(
  "(\\b|\\s|[-:])" + editorChordRegexString + "(?=\\s|$)",
  "g",
);

function isEditorChord(value) {
  return (
    !editorNonChordWords.has(value) && editorChordValidationRegex.test(value)
  );
}

const ChordHighlight = Extension.create({
  name: "chordHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations = [];

            state.doc.descendants((node, position) => {
              if (!node.isText || !node.text) return;

              editorChordPattern.lastIndex = 0;
              let match;

              while ((match = editorChordPattern.exec(node.text)) !== null) {
                const chord = match[2];
                if (!isEditorChord(chord)) continue;

                const chordStart = match.index + match[0].indexOf(chord);
                decorations.push(
                  Decoration.inline(
                    position + chordStart,
                    position + chordStart + chord.length,
                    {
                      class: "notespresentation presentation-editor-chord",
                      "data-chord": chord,
                    },
                  ),
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

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

const instrumentHasPresentationContent = (instrumentData) => {
  if (!instrumentData) return false;

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
  const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(false);
  const [artistFromURL, setArtistFromURL] = useState("");
  const [songFromURL, setSongFromURL] = useState("");
  const [songDataFetched, setSongDataFetched] = useState();
  const [instrumentSelected, setInstrumentSelected] = useState("keys");
  const [embedLinks, setEmbedLinks] = useState([]);

  const [hideTabs, setHideTabs] = useState(false); // Estado para controlar a visibilidade das tabs
  const [hideChords, setHideChords] = useState(false); // Estado para controlar a visibilidade dos acordes

  const [songCifraData, setSongCifraData] = useState("");
  const [songLyrics, setSongLyrics] = useState("");
  const [songChords, setSongChords] = useState("");
  const [songTabs, setSongTabs] = useState("");

  const [selectContenttoShow, setSelectContenttoShow] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [draftCifra, setDraftCifra] = useState("");
  const [isSavingCifra, setIsSavingCifra] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [setlistSongs, setSetlistSongs] = useState([]);
  const [touchFontSizeStep, setTouchFontSizeStep] = useState(0);
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
      try {
        if (!chordHelpers.parser || !chordHelpers.formatter) return value;
        const parsed = chordHelpers.parser.parse(value);
        return chordHelpers.formatter.format(parsed);
      } catch (error) {
        console.warn("ChordSheetJS parse/format falhou:", error);
        return value;
      }
    },
    [chordHelpers],
  );

  const normalizedSongCifra = useMemo(
    () => normalizeCifra(songCifraData),
    [songCifraData, normalizeCifra],
  );

  useEffect(() => {
    if (!isEditing) {
      setDraftCifra(normalizedSongCifra);
    }
  }, [normalizedSongCifra, isEditing]);

  // Conteúdo que deve ser mostrado de acordo com a seleção do usuário
  const contentSelected = useMemo(() => {
    const defaultContent =
      normalizedSongCifra || songChords || songTabs || songLyrics || "";

    switch (selectContenttoShow) {
      case "tabs":
        return songTabs;
      case "chords":
        return songLyrics;
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
      const instrumentData = data[instrumentSelected];
      setSongCifraData(instrumentData.songCifra || "");
      setSongLyrics(instrumentData.songLyrics || "");
      setSongChords(instrumentData.songChords || "");
      setSongTabs(instrumentData.songTabs || "");
      return data[instrumentSelected];
    } else {
      console.log("Instrumento não encontrado ou data é undefined");
      // zera pra evitar 'Loading...' cair no parser
      setSongCifraData("");
      setSongLyrics("");
      setSongChords("");
      setSongTabs("");
      return null;
    }
  };

  const currentInstrumentData = useMemo(() => {
    if (!songDataFetched || !instrumentSelected) return {};
    return songDataFetched[instrumentSelected] || {};
  }, [songDataFetched, instrumentSelected]);

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

  const goToInstrument = useCallback(
    (instrumentKey) => {
      if (!instrumentKey) return;

      window.location.href = `/presentation/${encodeURIComponent(
        artistFromURL || "",
      )}/${encodeURIComponent(songFromURL || "")}/${encodeURIComponent(
        instrumentKey,
      )}`;
    },
    [artistFromURL, songFromURL],
  );

  const goToEditSong = useCallback(() => {
    localStorage.setItem("song", songFromURL || "");
    localStorage.setItem("artist", artistFromURL || "");

    window.location.href = `/editsong/${encodeURIComponent(
      artistFromURL || "",
    )}/${encodeURIComponent(songFromURL || "")}`;
  }, [artistFromURL, songFromURL]);

  const startEditingCifra = () => {
    setSaveError("");
    setIsEditing(true);
    setDraftCifra(normalizedSongCifra);
  };

  const handleDiscardDraft = () => {
    setDraftCifra(normalizedSongCifra);
    setIsEditing(false);
    setSaveError("");
  };

  const [lastSaveTimestamp, setLastSaveTimestamp] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPseudoLiveMode, setIsPseudoLiveMode] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [touchVideoLink, setTouchVideoLink] = useState("");
  const [isTouchVideoActive, setIsTouchVideoActive] = useState(false);
  const [isTouchVideoMenuOpen, setIsTouchVideoMenuOpen] = useState(false);
  const [notesModalStatus, setNotesModalStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const liveModeRootRef = useRef(null);
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;
  const effectiveLiveMode = isLiveMode || isPseudoLiveMode;
  const touchFontSizeRem = useMemo(
    () => Math.max(0.58, Math.min(1.18, 0.82 + touchFontSizeStep * 0.08)),
    [touchFontSizeStep],
  );
  const presentationFontScale = touchFontSizeRem / 0.82;
  const touchFontSizeLabel = `${Math.round(presentationFontScale * 100)}%`;

  const currentSetlistSongIndex = useMemo(() => {
    const normalizedArtist = artistFromURL.trim().toLowerCase();
    const normalizedSong = songFromURL.trim().toLowerCase();

    if (!normalizedArtist || !normalizedSong) return -1;

    return setlistSongs.findIndex(
      (song) =>
        (song.artist || "").trim().toLowerCase() === normalizedArtist &&
        (song.song || "").trim().toLowerCase() === normalizedSong,
    );
  }, [artistFromURL, setlistSongs, songFromURL]);

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

      window.location.href = `/presentation/${encodeURIComponent(
        song.artist || "",
      )}/${encodeURIComponent(song.song || "")}/${encodeURIComponent(
        instrumentSelected,
      )}`;
    },
    [instrumentSelected],
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

    const updatedBlock = {
      ...currentInstrumentData,
      songCifra: draftCifra,
    };

    const nextSongData = {
      ...(songDataFetched || {}),
      [instrumentSelected]: updatedBlock,
      updateIn: new Date().toISOString().split("T")[0],
    };

    try {
      await updateSongEntry(nextSongData);

      setSongCifraData(draftCifra);
      setSongDataFetched((prev) => ({
        ...nextSongData,
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

  const hasDraftChanges = (normalizedSongCifra || "") !== (draftCifra || "");

  // Processar o songCifraData usando o algoritmo fornecido
  // console.log("htmlBlocks", htmlBlocks);

  // const { htmlBlocks } = processSongCifra(songCifraData);
  // const { htmlBlocks } = processSongCifra(songChords);
  // const { htmlBlocks } = processSongCifra(songLyrics);
  // const { htmlBlocks } = processSongCifra(songTabs);

  // const { htmlBlocks } = processSongCifra(contentSelected);
  const isParsableString =
    typeof contentSelected === "string" &&
    contentSelected.trim() !== "" &&
    contentSelected !== "Loading...";

  let htmlBlocks = [];
  if (isParsableString) {
    try {
      htmlBlocks = processSongCifra(contentSelected).htmlBlocks || [];
    } catch (e) {
      console.warn("processSongCifra falhou, usando fallback vazio:", e);
      htmlBlocks = [];
    }
  } else {
    htmlBlocks = []; // ainda carregando ou sem conteúdo válido
  }

  // console.log("songLyrics", songLyrics);
  // console.log("songChords", songChords);
  // console.log("songTabs", songTabs);

  // console.log("htmlBlocks", htmlBlocks);
  // console.log("htmlBlocks", typeof htmlBlocks); // objeto

  // console.log("songCifraData", songCifraData);
  // console.log("songCifraData", typeof songCifraData); // string

  // console.log("htmlBlocks", htmlBlocks);

  const didPingRef = useRef(false);

  const clearTooltipHideTimeout = useCallback(() => {
    if (tooltipHideTimeoutRef.current) {
      window.clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }
  }, []);

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
    const fetchData = async () => {
      try {
        const url = window.location.href;

        // Usando o método split() para dividir a URL pelos '/'
        const partes = url.split("/");

        // Capturando o último e o penúltimo valores
        const urlInstrument = partes[partes.length - 1];
        setInstrumentSelected(urlInstrument);

        const urlSong = partes[partes.length - 2];
        const urlSongwithSpace = decodeURIComponent(urlSong);
        setSongFromURL(urlSongwithSpace);
        localStorage.setItem("song", urlSongwithSpace);

        const urlBand = partes[partes.length - 3];
        const urlBandwithSpace = decodeURIComponent(urlBand);
        setArtistFromURL(urlBandwithSpace);
        localStorage.setItem("artist", urlBandwithSpace);

        const dataFromSong = await allDataFromOneSong(
          urlBandwithSpace,
          urlSongwithSpace,
        );
        const dataFromSongparsedResult = JSON.parse(dataFromSong);
        setSongDataFetched(dataFromSongparsedResult);
        setEmbedLinks(dataFromSongparsedResult.embedVideos);

        // Chamando a função handleDataFromAPI com os dados e o instrumento selecionado
        handleDataFromAPI(dataFromSongparsedResult, urlInstrument);
      } catch (error) {
        console.error("Error fetching song data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadSetlistNavigation = async () => {
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
  }, []);

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

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Placeholder.configure({
          placeholder: "Edite a cifra aqui...",
        }),
        ChordHighlight,
      ],
      content: plainTextToHtml(draftCifra || ""),
      editable: isEditing,
      editorProps: {
        attributes: {
          class:
            "presentation-cifra-editor min-h-[60vh] w-full whitespace-pre-wrap font-mono text-base leading-6 focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        setDraftCifra(editor.getText({ blockSeparator: "\n" }));
      },
    },
    [isEditing],
  );

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
          setSongDataFetched(result.song);
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

  return (
    <div
      ref={liveModeRootRef}
      tabIndex={effectiveLiveMode ? -1 : undefined}
      className={`flex justify-center ${
        effectiveLiveMode ? "h-[100dvh]" : "h-screen"
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
          isTouchLayout={isTouchLayout}
          touchFontSizeLabel={touchFontSizeLabel}
          decreaseTouchFontSize={() =>
            setTouchFontSizeStep((current) => Math.max(-3, current - 1))
          }
          increaseTouchFontSize={() =>
            setTouchFontSizeStep((current) => Math.min(4, current + 1))
          }
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
        />
      )}
      <div
        className={`container mx-auto h-full min-h-0 ${
          effectiveLiveMode ? "max-w-none" : ""
        }`}
      >
        <div
          className={`flex min-h-0 flex-col ${
            effectiveLiveMode ? "h-[100dvh]" : "h-full"
          } ${
            effectiveLiveMode
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
                        : "order-1 flex flex-row items-stretch gap-3"
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

          <div
            ref={presentationContentRef}
            tabIndex={effectiveLiveMode ? 0 : -1}
            className={`min-h-0 flex-1 ${
              effectiveLiveMode
                ? "presentation-live-content"
                : `presentation-scroll-content neuphormism-b overflow-y-auto ${isTouchLayout ? "p-4" : "p-5"}`
            } ${hideChords ? "hide-chords" : ""} ${
              selectContenttoShow === "tabs" ? "presentation-tabs-only" : ""
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
            {isCurrentInstrumentUnavailable ? (
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
            ) : isEditing ? (
              editor ? (
                <EditorContent editor={editor} />
              ) : (
                <p>Carregando editor...</p>
              )
            ) : (
              htmlBlocks
                .reduce((blocksToRender, block, index) => {
                  const classMatch = block.match(/class="([^"]*)"/);
                  const classes = classMatch ? classMatch[1].split(" ") : [];

                  const shouldHideTabBlock =
                    hideTabs &&
                    (classes.includes("presentation-combined-tab-chords") ||
                      classes.includes("presentation-tab") ||
                      classes.includes("presentation-tab-section"));

                  if (!shouldHideTabBlock) {
                    blocksToRender.push({ block, index });
                  }

                  return blocksToRender;
                }, [])
                .map(({ block, index }, visibleIndex, visibleBlocks) => (
                  <div
                    key={index}
                    className={
                      selectContenttoShow === "tabs"
                        ? "presentation-tab-filter-block"
                        : undefined
                    }
                    style={
                      !effectiveLiveMode &&
                      visibleIndex === visibleBlocks.length - 1
                        ? { paddingBottom: 200 }
                        : undefined
                    }
                    dangerouslySetInnerHTML={{ __html: block }}
                  />
                ))
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
    </div>
  );
}

export default Presentation;
