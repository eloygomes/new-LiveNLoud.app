import {
  FaDownLeftAndUpRightToCenter,
  FaFilePen,
  FaGear,
  FaSliders,
  FaUpRightAndDownLeftFromCenter,
} from "react-icons/fa6";
import GuitarProIcon from "../../../components/GuitarPro/GuitarProIcon";
import ToolBoxYT from "../ToolBoxYT";

function PresentationTopBar({
  visible,
  isTouchLayout,
  isTouchVideoActive,
  touchVideoLink,
  songFromURL,
  artistFromURL,
  activeLayoutLabel,
  previousSetlistSong,
  nextSetlistSong,
  getMobileTitleSizeClass,
  toolBoxBtnStatus,
  isEditing,
  isVideoModalOpen,
  openEditorToolBox,
  onToggleToolBox,
  onOpenTouchVideoMenu,
  isExpandedCifra,
  onToggleExpanded,
  onGoToEditSong,
  instrumentSelected,
  canOpenGuitarPro,
  onOpenGuitarProViewer,
  onEnterLiveMode,
  onGoToSetlistSong,
  onTouchVideoLinkChange,
  onTouchVideoActiveChange,
  onVideoModalChange,
}) {
  if (!visible) return null;

  return (
    <div
      className={`relative my-5 flex shrink-0 justify-between neuphormism-b ${
        isTouchLayout
          ? "items-stretch gap-3 px-4 py-3"
          : "min-h-[7.25rem] flex-row items-center px-10 pb-4 pt-8"
      }`}
    >
      {!isTouchLayout ? (
        <div className="pointer-events-none absolute left-10 right-10 top-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
          <span>Presentation</span>
          <span>{activeLayoutLabel}</span>
        </div>
      ) : null}
      <div className={`flex min-w-0 flex-1 flex-col ${isTouchLayout ? "pr-1" : ""}`}>
        {isTouchLayout && isTouchVideoActive ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
                  Video Active
                </div>
                <div className="truncate text-[1rem] font-bold leading-[1.15rem] text-black/70">
                  {songFromURL} • {artistFromURL}
                </div>
              </div>
            </div>
            <ToolBoxYT
              linktoplay={touchVideoLink}
              setVideoModalStatus={onTouchVideoActiveChange}
              setLinktoplay={onTouchVideoLinkChange}
              isTouchLayout
              onVideoModalChange={onVideoModalChange}
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
                  : "text-[2.45rem] leading-[1.02]"
              }`}
              title={songFromURL}
            >
              {songFromURL}
            </h1>
            <h1
              className={`font-bold text-black ${
                isTouchLayout
                  ? `${getMobileTitleSizeClass(artistFromURL, "artist")} truncate`
                  : "text-[2rem] leading-[1.02]"
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
              className="neuphormism-b-btn px-3 py-1.5 text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
              onClick={() => onGoToSetlistSong(previousSetlistSong)}
              aria-label="Previous song in selected setlist"
            >
              &lt;&lt;
            </button>
            <button
              type="button"
              disabled={!nextSetlistSong}
              className="neuphormism-b-btn px-3 py-1.5 text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
              onClick={() => onGoToSetlistSong(nextSetlistSong)}
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
            : "items-stretch gap-3 pt-2"
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
                : "order-2 mt-3 grid grid-cols-2 gap-2 opacity-80"
            }
          >
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
          <div
            className={
              isTouchLayout
                ? "flex shrink-0 flex-col items-stretch justify-end gap-2"
                : "order-1 flex flex-col items-stretch gap-2"
            }
          >
            <div
              className={
                isTouchLayout
                  ? "flex shrink-0 flex-col items-stretch justify-end gap-2"
                  : "flex flex-row items-stretch gap-3"
              }
            >
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black ${
                  isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"
                }`}
                onClick={openEditorToolBox}
                aria-label="Open cifra editor"
                title="Open cifra editor"
              >
                <FaFilePen className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"} />
                <span className="sr-only">Editor</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black ${
                  toolBoxBtnStatus ||
                  isEditing ||
                  (isTouchLayout &&
                    !toolBoxBtnStatus &&
                    (isVideoModalOpen || isTouchVideoActive))
                    ? "animate-[mobile-gear-blink_1.2s_ease-in-out_infinite]"
                    : ""
                } ${isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"}`}
                onClick={isTouchLayout && isTouchVideoActive ? onOpenTouchVideoMenu : onToggleToolBox}
                aria-label="Options"
                title="Open presentation options"
              >
                <FaGear className={isTouchLayout ? "h-4 w-4" : "h-6 w-6"} />
                <span className="sr-only">Options</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black ${
                  isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"
                }`}
                onClick={onToggleExpanded}
                aria-label={isExpandedCifra ? "Disable expanded layout" : "Enable expanded layout"}
                title={isExpandedCifra ? "Disable expanded layout" : "Enable expanded layout"}
              >
                {isExpandedCifra ? (
                  <FaDownLeftAndUpRightToCenter className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"} />
                ) : (
                  <FaUpRightAndDownLeftFromCenter className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"} />
                )}
                <span className="sr-only">Expanded layout</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold text-black ${
                  isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"
                }`}
                onClick={onGoToEditSong}
                aria-label="Song settings"
                title="Open song settings"
              >
                <FaSliders className={isTouchLayout ? "h-4 w-4" : "h-5 w-5"} />
                <span className="sr-only">Song Settings</span>
              </button>
              {instrumentSelected !== "voice" ? (
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 neuphormism-b-btn font-bold ${
                    canOpenGuitarPro
                      ? "text-black"
                      : "cursor-not-allowed text-gray-400 opacity-60"
                  } ${isTouchLayout ? "h-10 w-16 p-0 text-xs" : "px-4 py-3 text-sm"}`}
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
                className={`neuphormism-b-btn-gold flex items-center justify-center font-bold text-black ${
                  isTouchLayout
                    ? "h-10 w-16 px-3 text-xs tracking-[0.08em]"
                    : "min-w-[6.5rem] px-6 py-3 text-base"
                }`}
                onClick={onEnterLiveMode}
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
  );
}

export default PresentationTopBar;
