import {
  IoChatbubbleOutline,
  IoAdd,
  IoChevronBack,
  IoChevronDown,
  IoChevronForward,
  IoChevronUp,
  IoClose,
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoListOutline,
  IoRemove,
  IoPaperPlaneOutline,
  IoRadio,
  IoRepeatOutline,
  IoResizeOutline,
  IoSearchOutline,
} from "react-icons/io5";

function PresentationLiveHeader({
  effectiveLiveMode,
  isTouchLayout,
  songFromURL,
  artistFromURL,
  previousSetlistSong,
  nextSetlistSong,
  liveView = "cifra",
  liveCifraZoomLabel,
  blockSpacingLabel,
  onDecreaseZoom,
  onIncreaseZoom,
  onDecreaseSpacing,
  onIncreaseSpacing,
  onOpenSetlist = () => {},
  onCloseSetlist = () => {},
  onGoToSetlistSong = () => {},
  onExit,
}) {
  if (!effectiveLiveMode) return null;
  const showSetlistView = liveView === "setlist";
  const handleSetlistButtonClick = showSetlistView
    ? onCloseSetlist
    : onOpenSetlist;

  if (isTouchLayout) {
    return (
      <div className="presentation-live-reels-overlay" aria-label="Live controls">
        <div className="presentation-live-reels-top">
          <button
            type="button"
            className="presentation-live-reels-icon-button"
            onClick={onExit}
            aria-label="Close live mode"
          >
            <IoChevronBack aria-hidden="true" />
          </button>

          <div className="presentation-live-reels-tabs">
            <span>LIVE</span>
            <button
              type="button"
              className="presentation-live-reels-setlist-tab"
              onClick={handleSetlistButtonClick}
              aria-label="Open live setlist"
            >
              Setlist
            </button>
          </div>

          <div className="presentation-live-reels-friends" aria-hidden="true">
            <span>{(artistFromURL || "?").slice(0, 1).toUpperCase()}</span>
            <span>{(songFromURL || "?").slice(0, 1).toUpperCase()}</span>
            <span>
              <IoRadio aria-hidden="true" />
            </span>
          </div>

          <button
            type="button"
            className="presentation-live-reels-icon-button"
            onClick={onExit}
            aria-label="Close live mode"
          >
            <IoClose aria-hidden="true" />
          </button>
        </div>

        <div className="presentation-live-reels-actions">
          <button
            type="button"
            className="presentation-live-reels-action"
            disabled={!previousSetlistSong}
            onClick={() => onGoToSetlistSong(previousSetlistSong)}
            aria-label="Previous song in selected setlist"
          >
            <IoChevronUp aria-hidden="true" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            className="presentation-live-reels-action"
            aria-label="Like live song"
          >
            <IoHeartOutline aria-hidden="true" />
            <span>391</span>
          </button>
          <button
            type="button"
            className="presentation-live-reels-action"
            aria-label="Comment on live song"
          >
            <IoChatbubbleOutline aria-hidden="true" />
            <span>53</span>
          </button>
          <button
            type="button"
            className="presentation-live-reels-action"
            aria-label="Repeat live song"
          >
            <IoRepeatOutline aria-hidden="true" />
            <span>10</span>
          </button>
          <button
            type="button"
            className="presentation-live-reels-action"
            onClick={handleSetlistButtonClick}
            aria-label="Open live setlist"
          >
            <IoListOutline aria-hidden="true" />
            <span>Setlist</span>
          </button>
          <button
            type="button"
            className="presentation-live-reels-action"
            disabled={!nextSetlistSong}
            onClick={() => onGoToSetlistSong(nextSetlistSong)}
            aria-label="Next song in selected setlist"
          >
            <IoChevronDown aria-hidden="true" />
            <span>Next</span>
          </button>
          <button
            type="button"
            className="presentation-live-reels-action"
            aria-label="Share live song"
          >
            <IoPaperPlaneOutline aria-hidden="true" />
            <span>261</span>
          </button>
          <div className="presentation-live-reels-more" aria-hidden="true">
            <IoEllipsisHorizontal />
          </div>
        </div>

        <div className="presentation-live-reels-bottom">
          <div className="presentation-live-reels-meta">
            <div className="presentation-live-reels-avatar" aria-hidden="true">
              {(artistFromURL || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="presentation-live-reels-title" title={songFromURL}>
                {songFromURL}
              </div>
              <div className="presentation-live-reels-artist" title={artistFromURL}>
                {artistFromURL}
              </div>
            </div>
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
          <div className="presentation-live-reels-caption">
            {songFromURL} - {artistFromURL}
          </div>
          <div className="presentation-live-reels-comment" aria-hidden="true">
            Add comment...
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="presentation-live-desktop-header">
      <div className="presentation-live-desktop-bar">
        <div className="presentation-live-desktop-title">
          <div className="presentation-live-desktop-song" title={songFromURL}>
            {songFromURL}
          </div>
          <div className="presentation-live-desktop-artist" title={artistFromURL}>
            {artistFromURL}
          </div>
        </div>
        <div className="presentation-live-desktop-actions">
          <div className="presentation-live-header-controls">
            <div
              className="presentation-live-step-control"
              role="group"
              aria-label="Live cifra zoom"
            >
              <span className="presentation-live-step-label">
                <IoSearchOutline aria-hidden="true" />
                Zoom
              </span>
              <button
                type="button"
                onClick={onDecreaseZoom}
                aria-label="Decrease live cifra zoom"
              >
                <IoRemove aria-hidden="true" />
              </button>
              <span>{liveCifraZoomLabel}</span>
              <button
                type="button"
                onClick={onIncreaseZoom}
                aria-label="Increase live cifra zoom"
              >
                <IoAdd aria-hidden="true" />
              </button>
            </div>
            <div
              className="presentation-live-step-control"
              role="group"
              aria-label="Live block spacing"
            >
              <span className="presentation-live-step-label">
                <IoResizeOutline aria-hidden="true" />
                Spacing
              </span>
              <button
                type="button"
                onClick={onDecreaseSpacing}
                aria-label="Decrease live block spacing"
              >
                <IoRemove aria-hidden="true" />
              </button>
              <span>{blockSpacingLabel}</span>
              <button
                type="button"
                onClick={onIncreaseSpacing}
                aria-label="Increase live block spacing"
              >
                <IoAdd aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="presentation-live-desktop-button-group">
            <button
              type="button"
              className="presentation-live-desktop-button presentation-live-desktop-button-primary"
              onClick={handleSetlistButtonClick}
              aria-label="Open live setlist"
            >
              <IoListOutline aria-hidden="true" />
              Setlist
            </button>
            <button
              type="button"
              className="presentation-live-desktop-button"
              disabled={!previousSetlistSong}
              onClick={() => onGoToSetlistSong(previousSetlistSong)}
              aria-label="Previous song in selected setlist"
            >
              <IoChevronBack aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              className="presentation-live-desktop-button"
              disabled={!nextSetlistSong}
              onClick={() => onGoToSetlistSong(nextSetlistSong)}
              aria-label="Next song in selected setlist"
            >
              Next
              <IoChevronForward aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="presentation-live-desktop-button presentation-live-desktop-button-close"
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
