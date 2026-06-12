import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FaGear } from "react-icons/fa6";
import ToolBox from "./ToolBox";
import { toolBoxBtnStatusChange } from "./helpers/presentationUtils";
import { setLocalStorageItemSafe } from "../../Tools/storageSafe";
import {
  buildBlankPresentationLayouts,
  getBlankPresentationDraftStorageKey,
  getBlankPresentationSavedStorageKey,
  normalizeBlankPresentationInstrument,
  saveBlankPresentationCifra,
} from "./helpers/blankPresentationPersistence";

function safeDecode(value = "") {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

export default function BlankPresentation() {
  const {
    artist: routeArtist = "",
    song: routeSong = "",
    instrument: routeInstrument = "guitar01",
  } = useParams();
  const artist = useMemo(() => safeDecode(routeArtist), [routeArtist]);
  const song = useMemo(() => safeDecode(routeSong), [routeSong]);
  const instrument = useMemo(
    () =>
      normalizeBlankPresentationInstrument(
        safeDecode(routeInstrument || "guitar01"),
      ),
    [routeInstrument],
  );
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;
  const draftKey = useMemo(
    () => getBlankPresentationDraftStorageKey({ artist, song, instrument }),
    [artist, instrument, song],
  );
  const savedKey = useMemo(
    () => getBlankPresentationSavedStorageKey({ artist, song, instrument }),
    [artist, instrument, song],
  );
  const editorRef = useRef(null);
  const [toolBoxBtnStatus, setToolBoxBtnStatus] = useState(true);
  const [toolBoxRequestedPanel, setToolBoxRequestedPanel] = useState({
    id: "panel-editor",
    nonce: 0,
  });
  const [hideChords, setHideChords] = useState(false);
  const [selectContenttoShow, setSelectContenttoShow] = useState("default");
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [showProgressionMarkers, setShowProgressionMarkers] = useState(false);
  const [lastSavedProgressionMarkers, setLastSavedProgressionMarkers] =
    useState(false);
  const [isSavingCifra, setIsSavingCifra] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState({ type: "", message: "" });
  const [lastSavedDraft, setLastSavedDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(savedKey) || "";
  });
  const [touchVideoLink, setTouchVideoLink] = useState("");
  const [isTouchVideoActive, setIsTouchVideoActive] = useState(false);
  const [notesModalStatus, setNotesModalStatus] = useState(false);
  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(draftKey) || "";
  });
  const currentLayouts = useMemo(
    () =>
      buildBlankPresentationLayouts({
        cifra: draft,
        showProgressionMarkers,
      }),
    [draft, showProgressionMarkers],
  );
  const hasDraftChanges =
    draft.trim() !== "" &&
    (draft !== lastSavedDraft ||
      showProgressionMarkers !== lastSavedProgressionMarkers);
  const songDataFetched = useMemo(
    () => ({
      artist,
      song,
      instruments: {
        guitar01: instrument === "guitar01",
        guitar02: instrument === "guitar02",
        bass: instrument === "bass",
        keys: instrument === "keys",
        drums: instrument === "drums",
        voice: instrument === "voice",
      },
      [instrument]: {
        active: true,
        songCifra: currentLayouts.default.songCifra,
        presentationLayouts: currentLayouts,
      },
    }),
    [artist, currentLayouts, instrument, song],
  );

  useEffect(() => {
    setLocalStorageItemSafe("artist", artist);
    setLocalStorageItemSafe("song", song);
  }, [artist, song]);

  useEffect(() => {
    const nextDraft = localStorage.getItem(draftKey) || "";
    const nextSavedDraft = localStorage.getItem(savedKey) || "";
    setDraft(nextDraft);
    setLastSavedDraft(nextSavedDraft);
    setShowProgressionMarkers(false);
    setLastSavedProgressionMarkers(false);
    setSaveFeedback({ type: "", message: "" });
    setToolBoxBtnStatus(true);
    setToolBoxRequestedPanel((current) => ({
      id: "panel-editor",
      nonce: current.nonce + 1,
    }));
  }, [draftKey, savedKey]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [draftKey]);

  const persistDraft = (value) => {
    setDraft(value);
    setSaveFeedback({ type: "", message: "" });
    setLocalStorageItemSafe(draftKey, value);
  };

  const handleSaveCifra = async () => {
    setIsSavingCifra(true);
    setSaveFeedback({ type: "", message: "" });
    try {
      await saveBlankPresentationCifra({
        artist,
        song,
        instrument,
        cifra: draft,
        showProgressionMarkers,
      });
      setLocalStorageItemSafe(draftKey, draft);
      setLocalStorageItemSafe(savedKey, draft);
      setLastSavedDraft(draft);
      setLastSavedProgressionMarkers(showProgressionMarkers);
      setSaveFeedback({
        type: "success",
        message: "Saved to your library.",
      });
    } catch (error) {
      console.error("Erro ao salvar blank presentation:", error);
      setSaveFeedback({
        type: "error",
        message: error?.message || "Nao foi possivel salvar a cifra.",
      });
    } finally {
      setIsSavingCifra(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraft(lastSavedDraft);
    setShowProgressionMarkers(lastSavedProgressionMarkers);
    setSaveFeedback({ type: "", message: "" });
    setLocalStorageItemSafe(draftKey, lastSavedDraft);
  };

  const toggleProgressionMarkers = () => {
    setSaveFeedback({ type: "", message: "" });
    setShowProgressionMarkers((current) => !current);
  };

  const openEditorToolBox = () => {
    setToolBoxBtnStatus(true);
    setToolBoxRequestedPanel((current) => ({
      id: "panel-editor",
      nonce: current.nonce + 1,
    }));
    editorRef.current?.focus();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f0f0f0] px-4 pt-5 lg:px-6">
      <ToolBox
        toolBoxBtnStatus={toolBoxBtnStatus}
        setToolBoxBtnStatus={setToolBoxBtnStatus}
        toolBoxBtnStatusChange={toolBoxBtnStatusChange}
        embedLinks={[]}
        songFromURL={song}
        artistFromURL={artist}
        instrumentSelected={instrument}
        songDataFetched={songDataFetched}
        toggleTabsVisibility={() => {}}
        hideChords={hideChords}
        setHideChords={setHideChords}
        selectContenttoShow={selectContenttoShow}
        setSelectContenttoShow={setSelectContenttoShow}
        isEditing
        isSavingCifra={isSavingCifra}
        hasDraftChanges={hasDraftChanges}
        songCifraData={draft || " "}
        handleSaveCifra={handleSaveCifra}
        handleDiscardDraft={handleDiscardDraft}
        startEditingCifra={openEditorToolBox}
        onToggleMarksVisibility={toggleProgressionMarkers}
        transposeSteps={transposeSteps}
        setTransposeSteps={setTransposeSteps}
        displayKey="--"
        showProgressionMarkers={showProgressionMarkers}
        isTouchLayout={isTouchLayout}
        touchFontSizeLabel="100%"
        decreaseTouchFontSize={() => {}}
        increaseTouchFontSize={() => {}}
        blockSpacingLabel="32px"
        decreaseBlockSpacing={() => {}}
        increaseBlockSpacing={() => {}}
        onVideoModalChange={() => {}}
        linktoplay={touchVideoLink}
        setLinktoplay={setTouchVideoLink}
        videoModalStatus={isTouchVideoActive}
        setVideoModalStatus={setIsTouchVideoActive}
        instrumentNotes=""
        onInstrumentNotesChange={() => {}}
        onSaveInstrumentNotes={async () => {}}
        notesModalStatus={notesModalStatus}
        setNotesModalStatus={setNotesModalStatus}
        onOpenInstrumentNotes={() => setNotesModalStatus(true)}
        isSavingNotes={false}
        onSelectInstrument={() => {}}
        requestedPanel={toolBoxRequestedPanel}
      />
      <div className="container mx-auto h-full min-h-0 pb-5">
        <div className="mx-auto flex h-full min-h-0 w-11/12 flex-col 2xl:w-9/12">
          <section
            className={`relative mb-5 flex shrink-0 justify-between neuphormism-b ${
              isTouchLayout
                ? "items-stretch gap-3 px-4 py-3"
                : "min-h-[7.25rem] flex-row items-center px-10 pb-4 pt-8"
            }`}
          >
            {!isTouchLayout ? (
              <div className="pointer-events-none absolute left-10 top-4 flex items-center text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                <span>Presentation</span>
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h1
                className={`font-bold text-black ${
                  isTouchLayout
                    ? "truncate text-[1.65rem] leading-none"
                    : "text-[2.45rem] leading-[1.02]"
                }`}
                title={song}
              >
                {song}
              </h1>
              <h1
                className={`font-bold text-black ${
                  isTouchLayout
                    ? "truncate text-[1.35rem] leading-none"
                    : "text-[2rem] leading-[1.02]"
                }`}
                title={artist}
              >
                {artist}
              </h1>
              {saveFeedback.message ? (
                <p
                  className={`mt-2 truncate text-xs font-bold ${
                    saveFeedback.type === "error"
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                  aria-live="polite"
                >
                  {saveFeedback.message}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-start">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black ${
                  toolBoxBtnStatus ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite]" : ""
                } ${isTouchLayout ? "h-12 w-16 p-0 text-xs" : "h-16 w-16 p-0 text-sm"}`}
                onClick={() =>
                  toolBoxBtnStatusChange(toolBoxBtnStatus, setToolBoxBtnStatus)
                }
                aria-label="Options"
                title="Open presentation options"
              >
                <FaGear className={isTouchLayout ? "h-5 w-5" : "h-8 w-8"} />
                <span className="sr-only">Options</span>
              </button>
            </div>
          </section>

          <main className="min-h-0 flex-1 neuphormism-b overflow-hidden">
            <textarea
              ref={editorRef}
              value={draft}
              onChange={(event) => persistDraft(event.target.value)}
              spellCheck={false}
              className="h-full min-h-0 w-full resize-none overflow-y-auto border-0 bg-transparent px-8 py-8 font-mono text-[1rem] leading-7 text-black outline-none md:px-10 md:py-10 md:text-[1.08rem]"
              placeholder={`tom:\n\n${song}\n${artist}\n\n`}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
