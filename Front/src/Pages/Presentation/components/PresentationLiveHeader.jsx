import { IoClose } from "react-icons/io5";

function PresentationLiveHeader({
  effectiveLiveMode,
  isTouchLayout,
  songFromURL,
  artistFromURL,
  liveCifraZoomLabel,
  blockSpacingLabel,
  onDecreaseZoom,
  onIncreaseZoom,
  onDecreaseSpacing,
  onIncreaseSpacing,
  onExit,
}) {
  if (!effectiveLiveMode) return null;

  return (
    <div className={isTouchLayout ? "px-3 pb-1 pt-2" : "px-8 pb-2 pt-6"}>
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
                ? "mt-0.5 text-[0.82rem] font-bold leading-[0.92rem] text-[goldenrod]"
                : "truncate text-xl font-bold leading-tight text-[goldenrod]"
            }
          >
            {artistFromURL}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="presentation-live-header-controls">
            <div
              className={`presentation-live-step-control ${
                isTouchLayout ? "presentation-live-step-control-touch" : ""
              }`}
              role="group"
              aria-label="Live cifra zoom"
            >
              <span className="presentation-live-step-label">Zoom</span>
              <button
                type="button"
                onClick={onDecreaseZoom}
                aria-label="Decrease live cifra zoom"
              >
                -
              </button>
              <span>{liveCifraZoomLabel}</span>
              <button
                type="button"
                onClick={onIncreaseZoom}
                aria-label="Increase live cifra zoom"
              >
                +
              </button>
            </div>
            <div
              className={`presentation-live-step-control ${
                isTouchLayout ? "presentation-live-step-control-touch" : ""
              }`}
              role="group"
              aria-label="Live block spacing"
            >
              <span className="presentation-live-step-label">Spacing</span>
              <button
                type="button"
                onClick={onDecreaseSpacing}
                aria-label="Decrease live block spacing"
              >
                -
              </button>
              <span>{blockSpacingLabel}</span>
              <button
                type="button"
                onClick={onIncreaseSpacing}
                aria-label="Increase live block spacing"
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            className={`flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/8 font-black uppercase tracking-[0.1em] text-white ${
              isTouchLayout ? "px-2.5 py-1.5 text-[10px]" : "px-4 py-2 text-xs"
            }`}
            onClick={onExit}
          >
            <IoClose className={isTouchLayout ? "h-3.5 w-3.5" : "h-4 w-4"} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PresentationLiveHeader;
