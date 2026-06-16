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

  if (isTouchLayout) {
    return (
      <div className="px-3 pb-1 pt-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-white/10 bg-black pb-3">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
              # sustenido live
            </div>
            <div
              className="mt-1 truncate text-[1.02rem] font-bold leading-[1.05rem] text-white"
              title={songFromURL}
            >
              {songFromURL}
            </div>
            <div
              className="mt-0.5 truncate text-[0.82rem] font-bold leading-[0.92rem] text-[goldenrod]"
              title={artistFromURL}
            >
              {artistFromURL}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 font-bold uppercase tracking-[0.1em] text-white"
              onClick={onExit}
              aria-label="Close live mode"
            >
              <IoClose className="h-3.5 w-3.5" />
            </button>
            <div
              className="presentation-live-step-control presentation-live-step-control-touch"
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-2 pt-6">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-black pb-3">
        <div className="min-w-0">
          <div className="truncate text-3xl font-bold leading-tight text-white">
            {songFromURL}
          </div>
          <div className="truncate text-xl font-bold leading-tight text-[goldenrod]">
            {artistFromURL}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="presentation-live-header-controls">
            <div
              className="presentation-live-step-control"
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
              className="presentation-live-step-control"
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
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white"
            onClick={onExit}
            aria-label="Close live mode"
          >
            <IoClose className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PresentationLiveHeader;
