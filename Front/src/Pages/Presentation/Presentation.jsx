/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import { FaGear } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import ToolBox from "./ToolBox";
import {
  allDataFromOneSong,
  updateLastPlayed,
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
  const liveModeRootRef = useRef(null);
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const effectiveLiveMode = isLiveMode || isPseudoLiveMode;
  const touchFontSizeRem = useMemo(
    () => Math.max(0.58, Math.min(1.18, 0.82 + touchFontSizeStep * 0.08)),
    [touchFontSizeStep],
  );
  const presentationFontScale = touchFontSizeRem / 0.82;
  const touchFontSizeLabel = `${Math.round(presentationFontScale * 100)}%`;

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
        />
      )}
      <div
        className={`container mx-auto ${effectiveLiveMode ? "max-w-none" : ""}`}
      >
        <div
          className={`flex min-h-0 flex-col ${
            effectiveLiveMode ? "h-[100dvh]" : "h-screen"
          } ${
            effectiveLiveMode
              ? "w-full max-w-none px-0"
              : "w-11/12 2xl:w-9/12 mx-auto"
          }`}
        >
          {!effectiveLiveMode && (
            <div
              className={`my-5 flex justify-between neuphormism-b ${
                isTouchLayout ? "items-start gap-4 px-4 py-4" : "flex-row p-5"
              }`}
            >
              <div className="min-w-0 flex-1 flex-col">
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
                          ? getMobileTitleSizeClass(songFromURL, "song")
                          : "text-4xl"
                      }`}
                    >
                      {songFromURL}
                    </h1>
                    <h1
                      className={`font-bold text-black ${
                        isTouchLayout
                          ? getMobileTitleSizeClass(artistFromURL, "artist")
                          : "text-4xl"
                      }`}
                    >
                      {artistFromURL}
                    </h1>
                  </>
                )}
              </div>
              <div
                className={`flex ${
                  isTouchLayout
                    ? "flex-col items-stretch justify-start gap-2 self-start"
                    : "flex-row items-center gap-3"
                }`}
              >
                <button
                  type="button"
                  className={`neuphormism-b-btn-gold font-bold text-black ${
                    isTouchLayout
                      ? "px-4 py-3 text-sm tracking-[0.08em]"
                      : "p-6 text-lg"
                  }`}
                  onClick={enterLiveMode}
                >
                  LIVE
                </button>
                <div
                  className={`flex items-center justify-center neuphormism-b-btn ${
                    isEditing ||
                    (isTouchLayout &&
                      !toolBoxBtnStatus &&
                      (isVideoModalOpen || isTouchVideoActive))
                      ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite]"
                      : ""
                  } ${isTouchLayout ? "px-4 py-3" : "p-6"}`}
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
                >
                  <FaGear className={isTouchLayout ? "h-5 w-5" : "w-8 h-8"} />
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
          {isTouchLayout && effectiveLiveMode ? (
            <div className="px-3 pb-1 pt-2">
              <div className="flex items-start justify-between gap-3 rounded-[18px] border border-white/10 bg-black px-3 py-2 shadow-[0_12px_24px_rgba(0,0,0,0.24)]">
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[goldenrod]">
                    # sustenido live
                  </div>
                  <div className="mt-1 text-[1.02rem] font-black leading-[1.05rem] text-white">
                    {songFromURL}
                  </div>
                  <div className="mt-0.5 text-[0.82rem] font-bold leading-[0.92rem] text-white/80">
                    {artistFromURL}
                  </div>
                </div>
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white"
                  onClick={exitLiveMode}
                >
                  <IoClose className="h-3.5 w-3.5" />
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
                : `neuphormism-b overflow-y-auto ${isTouchLayout ? "p-4" : "p-5"}`
            } ${hideChords ? "hide-chords" : ""} ${
              selectContenttoShow === "tabs" ? "presentation-tabs-only" : ""
            }`}
            style={
              !effectiveLiveMode
                ? {
                    "--touch-presentation-font-scale": String(
                      presentationFontScale,
                    ),
                    fontSize: isTouchLayout
                      ? `${touchFontSizeRem}rem`
                      : `${presentationFontScale}rem`,
                    lineHeight: 1.45,
                  }
                : undefined
            }
          >
            {isEditing ? (
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
