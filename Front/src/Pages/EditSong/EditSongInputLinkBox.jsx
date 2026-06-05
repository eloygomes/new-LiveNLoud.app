import { useEffect, useState, useCallback } from "react";
import {
  FaExternalLinkAlt,
  FaMinus,
  FaPaste,
  FaPlus,
  FaPlay,
  FaRegFileAlt,
  FaRegStickyNote,
  FaTrashAlt,
} from "react-icons/fa";
import {
  api,
  deleteGuitarProFile,
  uploadGuitarProFile,
  updateInstrumentNotes,
} from "../../Tools/Controllers";
import SongInstrumentNotes from "../SongInstrumentNotes";
import { lockPageScroll } from "../../Tools/scrollLock";
import GuitarProIcon from "../../components/GuitarPro/GuitarProIcon";
import { GUITAR_PRO_ACCEPT } from "../../constants/guitarPro";
import {
  getGuitarProFiles,
  isValidGuitarProFile,
} from "../../utils/guitarPro/validateGuitarProFile";
import { classifyInstrumentLink } from "../shared/instrumentLinkClassifier";

const LETRAS_AUTO_SUBMIT_EVENT = "livenloud:edit-auto-submit-voice";

/* eslint-disable react/prop-types */
function EditSongInputLinkBox({
  instrumentName,
  link,
  setInstrument,
  setVoiceInstrument,
  progress,
  setProgress,
  dataFromAPI,
  onLinkChange,
  onProgressChange,
  notes = "",
  onNotesChange,
  setIsDirty,
  setShowSnackBar,
  setSnackbarMessage,
  onLinkAdded,
  touchLayout = false,
  songData = null,
  onSongDataChange,
  onResolvedInstrumentLink,
  modalLayout = false,
}) {
  const [dataFromAPIParsed, setDataFromAPIParsed] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const isLocked = Boolean(link?.trim());
  const hasLink = Boolean(link?.trim());
  const guitarProFiles = getGuitarProFiles(songData);
  const hasGuitarProFiles = guitarProFiles.length > 0;
  const shouldShowGuitarProRow = false;
  const expandedControls = touchLayout || modalLayout;
  const iconButtonClass =
    "neuphormism-b-btn flex h-10 w-10 items-center justify-center rounded-[12px] text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60";

  const notify = useCallback(
    (title, message) => {
      setShowSnackBar?.(true);
      setSnackbarMessage?.({ title, message });
    },
    [setShowSnackBar, setSnackbarMessage]
  );

  const getLinkHost = (raw) => {
    try {
      return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  };

  const isLetrasLink = (raw) => {
    const host = getLinkHost(raw);
    return host === "letras.mus.br" || host === "letras.com";
  };

  const isVoiceLyricsLink = (raw) => (
    isLetrasLink(raw) || classifyInstrumentLink(raw) === "voice"
  );

  const openInstrumentLink = () => {
    const targetLink = (link || "").trim();
    if (!targetLink) return;

    const href = /^https?:\/\//i.test(targetLink)
      ? targetLink
      : `https://${targetLink}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const openPresentation = () => {
    const artist = (localStorage.getItem("artist") || "").trim();
    const song = (localStorage.getItem("song") || "").trim();

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
      setIsDirty?.(true);
    },
    [onSongDataChange, setIsDirty, songData]
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
    const artist = (localStorage.getItem("artist") || "").trim();
    const song = (localStorage.getItem("song") || "").trim();

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
    const artist = (localStorage.getItem("artist") || "").trim();
    const song = (localStorage.getItem("song") || "").trim();

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
    const artist = (localStorage.getItem("artist") || "").trim();
    const song = (localStorage.getItem("song") || "").trim();

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
      setIsDirty?.(true);
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

  useEffect(() => {
    try {
      if (typeof dataFromAPI === "string" && dataFromAPI.trim() !== "") {
        const dataToLoad = JSON.parse(dataFromAPI);
        setDataFromAPIParsed(dataToLoad);
      } else if (typeof dataFromAPI === "object" && dataFromAPI !== null) {
        setDataFromAPIParsed(dataFromAPI);
      } else {
        // console.warn("Invalid or empty dataFromAPI:", dataFromAPI);
        setDataFromAPIParsed({});
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      setDataFromAPIParsed({});
    }
  }, [dataFromAPI]);

  useEffect(() => {
    if (dataFromAPIParsed) {
      const instrumentData = dataFromAPIParsed[instrumentName];
      if (instrumentData && instrumentData.link) {
        setInstrument(instrumentData.link);
        setProgress(instrumentData.progress);
      }
    }
  }, [dataFromAPIParsed, instrumentName, setInstrument, setProgress]);

  useEffect(() => {
    if (instrumentName !== "voice") return undefined;

    const handleVoiceAutoSubmit = (event) => {
      const redirectedLink = String(event.detail?.link || "").trim();
      if (!redirectedLink) return;

      routeIncomingLink(redirectedLink);
    };

    window.addEventListener(LETRAS_AUTO_SUBMIT_EVENT, handleVoiceAutoSubmit);
    return () =>
      window.removeEventListener(LETRAS_AUTO_SUBMIT_EVENT, handleVoiceAutoSubmit);
  }, [instrumentName]);

  useEffect(() => {
    if (!touchLayout || !notesOpen) return undefined;
    return lockPageScroll();
  }, [notesOpen, touchLayout]);

  // console.log(progress);

  const handledata = async (linkOverride) => {
    const userEmail = localStorage.getItem("userEmail");
    const targetLink = (linkOverride ?? link ?? "").trim();
    const detectedInstrument = classifyInstrumentLink(targetLink);
    const effectiveInstrumentName = detectedInstrument || instrumentName;

    if (!userEmail || !targetLink) return;

    if (detectedInstrument && detectedInstrument !== instrumentName) {
      setInstrument("");
      onLinkChange?.("");
      setIsDirty?.(true);
      onResolvedInstrumentLink?.(detectedInstrument, targetLink);
    }

    if (isVoiceLyricsLink(targetLink) && effectiveInstrumentName !== "voice") {
      setInstrument("");
      onLinkChange?.("");
      setIsDirty?.(true);
      if (typeof onResolvedInstrumentLink === "function") {
        onResolvedInstrumentLink("voice", targetLink);
      } else {
        setVoiceInstrument?.(targetLink);
      }
      notify("Error", "Esse link deve ser usado no campo Voice");
      window.dispatchEvent(
        new CustomEvent(LETRAS_AUTO_SUBMIT_EVENT, {
          detail: { link: targetLink },
        })
      );
      return;
    }

    try {
      notify("Load", "Carregando...");
      await api.post("/api/scrape", {
        artist: "",
        song: "",
        email: userEmail,
        instrument: `${effectiveInstrumentName}`,
        instrument_progressbar: `${progress}`,
        link: targetLink,
      });
      notify("Success", "Cifra adicionada com sucesso!");
      onLinkAdded?.();
    } catch (error) {
      console.error(
        "Error registering user in API:",
        error.response ? error.response.data : error.message
      );
      notify("Error", "Não foi possivel adicionar o link, tente mais tarde");
    }
  };

  const routeIncomingLink = (rawLink) => {
    const nextLink = String(rawLink || "").trim();
    if (!nextLink) return;

    const detectedInstrument = classifyInstrumentLink(nextLink);
    if (
      detectedInstrument &&
      detectedInstrument !== instrumentName &&
      typeof onResolvedInstrumentLink === "function"
    ) {
      setInstrument("");
      onLinkChange?.("");
      setIsDirty?.(true);
      onResolvedInstrumentLink(detectedInstrument, nextLink);
      notify("Info", `Link moved to ${detectedInstrument}.`);
    } else {
      setInstrument(nextLink);
      onLinkChange?.(nextLink);
      setIsDirty?.(true);
    }
    setTimeout(() => handledata(nextLink), 0);
  };

  // useEffect(() => {
  //   handledata().catch((error) => console.error(error));
  // }, [link, progress]);

  const rangeProgress = `${Number(progress || 0)}%`;

  return (
    <div
      className={`${modalLayout ? "grid gap-y-5 gap-x-3 md:grid-cols-[1.45fr_0.55fr]" : "flex w-full flex-col"} ${
        expandedControls
          ? "mt-0 rounded-[18px] bg-transparent px-0 py-0"
          : `mt-0 neuphormism-b-btn px-5 py-4 ${
              hasLink ? "bg-[goldenrod]/15" : ""
            }`
      }`}
    >
      {!modalLayout ? (
        <div
          className={`flex flex-row justify-between ${
            expandedControls ? "mb-3 items-center" : ""
          }`}
        >
          <span className="pb-2 text-sm font-bold">
            {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
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

      <div className={`relative ${expandedControls ? "mt-0" : "flex h-8 flex-row"}`}>
        {modalLayout ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
            Link source
          </p>
        ) : null}
        <input
          type="text"
          placeholder="Insert your link here"
          className={`w-full border border-[goldenrod]/35 bg-white pr-11 text-black shadow-[0_8px_18px_rgba(0,0,0,0.08)] outline-none focus:border-[goldenrod] focus:shadow-[0_10px_22px_rgba(218,165,32,0.18)] ${
            expandedControls
              ? "h-14 rounded-[16px] px-4 text-base font-bold"
              : "h-6 rounded-sm p-1 text-sm"
          } ${isLocked ? "cursor-default" : ""}`}
          value={link}
          readOnly={isLocked}
          onChange={(e) => {
            const value = e.target.value;
            setInstrument(value);
            onLinkChange?.(value);
            setIsDirty?.(true);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").trim();
            routeIncomingLink(pasted);
          }}
          onBlur={() => {
            handledata();
          }}
        />
        {isLocked && (
          <button
            type="button"
            aria-label={`Remove ${instrumentName} link`}
            className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center text-gray-700 ${
              expandedControls ? "h-9 w-9 rounded-[12px]" : "text-xs leading-none"
            }`}
            onClick={() => {
              setInstrument("");
              onLinkChange?.("");
              setIsDirty?.(true);
            }}
          >
            <FaTrashAlt aria-hidden="true" className="text-sm" />
          </button>
        )}
      </div>

      {expandedControls && !hasLink ? (
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 self-end rounded-[12px] neuphormism-b-btn px-3 text-xs font-bold text-black"
          onClick={pasteLinkFromClipboard}
        >
          <FaPaste aria-hidden="true" />
          Paste from clipboard
        </button>
      ) : null}

      {expandedControls ? (
        <div className="md:col-span-2 mt-0 grid grid-cols-2 gap-3">
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
            className={`neuphormism-b-btn flex items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm font-bold ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaPlay aria-hidden="true" className="shrink-0 text-base" />
            <span>
              <span className="block">Play</span>
              <span className="mt-1 block text-xs font-medium text-gray-500">
                Open this instrument in presentation mode.
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
            className={`neuphormism-b-btn flex items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm font-bold ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaExternalLinkAlt aria-hidden="true" className="shrink-0 text-base" />
            <span>
              <span className="block">Open Link</span>
              <span className="mt-1 block text-xs font-medium text-gray-500">
                Visit the original source in a new tab.
              </span>
            </span>
          </button>
        </div>
      ) : null}

      <div className="md:col-span-2 mt-0 rounded-[16px] neuphormism-b-se px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[24rem]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              Progression
            </p>
            <p className="mt-1 text-sm font-medium leading-5 text-gray-500">
              Set how ready this instrument is for rehearsal or live use.
            </p>
          </div>
          <div className="flex min-w-[18rem] items-center justify-between gap-3">
            <button
              type="button"
              className={iconButtonClass}
              onClick={() => {
                const value = Math.max(0, Number(progress || 0) - 5);
                setProgress(value);
                onProgressChange?.(value);
                setIsDirty?.(true);
              }}
              aria-label={`Decrease ${instrumentName} progress`}
            >
              <FaMinus />
            </button>
            <div className="min-w-[5rem] text-center text-2xl font-bold text-black">
              {rangeProgress}
            </div>
            <button
              type="button"
              className={iconButtonClass}
              onClick={() => {
                const value = Math.min(100, Number(progress || 0) + 5);
                setProgress(value);
                onProgressChange?.(value);
                setIsDirty?.(true);
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
              <span>Add GP</span>
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
              <span>Remove</span>
            </button>
            <button
              type="button"
              onClick={openGuitarProFile}
              disabled={!hasGuitarProFiles}
              className="neuphormism-b-btn flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-black disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-60"
            >
              <FaRegFileAlt />
              <span>View</span>
            </button>
          </div>
        </div>
      ) : null}
      {modalLayout ? (
        <div className="rounded-[16px] neuphormism-b-se px-4 py-3 md:col-span-2">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
            Notes
          </p>
          <textarea
            className="min-h-[148px] w-full resize-y rounded-[14px] border border-gray-300 bg-white p-3 text-sm font-medium text-black outline-none focus:border-[goldenrod]"
            value={notes}
            onChange={(event) => onNotesChange?.(event.target.value)}
            onBlur={() =>
              saveNotes(notes, { closeModal: false, notifySuccess: false })
            }
            placeholder="Write instrument notes here"
          />
          <p className="mt-2 text-xs font-medium text-gray-500">
            {notesSaving ? "Saving notes..." : "Notes save automatically when you leave this field."}
          </p>
        </div>
      ) : null}
      {notesOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/25">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setNotesOpen(false)}
            aria-label="Close notes modal"
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
    </div>
  );
}

export default EditSongInputLinkBox;
