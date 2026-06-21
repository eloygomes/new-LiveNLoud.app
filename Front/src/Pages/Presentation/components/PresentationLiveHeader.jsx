import { useState } from "react";
import {
  IoChatbubbleOutline,
  IoChevronBack,
  IoChevronDown,
  IoChevronUp,
  IoClose,
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoListOutline,
  IoPaperPlaneOutline,
  IoRadio,
  IoRepeatOutline,
} from "react-icons/io5";

function PresentationLiveHeader({
  effectiveLiveMode,
  isTouchLayout,
  songFromURL,
  artistFromURL,
  previousSetlistSong,
  nextSetlistSong,
  setlistSongs = [],
  liveCifraZoomLabel,
  blockSpacingLabel,
  onDecreaseZoom,
  onIncreaseZoom,
  onDecreaseSpacing,
  onIncreaseSpacing,
  onGoToSetlistSong = () => {},
  onExit,
}) {
  const [setlistOpen, setSetlistOpen] = useState(false);

  if (!effectiveLiveMode) return null;

  const normalizedCurrentArtist = String(artistFromURL || "")
    .trim()
    .toLowerCase();
  const normalizedCurrentSong = String(songFromURL || "").trim().toLowerCase();
  const hasSetlistSongs = setlistSongs.length > 0;

  const handleSelectSetlistSong = (song) => {
    onGoToSetlistSong(song);
    setSetlistOpen(false);
  };

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
              onClick={() => setSetlistOpen(true)}
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
            onClick={() => setSetlistOpen(true)}
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

        {setlistOpen ? (
          <div className="presentation-live-setlist-panel" role="dialog" aria-modal="true" aria-label="Live setlist">
            <div className="presentation-live-setlist-backdrop" onClick={() => setSetlistOpen(false)} />
            <div className="presentation-live-setlist-sheet">
              <div className="presentation-live-setlist-header">
                <div>
                  <div className="presentation-live-setlist-eyebrow">LIVE</div>
                  <div className="presentation-live-setlist-title">Setlist</div>
                </div>
                <button
                  type="button"
                  className="presentation-live-reels-icon-button"
                  onClick={() => setSetlistOpen(false)}
                  aria-label="Close live setlist"
                >
                  <IoClose aria-hidden="true" />
                </button>
              </div>

              <div className="presentation-live-setlist-list">
                {hasSetlistSongs ? (
                  setlistSongs.map((song, index) => {
                    const itemArtist = String(song?.artist || "").trim();
                    const itemSong = String(song?.song || "").trim();
                    const isCurrent =
                      itemArtist.toLowerCase() === normalizedCurrentArtist &&
                      itemSong.toLowerCase() === normalizedCurrentSong;

                    return (
                      <button
                        type="button"
                        key={`${itemArtist}-${itemSong}-${index}`}
                        className={`presentation-live-setlist-item ${
                          isCurrent ? "presentation-live-setlist-item-active" : ""
                        }`}
                        onClick={() => handleSelectSetlistSong(song)}
                        aria-current={isCurrent ? "true" : undefined}
                      >
                        <span className="presentation-live-setlist-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="presentation-live-setlist-copy">
                          <span className="presentation-live-setlist-song">
                            {itemSong || "Untitled"}
                          </span>
                          <span className="presentation-live-setlist-artist">
                            {itemArtist || "Unknown artist"}
                          </span>
                        </span>
                        {isCurrent ? (
                          <span className="presentation-live-setlist-now">
                            Live
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="presentation-live-setlist-empty">
                    No songs in this setlist.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
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
            className="presentation-live-desktop-button"
            onClick={() => setSetlistOpen((value) => !value)}
            aria-label="Open live setlist"
          >
            Setlist
          </button>
          <button
            type="button"
            className="presentation-live-desktop-button"
            disabled={!previousSetlistSong}
            onClick={() => onGoToSetlistSong(previousSetlistSong)}
            aria-label="Previous song in selected setlist"
          >
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
          </button>
          <button
            type="button"
            className="presentation-live-desktop-button"
            onClick={onExit}
            aria-label="Close live mode"
          >
            <IoClose className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>
      {setlistOpen ? (
        <div className="presentation-live-setlist-panel presentation-live-setlist-panel-desktop" role="dialog" aria-modal="true" aria-label="Live setlist">
          <div className="presentation-live-setlist-backdrop" onClick={() => setSetlistOpen(false)} />
          <div className="presentation-live-setlist-sheet">
            <div className="presentation-live-setlist-header">
              <div>
                <div className="presentation-live-setlist-eyebrow">LIVE</div>
                <div className="presentation-live-setlist-title">Setlist</div>
              </div>
              <button
                type="button"
                className="presentation-live-reels-icon-button"
                onClick={() => setSetlistOpen(false)}
                aria-label="Close live setlist"
              >
                <IoClose aria-hidden="true" />
              </button>
            </div>
            <div className="presentation-live-setlist-list">
              {hasSetlistSongs ? (
                setlistSongs.map((song, index) => {
                  const itemArtist = String(song?.artist || "").trim();
                  const itemSong = String(song?.song || "").trim();
                  const isCurrent =
                    itemArtist.toLowerCase() === normalizedCurrentArtist &&
                    itemSong.toLowerCase() === normalizedCurrentSong;

                  return (
                    <button
                      type="button"
                      key={`${itemArtist}-${itemSong}-${index}`}
                      className={`presentation-live-setlist-item ${
                        isCurrent ? "presentation-live-setlist-item-active" : ""
                      }`}
                      onClick={() => handleSelectSetlistSong(song)}
                      aria-current={isCurrent ? "true" : undefined}
                    >
                      <span className="presentation-live-setlist-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="presentation-live-setlist-copy">
                        <span className="presentation-live-setlist-song">
                          {itemSong || "Untitled"}
                        </span>
                        <span className="presentation-live-setlist-artist">
                          {itemArtist || "Unknown artist"}
                        </span>
                      </span>
                      {isCurrent ? (
                        <span className="presentation-live-setlist-now">Live</span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="presentation-live-setlist-empty">
                  No songs in this setlist.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PresentationLiveHeader;
