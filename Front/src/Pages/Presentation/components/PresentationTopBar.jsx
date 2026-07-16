import {
  FaDownLeftAndUpRightToCenter,
  FaFilePen,
  FaGear,
  FaUpRightAndDownLeftFromCenter,
} from "react-icons/fa6";
import {
  IoArrowDownCircle,
  IoDocumentText,
  IoVideocam,
} from "react-icons/io5";
import { GiGuitar } from "react-icons/gi";
import GuitarProIcon from "../../../components/GuitarPro/GuitarProIcon";

function PresentationTopBar({
  visible,
  isTouchLayout,
  isTouchVideoActive,
  songFromURL,
  artistFromURL,
  activeLayoutLabel,
  previousSetlistSong,
  nextSetlistSong,
  toolBoxBtnStatus,
  isEditing,
  isVideoModalOpen,
  openEditorToolBox,
  onToggleToolBox,
  isExpandedCifra,
  onToggleExpanded,
  onGoToEditSong,
  instrumentSelected,
  canOpenGuitarPro,
  onOpenGuitarProViewer,
  hasVideos = false,
  isScrollingAvailable = true,
  onOpenTranspose,
  onOpenNotes,
  onOpenInstruments,
  onOpenVideos,
  onOpenScrolling,
  onEnterLiveMode,
  onGoToSetlistSong,
}) {
  if (!visible) return null;

  if (isTouchLayout) {
    return (
      <div
        data-presentation-top-bar="true"
        className="sticky top-0 z-[120] my-3 flex shrink-0 flex-col gap-3 neuphormism-b px-4 py-3"
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-[1.6rem] font-bold leading-[1.7rem] text-black"
              title={songFromURL}
            >
              {songFromURL}
            </h1>
            <h2
              className="truncate text-[1.1rem] font-bold leading-[1.25rem] text-black/80"
              title={artistFromURL}
            >
              {artistFromURL}
            </h2>
          </div>
          <button
            type="button"
            className={`neuphormism-b-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] font-bold text-black ${
              toolBoxBtnStatus ||
              isEditing ||
              (!toolBoxBtnStatus && (isVideoModalOpen || isTouchVideoActive))
                ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite]"
                : ""
            }`}
            onClick={onToggleToolBox}
            aria-label="Options"
            title="Open presentation options"
          >
            <FaGear className="h-[1.38rem] w-[1.38rem]" />
            <span className="sr-only">Options</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 opacity-85">
          <button
            type="button"
            disabled={!previousSetlistSong}
            className="neuphormism-b-btn h-9 px-3 text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => onGoToSetlistSong(previousSetlistSong)}
            aria-label="Previous song in selected setlist"
          >
            &lt;&lt;
          </button>
          <button
            type="button"
            disabled={!nextSetlistSong}
            className="neuphormism-b-btn h-9 px-3 text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => onGoToSetlistSong(nextSetlistSong)}
            aria-label="Next song in selected setlist"
          >
            &gt;&gt;
          </button>
        </div>

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
      </div>
    );
  }

  return (
    <div
      data-presentation-top-bar="true"
      className="sticky top-0 z-[120] my-5 flex min-h-[7.25rem] shrink-0 flex-col items-stretch justify-between gap-4 neuphormism-b px-10 pb-4 pt-8 xl:flex-row xl:items-center"
    >
      <div className="pointer-events-none absolute left-10 right-10 top-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
        <span>Presentation</span>
        <span>{activeLayoutLabel}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h1
          className="font-bold text-black text-[2.45rem] leading-[1.02]"
          title={songFromURL}
        >
          {songFromURL}
        </h1>
        <h1
          className="font-bold text-black text-[2rem] leading-[1.02]"
          title={artistFromURL}
        >
          {artistFromURL}
        </h1>
      </div>
      <div className="flex w-full flex-col items-stretch gap-3 pt-2 xl:w-auto">
        <div className="flex flex-col gap-2">
          <div className="order-2 mt-3 grid grid-cols-2 gap-2 opacity-80">
            <button
              type="button"
              disabled={!previousSetlistSong}
              className="neuphormism-b-btn px-3 py-1.5 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
              onClick={() => onGoToSetlistSong(previousSetlistSong)}
              aria-label="Previous song in selected setlist"
            >
              &lt;&lt;
            </button>
            <button
              type="button"
              disabled={!nextSetlistSong}
              className="neuphormism-b-btn px-3 py-1.5 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
              onClick={() => onGoToSetlistSong(nextSetlistSong)}
              aria-label="Next song in selected setlist"
            >
              &gt;&gt;
            </button>
          </div>
          <div className="order-1 flex flex-col items-stretch gap-2">
            <div className="flex flex-row flex-wrap items-stretch justify-end gap-3">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-black ${
                  isEditing
                    ? "neuphormism-b-btn-gold bg-[goldenrod] shadow-[0_10px_24px_rgba(218,165,32,0.35)]"
                    : "neuphormism-b-btn"
                }`}
                onClick={openEditorToolBox}
                aria-label={isEditing ? "Close cifra editor" : "Open cifra editor"}
                title={isEditing ? "Close cifra editor" : "Open cifra editor"}
                aria-pressed={isEditing ? "true" : "false"}
              >
                <FaFilePen className="h-5 w-5" />
                <span className="sr-only">Editor</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black px-4 py-3 text-sm"
                onClick={onOpenTranspose}
                aria-label="Transpose"
                title="Transpose"
              >
                <span className="relative flex h-6 w-7 items-center justify-center text-[0.65rem] font-black leading-none">
                  <span>TOM</span>
                  <span className="absolute -right-0.5 -top-1 text-[0.55rem] leading-none">+</span>
                  <span className="absolute -bottom-1 -left-0.5 text-[0.7rem] leading-none">-</span>
                </span>
                <span className="sr-only">Transpose</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black px-4 py-3 text-sm"
                onClick={onOpenNotes}
                aria-label="Notes"
                title="Notes"
              >
                <IoDocumentText className="h-5 w-5" />
                <span className="sr-only">Notes</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black px-4 py-3 text-sm"
                onClick={onOpenInstruments}
                aria-label="Instruments"
                title="Instruments"
              >
                <GiGuitar className="h-5 w-5" />
                <span className="sr-only">Instruments</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold ${
                  hasVideos
                    ? "text-black"
                    : "cursor-not-allowed text-gray-400 opacity-60"
                } px-4 py-3 text-sm`}
                onClick={onOpenVideos}
                disabled={!hasVideos}
                aria-label="Videos"
                title={hasVideos ? "Videos" : "No videos available"}
              >
                <IoVideocam className="h-5 w-5" />
                <span className="sr-only">Videos</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold ${
                  isScrollingAvailable
                    ? "text-black"
                    : "cursor-not-allowed text-gray-400 opacity-60"
                } px-4 py-3 text-sm`}
                onClick={onOpenScrolling}
                disabled={!isScrollingAvailable}
                aria-label="Scrolling"
                title={
                  isScrollingAvailable
                    ? "Scrolling"
                    : "Scrolling is unavailable in expanded layout"
                }
              >
                <IoArrowDownCircle className="h-5 w-5" />
                <span className="sr-only">Scrolling</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black px-4 py-3 text-sm"
                onClick={onToggleExpanded}
                aria-label={isExpandedCifra ? "Disable expanded layout" : "Enable expanded layout"}
                title={isExpandedCifra ? "Disable expanded layout" : "Enable expanded layout"}
              >
                {isExpandedCifra ? (
                  <FaDownLeftAndUpRightToCenter className="h-5 w-5" />
                ) : (
                  <FaUpRightAndDownLeftFromCenter className="h-5 w-5" />
                )}
                <span className="sr-only">Expanded layout</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black px-4 py-3 text-sm"
                onClick={onGoToEditSong}
                aria-label="Song settings"
                title="Open song settings"
              >
                <FaGear className="h-5 w-5" />
                <span className="sr-only">Song Settings</span>
              </button>
              {instrumentSelected !== "voice" ? (
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold ${
                    canOpenGuitarPro
                      ? "text-black"
                      : "cursor-not-allowed text-gray-400 opacity-60"
                  } px-4 py-3 text-sm`}
                  onClick={onOpenGuitarProViewer}
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
                className="neuphormism-b-btn-gold flex min-w-[6.5rem] items-center justify-center px-6 py-3 text-base font-bold text-black"
                onClick={onEnterLiveMode}
              >
                LIVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresentationTopBar;
