import {
  IoAdd,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoListOutline,
  IoRemove,
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
      <>
        <header
          className="presentation-live-mobile-header"
          aria-label="Live controls"
          data-presentation-live-header="mobile"
        >
          <div className="presentation-live-mobile-title-row">
            <div className="presentation-live-mobile-title">
              <div className="presentation-live-mobile-song" title={songFromURL}>
                {songFromURL}
              </div>
              <div
                className="presentation-live-mobile-artist"
                title={artistFromURL}
              >
                {artistFromURL}
              </div>
            </div>
            <button
              type="button"
              className="presentation-live-mobile-close"
              onClick={onExit}
              aria-label="Close live mode"
            >
              <IoClose aria-hidden="true" />
            </button>
          </div>

          <div
            className="presentation-live-mobile-toolbar"
            data-presentation-live-actions
          >
            <div
              className="presentation-live-mobile-step-control"
              role="group"
              aria-label="Live cifra zoom"
            >
              <span className="presentation-live-mobile-step-label">
                <IoSearchOutline aria-hidden="true" />
                Zoom
              </span>
              <div className="presentation-live-mobile-step-actions">
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
            </div>

            <div
              className="presentation-live-mobile-step-control"
              role="group"
              aria-label="Live block spacing"
            >
              <span className="presentation-live-mobile-step-label">
                <IoResizeOutline aria-hidden="true" />
                Spacing
              </span>
              <div className="presentation-live-mobile-step-actions">
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

            <button
              type="button"
              className={`presentation-live-mobile-setlist ${
                showSetlistView ? "presentation-live-mobile-setlist-active" : ""
              }`}
              onClick={handleSetlistButtonClick}
              aria-label={
                showSetlistView ? "Back to live cifra" : "Open live setlist"
              }
            >
              <IoListOutline aria-hidden="true" />
              <span>{showSetlistView ? "Cifra" : "Setlist"}</span>
            </button>
          </div>
        </header>

        <nav
          className="presentation-live-mobile-navigation"
          aria-label="Live song navigation"
        >
          <button
            type="button"
            disabled={!previousSetlistSong}
            onClick={() => onGoToSetlistSong(previousSetlistSong)}
            aria-label="Previous song in selected setlist"
          >
            <IoChevronBack aria-hidden="true" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            disabled={!nextSetlistSong}
            onClick={() => onGoToSetlistSong(nextSetlistSong)}
            aria-label="Next song in selected setlist"
          >
            <span>Next</span>
            <IoChevronForward aria-hidden="true" />
          </button>
        </nav>
      </>
    );
  }

  return (
    <div
      className="presentation-live-desktop-header"
      data-presentation-live-header="desktop"
    >
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
