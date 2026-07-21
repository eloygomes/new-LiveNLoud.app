/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChrome,
  FaDownload,
  FaExternalLinkAlt,
  FaMinus,
  FaPaste,
  FaPuzzlePiece,
  FaPlus,
  FaPlay,
  FaRegFileAlt,
  FaRegStickyNote,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import {
  checkCifraExists,
  deleteGuitarProFile,
  API_BASE,
  scrapeCifra,
  uploadGuitarProFile,
  updateInstrumentNotes,
} from "../../Tools/Controllers";
import {
  setLocalStorageItemSafe,
  setLocalStorageJsonSafe,
} from "../../Tools/storageSafe";
import SongInstrumentNotes from "../SongInstrumentNotes";
import { lockPageScroll } from "../../Tools/scrollLock";
import GuitarProIcon from "../../components/GuitarPro/GuitarProIcon";
import { GUITAR_PRO_ACCEPT } from "../../constants/guitarPro";
import {
  getGuitarProFiles,
  isValidGuitarProFile,
} from "../../utils/guitarPro/validateGuitarProFile";
import { classifyInstrumentLink } from "../shared/instrumentLinkClassifier";
import { useLanguage } from "../../contexts/LanguageContext";

const LETRAS_AUTO_SUBMIT_EVENT = "livenloud:auto-submit-voice";
const QUICK_ADD_EXTENSION_READY_EVENT = "livenloud:quick-add-extension-ready";
const QUICK_ADD_EXTENSION_DOWNLOAD_URL = `${API_BASE}/downloads/sustenido-quick-add.zip`;

export function canonicalizeSourceUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      host === "ultimate-guitar.com" ||
      host.endsWith(".ultimate-guitar.com")
    ) {
      url.protocol = "https:";
      url.hostname = "tabs.ultimate-guitar.com";
      url.port = "";
      return url.toString();
    }
  } catch {
    return value;
  }
  return value;
}

export function ChromeExtensionInfoModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[130] bg-black/40 px-3">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label="Close Chrome Extension information"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="chrome-extension-title"
        className="absolute left-1/2 top-1/2 max-h-[84dvh] w-[min(calc(100%_-_1.5rem),440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] bg-[#f2f2f2] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[goldenrod]">
              Quick Add
            </p>
            <h2
              id="chrome-extension-title"
              className="mt-1.5 text-[1.4rem] font-black leading-none tracking-tight text-black"
            >
              Chrome Extension
            </h2>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-[12px] text-black shadow-[0_5px_14px_rgba(0,0,0,0.07)]"
            onClick={onClose}
            aria-label="Close Chrome Extension information"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-3 rounded-[15px] border border-black/5 bg-white/65 p-3 shadow-[0_5px_14px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[goldenrod]/15 text-[12px] text-[goldenrod]">
              <FaPuzzlePiece aria-hidden="true" />
            </span>
            <p className="text-[12px] font-black leading-4 text-gray-800">
              Save the song open in your browser directly to Sustenido.
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
            {["Choose instruments", "Set details", "Add instantly"].map(
              (step, index) => (
                <div
                  key={step}
                  className="rounded-[10px] bg-black/[0.035] px-1.5 py-2"
                >
                  <span className="block text-[8px] font-black text-[goldenrod]">
                    0{index + 1}
                  </span>
                  <span className="mt-0.5 block text-[9px] font-bold leading-3 text-gray-600">
                    {step}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="mt-3 border-t border-black/5 pt-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-500">
              Supported sites
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Cifra Club", "Letras", "Ultimate Guitar"].map((site) => (
                <span
                  key={site}
                  className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-gray-700 shadow-[0_3px_9px_rgba(0,0,0,0.04)]"
                >
                  {site}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-[10px] font-medium leading-4 text-gray-500">
              Available by direct download while the Chrome Web Store version
              is being prepared.
            </p>
          </div>

          <a
            href={QUICK_ADD_EXTENSION_DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-[goldenrod] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-black shadow-[0_6px_15px_rgba(162,113,0,0.2)]"
          >
            <FaDownload className="text-[10px]" aria-hidden="true" />
            Download extension
          </a>
        </div>
      </section>
    </div>
  );
}

/** Normaliza a resposta do scrape em um doc utilizável */
function normalizeScrapeDoc(scraped, instrumentName) {
  if (!scraped) return null;

  const pythonSongData = scraped?.songData || scraped?.python?.songData || null;
  if (pythonSongData?.artist_name && pythonSongData?.song_title) {
    return {
      doc: null,
      inst: null,
      link: pythonSongData?.source_url || "",
      songCifra: pythonSongData?.song_cifra || "",
      capo: pythonSongData?.capo || "",
      tuning: pythonSongData?.tuning || "",
      artist: pythonSongData.artist_name,
      song: pythonSongData.song_title,
      tom: pythonSongData?.tom || pythonSongData?.key || "",
    };
  }

  const candidates = [
    scraped?.document,
    scraped?.data,
    scraped?.result,
    scraped?.music,
    scraped?.payload,
    scraped?.item,
    scraped,
  ].filter(Boolean);

  let doc = candidates.find((c) => c?.artist && c?.song) || null;
  if (!doc) {
    const nest = candidates.find(
      (c) =>
        typeof c === "object" &&
        Object.values(c).some((v) => v?.artist && v?.song)
    );
    if (nest && !nest.artist && !nest.song) {
      const first = Object.values(nest).find((v) => v?.artist && v?.song);
      if (first) doc = first;
    }
  }
  if (!doc) return null;

  const inst = doc?.[instrumentName] || null;
  return {
    doc,
    inst,
    link: inst?.link ?? doc?.link ?? "",
    songCifra: inst?.songCifra ?? doc?.songCifra ?? "",
    capo: inst?.capo ?? doc?.capo ?? "",
    tuning: inst?.tuning ?? doc?.tuning ?? "",
    tom: doc?.tom ?? doc?.tone ?? doc?.key ?? "",
    artist: doc.artist,
    song: doc.song,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Extrai as últimas duas partes do path da URL (ex.: .../pink-floyd/brain-damage/) */
function parseArtistSongFromUrl(raw) {
  try {
    const u = new URL(raw);
    const parts = u.pathname.split("/").filter(Boolean);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (
      host === "ultimate-guitar.com" ||
      host.endsWith(".ultimate-guitar.com")
    ) {
      const artist = parts[1] || "";
      const song = (parts[2] || "")
        .replace(/-(chords|tabs|tab|bass|ukulele|drums|pro|official)-\d+$/i, "")
        .replace(/\/+$/g, "");
      return { artist, song };
    }

    if (host === "letras.mus.br" || host === "letras.com") {
      const artist = parts[0] || "";
      const song = /^\d+$/.test(parts[1] || "") ? "" : parts[1] || "";
      return { artist, song };
    }

    if (host === "cifraclub.com.br") {
      const artist = parts[0] || "";
      const song = parts[1] || "";
      return { artist, song };
    }

    const artist = parts.at(-2) || "";
    const song = (parts.at(-1) || "").replace(/\/+$/g, "");
    return { artist, song };
  } catch {
    const parts = String(raw).split("/").filter(Boolean);
    const artist = parts.at(-2) || "";
    const song = (parts.at(-1) || "").replace(/\/+$/g, "");
    return { artist, song };
  }
}

function getLinkHost(raw) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isLetrasLink(raw) {
  const host = getLinkHost(raw);
  return host === "letras.mus.br" || host === "letras.com";
}

function isVoiceLyricsLink(raw) {
  return isLetrasLink(raw) || classifyInstrumentLink(raw) === "voice";
}

function NewSongInputLinkBox({
  instrumentName,
  instrument,
  setInstrument,
  setVoiceInstrument,
  progress,
  setProgress,
  artistName,
  setArtistName,
  songName,
  setSongName,
  gettingSongData,
  setShowSnackBar,
  setSnackbarMessage,
  setSongScrapado,
  setArtistScrapado,
  setCifraExiste,
  setCifraFROMDB,
  setScrapeStatus,
  onLinkAdded,
  notes = "",
  onNotesChange,
  touchLayout = false,
  songData = null,
  onSongDataChange,
  onResolvedInstrumentLink,
  modalLayout = false,
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false); // mantemos, mas NÃO bloqueia inputs
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(() =>
    Boolean(window.__LIVENLOUD_QUICK_ADD_EXTENSION__?.installed),
  );
  const [extensionInfoOpen, setExtensionInfoOpen] = useState(false);
  const inFlightRef = useRef(false);
  const blurTimer = useRef(null);
  const isLocked = Boolean(instrument?.trim());
  const hasLink = Boolean(instrument?.trim());
  const guitarProFiles = getGuitarProFiles(songData);
  const hasGuitarProFiles = guitarProFiles.length > 0;
  const shouldShowGuitarProRow = false;
  const expandedControls = touchLayout || modalLayout;
  const iconButtonClass =
    "neuphormism-b-btn flex h-9 w-9 items-center justify-center rounded-[10px] text-sm text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60 md:h-10 md:w-10 md:rounded-[12px]";

  const buildUserErrorMessage = useCallback((error) => {
    const responseMessage =
      error?.response?.data?.details ||
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage.trim();
    }

    return "Não foi possível adicionar o link, tente mais tarde.";
  }, []);

  const notify = (title, message) => {
    setShowSnackBar?.(true);
    setSnackbarMessage?.({ title, message });
  };

  const updateScrapeStatus = useCallback(
    (status) => {
      setScrapeStatus?.(instrumentName, status);
    },
    [instrumentName, setScrapeStatus]
  );

  const openInstrumentLink = () => {
    const targetLink = (instrument || "").trim();
    if (!targetLink) return;

    const href = /^https?:\/\//i.test(targetLink)
      ? targetLink
      : `https://${targetLink}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const openPresentation = () => {
    const artist = (artistName || localStorage.getItem("artist") || "").trim();
    const song = (songName || localStorage.getItem("song") || "").trim();

    if (!hasLink || !artist || !song) {
      notify("Error", "Adicione um link antes de abrir a apresentação.");
      return;
    }

    window.location.href = `/presentation/${encodeURIComponent(
      artist,
    )}/${encodeURIComponent(song)}/${encodeURIComponent(instrumentName)}`;
  };

  const pasteLinkFromClipboard = async () => {
    if (!navigator?.clipboard?.readText) {
      notify("Error", "Clipboard não disponível neste navegador.");
      return;
    }

    try {
      const clipboardText = (await navigator.clipboard.readText()).trim();
      if (!clipboardText) {
        notify("Info", "Clipboard vazio.");
        return;
      }
      routeIncomingLink(clipboardText);
    } catch (error) {
      console.error("Clipboard read failed:", error);
      notify("Error", "Não foi possível ler o clipboard.");
    }
  };

  const openNotes = () => {
    if (!hasLink) {
      notify("Error", "Adicione um link antes de escrever notas.");
      return;
    }
    setNotesOpen(true);
  };

  const openGuitarProFile = () => {
    const selectedFile = guitarProFiles[0];
    if (!selectedFile) {
      notify("Error", "Nenhum arquivo Guitar Pro cadastrado.");
      return;
    }
    if (selectedFile.url) {
      window.open(selectedFile.url, "_blank", "noopener,noreferrer");
      return;
    }
    notify("Info", selectedFile.originalName || "Guitar Pro file registered.");
  };

  const updateSongGuitarProState = useCallback(
    (nextFiles) => {
      onSongDataChange?.({
        ...(songData || {}),
        guitarProFiles: Array.isArray(nextFiles) ? nextFiles : [],
      });
    },
    [onSongDataChange, songData]
  );

  const handleGuitarProUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isValidGuitarProFile(file)) {
      notify("Error", "Formato de arquivo não suportado.");
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    const artist = (artistName || localStorage.getItem("artist") || "").trim();
    const song = (songName || localStorage.getItem("song") || "").trim();

    if (!email || !artist || !song) {
      notify("Error", "Defina artista e música antes de enviar o arquivo.");
      return;
    }

    try {
      const response = await uploadGuitarProFile({ email, artist, song, file });
      updateSongGuitarProState(response?.guitarProFiles || []);
      notify("Success", "Arquivo Guitar Pro enviado com sucesso!");
      onLinkAdded?.();
    } catch (error) {
      console.error("Guitar Pro upload failed:", error);
      notify("Error", "Não foi possível enviar o arquivo Guitar Pro.");
    }
  };

  const handleGuitarProDelete = async () => {
    if (!guitarProFiles.length) {
      notify("Error", "Nenhum arquivo Guitar Pro para remover.");
      return;
    }

    const optionsText = guitarProFiles
      .map((file, index) => `${index + 1}. ${file.originalName}`)
      .join("\n");
    const selection = window.prompt(`Qual arquivo deseja remover?\n${optionsText}`);
    const index = Number.parseInt(selection || "", 10) - 1;
    const selectedFile = guitarProFiles[index];

    if (!selectedFile) return;
    if (!window.confirm(`Delete this Guitar Pro file?\n${selectedFile.originalName}`)) {
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    const artist = (artistName || localStorage.getItem("artist") || "").trim();
    const song = (songName || localStorage.getItem("song") || "").trim();

    try {
      const response = await deleteGuitarProFile({
        email,
        artist,
        song,
        fileId: selectedFile.id,
      });
      updateSongGuitarProState(response?.guitarProFiles || []);
      notify("Success", "Arquivo Guitar Pro removido com sucesso!");
    } catch (error) {
      console.error("Guitar Pro delete failed:", error);
      notify("Error", "Não foi possível remover o arquivo.");
    }
  };

  const saveNotes = async (
    plainText,
    { closeModal = true, notifySuccess = true } = {},
  ) => {
    const artist = (artistName || localStorage.getItem("artist") || "").trim();
    const song = (songName || localStorage.getItem("song") || "").trim();

    if (!hasLink || !artist || !song) {
      notify("Error", "Adicione um link antes de salvar notas.");
      return;
    }

    try {
      setNotesSaving(true);
      await updateInstrumentNotes({
        artist,
        song,
        instrument: instrumentName,
        notes: plainText,
      });
      onNotesChange?.(plainText);
      if (notifySuccess) {
        notify("Success", "Notas salvas com sucesso!");
      }
      if (closeModal) {
        setNotesOpen(false);
      }
    } catch (error) {
      console.error("Error updating instrument notes:", error);
      notify("Error", "Não foi possível salvar as notas.");
    } finally {
      setNotesSaving(false);
    }
  };

  const guard = (cond, title, message) => {
    if (!cond) {
      notify(title, message);
      return true;
    }
    return false;
  };

  /** Salva artist/song no localStorage e nos estados a partir do link */
  const primeArtistSongFromLink = useCallback(
    (link) => {
      const { artist, song } = parseArtistSongFromUrl(link);
      if (artist) {
        setLocalStorageItemSafe("artist", artist);
        setArtistName?.(artist);
        setArtistScrapado?.(artist);
      }
      if (song) {
        setLocalStorageItemSafe("song", song);
        setSongName?.(song);
        setSongScrapado?.(song);
      }
      console.log("[NewSongInputLinkBox] artist/song extraídos:", {
        artist,
        song,
      });
      return { artist, song };
    },
    [setArtistName, setSongName, setArtistScrapado, setSongScrapado]
  );

  /** Fluxo principal (sem enviar nada para /api/v1/generalCifra — o Python cuida disso) */
  const handleSubmit = useCallback(
    async (linkOverride) => {
      if (inFlightRef.current) return;

      const link = canonicalizeSourceUrl(linkOverride ?? instrument ?? "");
      const detectedInstrument = classifyInstrumentLink(link);
      const effectiveInstrumentName = detectedInstrument || instrumentName;
      console.groupCollapsed(`[${effectiveInstrumentName}] SUBMIT`);
      console.log("link:", link);

      if (guard(!!link, "Error", "Insira um link válido.")) {
        console.groupEnd();
        return;
      }

      if (detectedInstrument && detectedInstrument !== instrumentName) {
        setInstrument?.("");
        onResolvedInstrumentLink?.(detectedInstrument, link);
      }

      if (isVoiceLyricsLink(link) && effectiveInstrumentName !== "voice") {
        console.warn(`[${instrumentName}] Voice lyrics link redirected to voice`, { link });
        setInstrument?.("");
        if (typeof onResolvedInstrumentLink === "function") {
          onResolvedInstrumentLink("voice", link);
        } else {
          setVoiceInstrument?.(link);
        }
        notify("Error", "Esse link deve ser usado no campo Voice");
        window.dispatchEvent(
          new CustomEvent(LETRAS_AUTO_SUBMIT_EVENT, {
            detail: { link },
          })
        );
        updateScrapeStatus(false);
        console.groupEnd();
        return;
      }

      const email = localStorage.getItem("userEmail") || "";
      if (guard(!!email, "Error", "Email do usuário é obrigatório.")) {
        console.groupEnd();
        return;
      }

      // 1) Derivar artist/song se necessário e gravar no LS
      let finalArtist = (artistName || "").trim();
      let finalSong = (songName || "").trim();
      if (!finalArtist || !finalSong) {
        const { artist, song } = primeArtistSongFromLink(link);
        finalArtist = finalArtist || artist;
        finalSong = finalSong || song;
      }

      if (guard(!!finalArtist, "Error", "Não foi possível identificar ARTIST.")) {
        console.groupEnd();
        return;
      }

      try {
        inFlightRef.current = true;
        setLoading(true);
        notify("Load", "Carregando...");

        // 2) Verifica se já existe no banco geral (para evitar scrape desnecessário)
        console.time(`[${effectiveInstrumentName}] checkCifraExists`);
        const existsRes = await checkCifraExists({
          instrumentName: effectiveInstrumentName,
          link,
          artist: finalArtist,
          song: finalSong,
        });
        console.timeEnd(`[${effectiveInstrumentName}] checkCifraExists`);

        if (existsRes?.exists) {
          console.log(`[${effectiveInstrumentName}] já existe no DB`, existsRes.data);
          setCifraExiste?.(true);
          setCifraFROMDB?.(existsRes.data);
          setLocalStorageJsonSafe("cifraFROMDB", existsRes.data);
          setLocalStorageItemSafe("fromWHERE", "DB");

          if (!artistName && existsRes.data?.artist)
            setArtistName?.(existsRes.data.artist);
          if (!songName && existsRes.data?.song)
            setSongName?.(existsRes.data.song);

          notify("Info", "Essa cifra já está na sua biblioteca.");
          updateScrapeStatus(true);
          onLinkAdded?.();
          const fresh = await gettingSongData?.();
          console.log("[gettingSongData()] (DB-hit) =>", fresh);
          console.groupEnd();
          return;
        }

        console.log(
          `[${effectiveInstrumentName}] não encontrado no DB. Fazendo scrape…`
        );

        // 3) Scrape → Python grava no user DB e manda para generalCifras internamente
        const payload = {
          artist: finalArtist,
          song: finalSong,
          email,
          instrumentName: effectiveInstrumentName,
          progress,
          link,
        };
        console.log("[scrape payload]", payload);

        console.time(`[${effectiveInstrumentName}] scrapeCifra`);
        const scrapedRaw = await scrapeCifra(payload);
        console.timeEnd(`[${effectiveInstrumentName}] scrapeCifra`);
        console.log("🔎 scrapeCifra RAW:", scrapedRaw);

        // 4) Se o backend já retornar o doc, atualiza UI; caso contrário, segue o fluxo normal
        const parsed = normalizeScrapeDoc(scrapedRaw, effectiveInstrumentName);
        console.log("✅ parsed:", parsed);
        if (parsed?.doc) {
          setCifraFROMDB?.(parsed.doc);
          setLocalStorageJsonSafe("cifraFROMDB", parsed.doc);
          setLocalStorageItemSafe("fromWHERE", "URL");
          if (parsed.artist) {
            setLocalStorageItemSafe("artist", parsed.artist);
            setArtistName?.(parsed.artist);
            setArtistScrapado?.(parsed.artist);
          }
          if (parsed.song) {
            setLocalStorageItemSafe("song", parsed.song);
            setSongName?.(parsed.song);
            setSongScrapado?.(parsed.song);
          }
          if (parsed.link && parsed.link !== link) setInstrument?.(parsed.link);
        } else if (parsed) {
          if (parsed.artist) {
            setLocalStorageItemSafe("artist", parsed.artist);
            setArtistName?.(parsed.artist);
            setArtistScrapado?.(parsed.artist);
          }
          if (parsed.song) {
            setLocalStorageItemSafe("song", parsed.song);
            setSongName?.(parsed.song);
            setSongScrapado?.(parsed.song);
          }
        }

        // 5) Polling opcional para refletir criação no generalCifras (feito pelo Python)
        let found = null;
        const MAX_RETRIES = 10;
        const INTERVAL_MS = 800;
        for (let i = 1; i <= MAX_RETRIES; i++) {
          try {
            console.time(`[${instrumentName}] polling #${i}`);
            const chk = await checkCifraExists({
              instrumentName: effectiveInstrumentName,
              link,
              artist: finalArtist,
              song: finalSong,
            });
            console.timeEnd(`[${instrumentName}] polling #${i}`);
            if (chk?.exists) {
              found = chk.data;
              break;
            }
          } catch (e) {
            if (e?.response?.status !== 404) {
              console.error(`[${instrumentName}] polling erro:`, e);
              throw e;
            }
          }
          await sleep(INTERVAL_MS);
        }

        if (found) {
          setCifraFROMDB?.(found);
          setLocalStorageJsonSafe("cifraFROMDB", found);
          setLocalStorageItemSafe("fromWHERE", "DB");
          if (!artistName && found?.artist) setArtistName?.(found.artist);
          if (!songName && found?.song) setSongName?.(found.song);
        } else {
          console.warn(
            `[${effectiveInstrumentName}] documento geral ainda não visível (ok, Python cuida disso).`
          );
        }

        // 6) Atualiza UI (carrega dados do user DB)
        console.time("[gettingSongData()]");
        const fresh = await gettingSongData?.();
        console.timeEnd("[gettingSongData()]");
        console.log("[gettingSongData()] =>", fresh);

        notify("Success", "Cifra adicionada com sucesso!");
        setCifraExiste?.(false);
        updateScrapeStatus(true);
        onLinkAdded?.();
      } catch (err) {
        console.error(`[${effectiveInstrumentName}] handleSubmit error`, err);
        console.error(`[${effectiveInstrumentName}] handleSubmit full response`, err?.response?.data);
        const msg = buildUserErrorMessage(err);
        console.error(
          `[${effectiveInstrumentName}] user-facing error from:`,
          err?.response?.data?.message || "unknown"
        );
        notify("Error", msg);
        updateScrapeStatus(false);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        console.groupEnd();
      }
    },
    [
      instrument,
      instrumentName,
      artistName,
      songName,
      progress,
      gettingSongData,
      setArtistName,
      setSongName,
      setShowSnackBar,
      setSnackbarMessage,
      setArtistScrapado,
      setSongScrapado,
      setCifraExiste,
      setCifraFROMDB,
      setInstrument,
      setVoiceInstrument,
      onResolvedInstrumentLink,
      setScrapeStatus,
      primeArtistSongFromLink,
      updateScrapeStatus,
      buildUserErrorMessage,
      onLinkAdded,
    ]
  );

  const routeIncomingLink = useCallback(
    (rawLink) => {
      const nextLink = String(rawLink || "").trim();
      if (!nextLink) return;

      const detectedInstrument = classifyInstrumentLink(nextLink);
      if (
        detectedInstrument &&
        detectedInstrument !== instrumentName &&
        typeof onResolvedInstrumentLink === "function"
      ) {
        setInstrument?.("");
        onResolvedInstrumentLink(detectedInstrument, nextLink);
        notify("Info", `Link moved to ${detectedInstrument}.`);
        updateScrapeStatus(false);
      } else {
        setInstrument?.(nextLink);
      }
      primeArtistSongFromLink(nextLink);
      setTimeout(() => handleSubmit(nextLink), 0);
    },
    [
      handleSubmit,
      instrumentName,
      onResolvedInstrumentLink,
      primeArtistSongFromLink,
      setInstrument,
      updateScrapeStatus,
    ],
  );

  useEffect(() => {
    if (instrumentName !== "voice") return undefined;

    const handleVoiceAutoSubmit = (event) => {
      const link = String(event.detail?.link || "").trim();
      if (!link) return;

      routeIncomingLink(link);
    };

    window.addEventListener(LETRAS_AUTO_SUBMIT_EVENT, handleVoiceAutoSubmit);
    return () => {
      window.removeEventListener(LETRAS_AUTO_SUBMIT_EVENT, handleVoiceAutoSubmit);
    };
  }, [instrumentName, routeIncomingLink]);

  useEffect(() => {
    if (!touchLayout || (!notesOpen && !extensionInfoOpen)) return undefined;
    return lockPageScroll();
  }, [extensionInfoOpen, notesOpen, touchLayout]);

  const rangeProgress = `${Number(progress || 0)}%`;

  useEffect(() => {
    const markExtensionInstalled = () => {
      setExtensionInstalled(true);
    };

    if (window.__LIVENLOUD_QUICK_ADD_EXTENSION__?.installed) {
      markExtensionInstalled();
    }

    window.addEventListener(
      QUICK_ADD_EXTENSION_READY_EVENT,
      markExtensionInstalled,
    );
    return () => {
      window.removeEventListener(
        QUICK_ADD_EXTENSION_READY_EVENT,
        markExtensionInstalled,
      );
    };
  }, []);

  return (
    <div
      className={`${modalLayout ? "grid gap-x-3 gap-y-3 md:grid-cols-[1.45fr_0.55fr] md:gap-y-5" : "flex w-full flex-col"} ${
        expandedControls
          ? "mt-0 rounded-[18px] bg-transparent px-0 py-0"
          : `mt-0 neuphormism-b px-5 py-4 ${
              hasLink ? "bg-[goldenrod]/15" : ""
            }`
      }`}
    >
      {/* Header */}
      {!modalLayout ? (
        <div
          className={`flex justify-between ${
            expandedControls ? "mb-3 items-center" : ""
          }`}
        >
          <span className="text-sm font-bold">
            {instrumentName[0].toUpperCase() + instrumentName.slice(1)}
          </span>
          {!expandedControls ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={
                  hasLink
                    ? `Open ${instrumentName} notes`
                    : `${instrumentName} notes disabled until link is added`
                }
                title={hasLink ? "Notes" : "Add a link before notes"}
                disabled={!hasLink}
                onClick={openNotes}
                className={`rounded-sm p-1 transition ${
                  hasLink
                    ? "text-gray-700 hover:bg-gray-200 hover:text-black"
                    : "cursor-not-allowed text-gray-300 opacity-60"
                }`}
              >
                <FaRegStickyNote aria-hidden="true" className="text-base" />
              </button>
              <button
                type="button"
                aria-label={
                  hasLink
                    ? `Open ${instrumentName} presentation`
                    : `${instrumentName} presentation disabled until link is added`
                }
                title={hasLink ? "Play presentation" : "No link added"}
                disabled={!hasLink}
                onClick={openPresentation}
                className={`rounded-sm p-1 transition ${
                  hasLink
                    ? "text-gray-700 hover:bg-gray-200 hover:text-black"
                    : "cursor-not-allowed text-gray-300 opacity-60"
                }`}
              >
                <FaPlay aria-hidden="true" className="text-base" />
              </button>
              <button
                type="button"
                aria-label={
                  hasLink
                    ? `Open ${instrumentName} link in a new tab`
                    : `${instrumentName} link not added`
                }
                title={hasLink ? "Open link" : "No link added"}
                disabled={!hasLink}
                onClick={openInstrumentLink}
                className={`rounded-sm p-1 transition ${
                  hasLink
                    ? "text-gray-700 hover:bg-gray-200 hover:text-black"
                    : "cursor-not-allowed text-gray-300 opacity-60"
                }`}
              >
                <FaRegFileAlt aria-hidden="true" className="text-base" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {modalLayout && !extensionInstalled ? (
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2.5 rounded-[14px] bg-[goldenrod] px-3 py-2.5 text-left text-black shadow-[0_7px_16px_rgba(162,113,0,0.18)] transition active:scale-[0.99] md:col-span-2 md:gap-3 md:rounded-[16px] md:px-4"
          onClick={() => setExtensionInfoOpen(true)}
        >
          <span className="flex min-w-0 items-center gap-2.5 md:gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/70 text-[12px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] md:h-10 md:w-10 md:rounded-[12px] md:text-base">
              <FaChrome aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] md:text-[11px]">
                Chrome Extension
              </span>
              <span className="mt-0.5 block text-[11px] font-bold leading-4 md:mt-1 md:text-sm md:leading-5">
                Add songs faster from Cifra Club, Letras and Ultimate Guitar.
              </span>
            </span>
          </span>
          <span className="shrink-0 text-[10px] font-black" aria-hidden="true">
            ↗
          </span>
        </button>
      ) : null}

      <div className={`relative ${expandedControls ? "mt-0" : "mt-2"} ${modalLayout ? "md:col-span-2" : ""}`}>
        {modalLayout ? (
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[goldenrod] md:mb-2 md:text-[11px]">
            {t("instrumentModal.linkSource")}
          </p>
        ) : null}
        <input
          type="text"
          placeholder={t("instrumentModal.linkPlaceholder")}
          className={`w-full border border-[goldenrod]/35 bg-white text-black shadow-[0_8px_18px_rgba(0,0,0,0.08)] outline-none focus:border-[goldenrod] focus:shadow-[0_10px_22px_rgba(218,165,32,0.18)] ${
            expandedControls
              ? "h-12 rounded-[13px] px-3.5 text-[13px] font-bold md:h-14 md:rounded-[16px] md:px-4 md:text-base"
              : "h-6 rounded-sm p-1 text-sm"
          } ${isLocked ? "cursor-default" : ""}`}
          value={instrument}
          readOnly={isLocked}
          onChange={(e) => setInstrument(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").trim();
            routeIncomingLink(pasted);
          }}
          onBlur={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            blurTimer.current = setTimeout(() => handleSubmit(), 150);
          }}
        />
        {isLocked && !modalLayout && (
          <button
            type="button"
            aria-label={`Remove ${instrumentName} link`}
            className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center text-gray-700 ${
              expandedControls ? "h-9 w-9 rounded-[12px]" : "text-xs leading-none"
            }`}
            onClick={() => {
              setInstrument("");
              updateScrapeStatus(false);
            }}
          >
            <FaTrashAlt aria-hidden="true" className="text-sm" />
          </button>
        )}
      </div>

      {/* Link input */}
      {expandedControls && !hasLink ? (
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2 self-end rounded-[11px] neuphormism-b-btn px-3 text-[11px] font-bold text-black md:h-12 md:rounded-[12px] md:text-xs"
          onClick={pasteLinkFromClipboard}
        >
          <FaPaste aria-hidden="true" />
          {t("instrumentModal.pasteFromClipboard")}
        </button>
      ) : null}

      {expandedControls ? (
        <div className={`mt-0 grid gap-2 md:col-span-2 md:gap-3 ${hasLink ? "grid-cols-3" : "grid-cols-2"}`}>
          <button
            type="button"
            aria-label={
              hasLink
                ? `Open ${instrumentName} presentation`
                : `${instrumentName} presentation disabled until link is added`
            }
            title={hasLink ? "Play presentation" : "No link added"}
            disabled={!hasLink}
            onClick={openPresentation}
            className={`neuphormism-b-btn flex min-h-11 items-center justify-center gap-2 rounded-[11px] px-2.5 py-2 text-left text-[11px] font-bold md:justify-start md:gap-3 md:rounded-[14px] md:px-4 md:py-3 md:text-sm ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaPlay aria-hidden="true" className="shrink-0 text-[12px] md:text-base" />
            <span>
              <span className="block">{t("instrumentModal.play")}</span>
              <span className="mt-1 hidden text-xs font-medium text-gray-500 md:block">
                {t("instrumentModal.playHelp")}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={
              hasLink
                ? `Open ${instrumentName} link in a new tab`
                : `${instrumentName} link not added`
            }
            title={hasLink ? "Open link" : "No link added"}
            disabled={!hasLink}
            onClick={openInstrumentLink}
            className={`neuphormism-b-btn flex min-h-11 items-center justify-center gap-2 rounded-[11px] px-2.5 py-2 text-left text-[11px] font-bold md:justify-start md:gap-3 md:rounded-[14px] md:px-4 md:py-3 md:text-sm ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaExternalLinkAlt aria-hidden="true" className="shrink-0 text-[12px] md:text-base" />
            <span>
              <span className="block">{t("instrumentModal.openLink")}</span>
              <span className="mt-1 hidden text-xs font-medium text-gray-500 md:block">
                {t("instrumentModal.openLinkHelp")}
              </span>
            </span>
          </button>
          {hasLink ? (
            <button
              type="button"
              aria-label={`Remove ${instrumentName} link`}
              className="neuphormism-b-btn flex min-h-11 items-center justify-center gap-2 rounded-[11px] px-2.5 py-2 text-left text-[11px] font-bold text-black md:justify-start md:gap-3 md:rounded-[14px] md:px-4 md:py-3 md:text-sm"
              onClick={() => {
                setInstrument("");
                updateScrapeStatus(false);
              }}
            >
              <FaTrashAlt aria-hidden="true" className="shrink-0 text-[12px] md:text-base" />
              <span>
                <span className="block">{t("instrumentModal.remove")}</span>
                <span className="mt-1 hidden text-xs font-medium text-gray-500 md:block">
                  {t("instrumentModal.removeNewHelp")}
                </span>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-0 rounded-[14px] border border-black/5 bg-white/65 px-3 py-3 shadow-[0_5px_14px_rgba(0,0,0,0.04)] md:col-span-2 md:rounded-[16px] md:px-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="max-w-[24rem]">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[goldenrod] md:text-[11px]">
              {t("instrumentModal.progression")}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-gray-500 md:text-sm md:leading-5">
              {t("instrumentModal.progressionHelp")}
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-3 md:min-w-[18rem] md:w-auto">
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => setProgress(Math.max(0, Number(progress || 0) - 5))}
            onBlur={() => {
              if (instrument?.trim()) handleSubmit();
            }}
            aria-label={`Decrease ${instrumentName} progress`}
          >
            <FaMinus />
          </button>
          <div className="min-w-[5rem] text-center text-xl font-black text-black md:text-2xl">
            {rangeProgress}
          </div>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => setProgress(Math.min(100, Number(progress || 0) + 5))}
            onBlur={() => {
              if (instrument?.trim()) handleSubmit();
            }}
            aria-label={`Increase ${instrumentName} progress`}
          >
            <FaPlus />
          </button>
          </div>
        </div>
      </div>
      {shouldShowGuitarProRow ? (
        <div className="mt-3 rounded-[16px] neuphormism-b-se px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
            <GuitarProIcon
              active={hasGuitarProFiles}
              title={
                hasGuitarProFiles
                  ? `${guitarProFiles.length} Guitar Pro file(s)`
                  : "No Guitar Pro files"
              }
            />
            <span className="text-sm font-bold text-black">
              Guitar Pro {hasGuitarProFiles ? `(${guitarProFiles.length})` : ""}
            </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              File
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="neuphormism-b-btn flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-black">
              <FaPlus />
              <span>{t("instrumentModal.addGp")}</span>
              <input
                type="file"
                accept={GUITAR_PRO_ACCEPT}
                className="hidden"
                onChange={handleGuitarProUpload}
              />
            </label>
            <button
              type="button"
              onClick={handleGuitarProDelete}
              disabled={!hasGuitarProFiles}
              className="neuphormism-b-btn flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60"
            >
              <FaMinus />
              <span>{t("instrumentModal.remove")}</span>
            </button>
            <button
              type="button"
              onClick={openGuitarProFile}
              disabled={!hasGuitarProFiles}
              className="neuphormism-b-btn flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60"
            >
              <FaRegFileAlt />
              <span>{t("instrumentModal.view")}</span>
            </button>
          </div>
        </div>
      ) : null}
      {modalLayout ? (
        <div className="rounded-[14px] border border-black/5 bg-white/65 px-3 py-3 shadow-[0_5px_14px_rgba(0,0,0,0.04)] md:col-span-2 md:rounded-[16px] md:px-4">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[goldenrod] md:mb-2 md:text-[11px]">
            {t("instrumentModal.notes")}
          </p>
          <textarea
            className="min-h-[104px] w-full resize-y rounded-[12px] border border-gray-300 bg-white p-3 text-[12px] font-medium text-black outline-none focus:border-[goldenrod] md:min-h-[148px] md:rounded-[14px] md:text-sm"
            value={notes}
            onChange={(event) => onNotesChange?.(event.target.value)}
            onBlur={() =>
              saveNotes(notes, { closeModal: false, notifySuccess: false })
            }
            placeholder={t("instrumentModal.notesPlaceholder")}
          />
          <p className="mt-1.5 text-[10px] font-medium leading-4 text-gray-500 md:mt-2 md:text-xs">
            {notesSaving ? "Saving notes..." : t("instrumentModal.notesAutoSave")}
          </p>
        </div>
      ) : null}
      {notesOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/25">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setNotesOpen(false)}
            aria-label={t("instrumentModal.closeNotes")}
          />
          <div className="absolute left-1/2 top-1/2 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2">
            <SongInstrumentNotes
              instrumentName={instrumentName}
              title={`${instrumentName} notes`}
              value={notes}
              onChange={onNotesChange}
              onSave={saveNotes}
              onClose={() => setNotesOpen(false)}
              isSaving={notesSaving}
            />
          </div>
        </div>
      ) : null}
      {extensionInfoOpen ? (
        <ChromeExtensionInfoModal
          onClose={() => setExtensionInfoOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default NewSongInputLinkBox;
