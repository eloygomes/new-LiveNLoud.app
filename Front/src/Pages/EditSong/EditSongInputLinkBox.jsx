import { useEffect, useState, useCallback } from "react";
import { FaRegFileAlt } from "react-icons/fa";
import { api as axiosApi } from "../../Tools/Controllers";

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
  setIsDirty,
  setShowSnackBar,
  setSnackbarMessage,
  onLinkAdded,
}) {
  const [dataFromAPIParsed, setDataFromAPIParsed] = useState(null);
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
      await axiosApi.post("/api/scrape", {
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

  return (
    <div className="flex flex-col mt-3 w-full neuphormism-b-btn px-5 py-3">
      <div className="flex flex-row justify-between">
        <span className="text-sm pb-2 font-bold">
          {instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1)}
        </span>
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

      <div className="relative flex flex-row h-8">
        <input
          type="text"
          placeholder="Insert your link here"
          className={`w-full p-1 pr-8 border border-gray-300 rounded-sm text-sm h-6 ${
            isLocked ? "cursor-default" : ""
          }`}
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
            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs leading-none"
            onClick={() => {
              setInstrument("");
              onLinkChange?.("");
              setIsDirty?.(true);
            }}
          >
            🗑️
          </button>
        )}
      </div>
      <div className="flex flex-row">
        <div className="flex flex-row items-center mt-1 w-1/2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => {
              const value = Number(parseInt(e.target.value, 10));
              setProgress(value);
              onProgressChange?.(value);
              setIsDirty?.(true);
            }}
            className="w-1/2"
          />
        </div>
        <div className="relative flex flex-row pt-1 w-1/2">
          <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200 w-2/3 mt-6">
            <div
              style={{ width: `${progress || 0}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
            ></div>
          </div>
          <div className="w-1/3 pl-4 py-3 ml-5 text-right">
            <span className="text-sm ml-auto">{progress || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSongInputLinkBox;
