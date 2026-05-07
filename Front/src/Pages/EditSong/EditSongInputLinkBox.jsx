import { useEffect, useState, useCallback } from "react";
import {
  FaExternalLinkAlt,
  FaPaste,
  FaPlay,
  FaRegFileAlt,
  FaRegStickyNote,
  FaTrashAlt,
} from "react-icons/fa";
import { api, updateInstrumentNotes } from "../../Tools/Controllers";
import SongInstrumentNotes from "../SongInstrumentNotes";
import { lockPageScroll } from "../../Tools/scrollLock";

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
}) {
  const [dataFromAPIParsed, setDataFromAPIParsed] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const isLocked = Boolean(link?.trim());
  const hasLink = Boolean(link?.trim());

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
      setInstrument(clipboardText);
      onLinkChange?.(clipboardText);
      setIsDirty?.(true);
      setTimeout(() => handledata(clipboardText), 0);
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

  const saveNotes = async (plainText) => {
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
      notify("Success", "Notas salvas com sucesso!");
      setNotesOpen(false);
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

      setInstrument(redirectedLink);
      onLinkChange?.(redirectedLink);
      setIsDirty?.(true);
      setTimeout(() => handledata(redirectedLink), 0);
    };

    window.addEventListener(LETRAS_AUTO_SUBMIT_EVENT, handleVoiceAutoSubmit);
    return () =>
      window.removeEventListener(LETRAS_AUTO_SUBMIT_EVENT, handleVoiceAutoSubmit);
  }, [instrumentName, onLinkChange, setInstrument, setIsDirty]);

  useEffect(() => {
    if (!touchLayout || !notesOpen) return undefined;
    return lockPageScroll();
  }, [notesOpen, touchLayout]);

  // console.log(progress);

  const handledata = async (linkOverride) => {
    const userEmail = localStorage.getItem("userEmail");
    const targetLink = (linkOverride ?? link ?? "").trim();

    if (!userEmail || !targetLink) return;

    if (isLetrasLink(targetLink) && instrumentName !== "voice") {
      setInstrument("");
      onLinkChange?.("");
      setIsDirty?.(true);
      setVoiceInstrument?.(targetLink);
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
        instrument: `${instrumentName}`,
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

  // useEffect(() => {
  //   handledata().catch((error) => console.error(error));
  // }, [link, progress]);

  const rangeProgress = `${Number(progress || 0)}%`;

  return (
    <div
      className={`flex w-full flex-col ${
        touchLayout
          ? "mt-0 rounded-[18px] bg-transparent px-0 py-0"
          : `mt-3 neuphormism-b-btn px-5 py-3 ${
              hasLink ? "bg-[goldenrod]/15" : ""
            }`
      }`}
    >
      <div
        className={`flex flex-row justify-between ${
          touchLayout ? "mb-3 items-center" : ""
        }`}
      >
        <span
          className={`font-bold ${
            touchLayout ? "text-[1.05rem] text-black" : "pb-2 text-sm"
          }`}
        >
          {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
        </span>
        {!touchLayout ? (
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

      {touchLayout && !hasLink ? (
        <button
          type="button"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-[14px] neuphormism-b-btn px-3 py-3 text-sm font-black text-black"
          onClick={pasteLinkFromClipboard}
        >
          <FaPaste aria-hidden="true" />
          Paste link from clipboard
        </button>
      ) : null}

      <div className={`relative ${touchLayout ? "mt-1" : "flex h-8 flex-row"}`}>
        <input
          type="text"
          placeholder="Insert your link here"
          className={`w-full border border-gray-300 bg-white pr-11 text-black outline-none focus:border-[goldenrod] ${
            touchLayout
              ? "h-12 rounded-[14px] px-3 text-base font-medium"
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
            setInstrument(pasted);
            onLinkChange?.(pasted);
            setIsDirty?.(true);
            setTimeout(() => handledata(pasted), 0);
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
              touchLayout ? "h-9 w-9 rounded-[12px]" : "text-xs leading-none"
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

      {touchLayout ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
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
            className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-sm font-black ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaRegStickyNote aria-hidden="true" className="text-base" />
            <span>Notes</span>
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
            className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-[14px] px-2 py-3 text-sm font-black ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaPlay aria-hidden="true" className="text-base" />
            <span>Play</span>
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
            className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-sm font-black ${
              hasLink ? "text-black" : "cursor-not-allowed text-gray-400 opacity-60"
            }`}
          >
            <FaExternalLinkAlt aria-hidden="true" className="text-base" />
            <span>Open Link</span>
          </button>
        </div>
      ) : null}

      <div
        className={
          touchLayout
            ? "mt-5 rounded-[18px] neuphormism-b-se px-4 py-4"
            : "mt-3 flex items-center"
        }
      >
        {touchLayout ? (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[goldenrod]">
              Progress
            </span>
            <span className="text-xl font-black text-black">{rangeProgress}</span>
          </div>
        ) : null}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          style={{ "--range-progress": rangeProgress }}
          onChange={(e) => {
            const value = Number(parseInt(e.target.value, 10));
            setProgress(value);
            onProgressChange?.(value);
            setIsDirty?.(true);
          }}
          className="range-golden w-full"
        />
        {!touchLayout ? (
          <div className="w-14 text-right text-sm">{rangeProgress}</div>
        ) : null}
      </div>
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
