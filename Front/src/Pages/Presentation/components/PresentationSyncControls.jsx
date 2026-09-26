import {
  FaArrowPointer,
  FaClockRotateLeft,
  FaCircleQuestion,
  FaForwardStep,
  FaPause,
  FaPlay,
  FaRepeat,
  FaRotateLeft,
  FaRotateRight,
  FaVideo,
} from "react-icons/fa6";
import { useState } from "react";
import { formatSyncTime } from "../sync/youtubeUrl";

function PresentationSyncControls({
  activePoint,
  canSync,
  compact = false,
  currentTime,
  enabled,
  isLandscapeBlocked,
  isPlaying,
  loopBounds,
  loopMode,
  navigationMode,
  offset,
  onAdjustOffset,
  onSeekAdjacent,
  onSeekRelative,
  onToggleEnabled,
  onToggleLoopMode,
  onToggleNavigationMode,
  onTogglePlayback,
  playerDisplayMode,
  playerHostRef,
  setPlayerDisplayMode,
  syncPoints,
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  if (!canSync) return null;

  return (
    <div
      className={`presentation-sync-panel neuphormism-b ${
        compact ? "presentation-sync-panel-compact" : ""
      }`}
    >
      <div
        className={`presentation-sync-player ${
          playerDisplayMode === "compact" ? "presentation-sync-player-minimized" : ""
        }`}
        aria-hidden={!enabled || playerDisplayMode === "compact"}
      >
        <div ref={playerHostRef} className="h-full w-full bg-black" />
      </div>

      <div className="presentation-sync-main">
        <div>
          <div className="presentation-sync-eyebrow">Sync Presentation</div>
          <div className="presentation-sync-status">
            {enabled ? "Sync ON" : "Sync OFF"}
            <span>{syncPoints.length} marcas</span>
            {activePoint ? <span>{formatSyncTime(activePoint.time)}</span> : null}
          </div>
        </div>

        <div className="presentation-sync-actions">
          <button
            type="button"
            className={`presentation-sync-button ${
              enabled ? "presentation-sync-button-active" : ""
            }`}
            onClick={onToggleEnabled}
          >
            <FaClockRotateLeft className="h-4 w-4" />
            {enabled ? "Sync ON" : "Sync OFF"}
          </button>
          <button
            type="button"
            className={`presentation-sync-button ${
              navigationMode ? "presentation-sync-button-active" : ""
            }`}
            onClick={onToggleNavigationMode}
            disabled={!enabled}
          >
            <FaArrowPointer className="h-4 w-4" />
            Navigation
          </button>
          <button
            type="button"
            className={`presentation-sync-button ${
              loopMode ? "presentation-sync-button-active" : ""
            }`}
            onClick={onToggleLoopMode}
            disabled={!enabled}
          >
            <FaRepeat className="h-4 w-4" />
            Loop
          </button>
          <button
            type="button"
            className={`presentation-sync-button ${
              playerDisplayMode === "video" ? "presentation-sync-button-active" : ""
            }`}
            onClick={() =>
              setPlayerDisplayMode(
                playerDisplayMode === "video" ? "compact" : "video",
              )
            }
            disabled={!enabled}
          >
            <FaVideo className="h-4 w-4" />
            {playerDisplayMode === "video" ? "Video" : "Compact"}
          </button>
          <button
            type="button"
            className="presentation-sync-button presentation-sync-help-button"
            onClick={() => setShortcutsOpen(true)}
          >
            <FaCircleQuestion className="h-4 w-4" />
          </button>
        </div>

        <div className="presentation-sync-practice">
          <div className="presentation-sync-practice-title">Practice Mode</div>
          <div className="presentation-sync-practice-buttons">
            <button type="button" onClick={() => onSeekAdjacent(-1)} disabled={!enabled}>
              <FaForwardStep className="h-4 w-4 rotate-180" />
            </button>
            <button type="button" onClick={onTogglePlayback} disabled={!enabled}>
              {isPlaying ? (
                <FaPause className="h-4 w-4" />
              ) : (
                <FaPlay className="h-4 w-4" />
              )}
            </button>
            <button type="button" onClick={() => onSeekAdjacent(1)} disabled={!enabled}>
              <FaForwardStep className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onSeekRelative(-5)} disabled={!enabled}>
              <FaRotateLeft className="h-4 w-4" />
              5s
            </button>
            <button type="button" onClick={() => onSeekRelative(5)} disabled={!enabled}>
              5s
              <FaRotateRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="presentation-sync-meta">
        <div>
          <span>Tempo</span>
          <strong>{formatSyncTime(currentTime)}</strong>
        </div>
        <div>
          <span>Offset</span>
          <strong>{offset > 0 ? "+" : ""}{offset.toFixed(1)}s</strong>
        </div>
        <div>
          <span>Loop</span>
          <strong>
            {loopBounds
              ? `${formatSyncTime(loopBounds.start)} - ${formatSyncTime(
                  loopBounds.end,
                )}`
              : "--"}
          </strong>
        </div>
        <div className="presentation-sync-offset-controls">
          <button type="button" onClick={() => onAdjustOffset(-0.5)}>
            -0.5s
          </button>
          <button type="button" onClick={() => onAdjustOffset(0.5)}>
            +0.5s
          </button>
        </div>
      </div>

      {isLandscapeBlocked ? (
        <div className="presentation-sync-warning">
          Sync visual pausado em landscape. Volte para portrait para retomar.
        </div>
      ) : null}

      {shortcutsOpen ? (
        <div
          className="presentation-sync-shortcuts-backdrop"
          role="presentation"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="presentation-sync-shortcuts-modal neuphormism-b"
            role="dialog"
            aria-modal="true"
            aria-label="Atalhos do Sync Presentation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="presentation-sync-shortcuts-header">
              <div>
                <div className="presentation-sync-eyebrow">Atalhos</div>
                <h2>Sync Presentation</h2>
              </div>
              <button type="button" onClick={() => setShortcutsOpen(false)}>
                Fechar
              </button>
            </div>
            <dl>
              <div><dt>Sync ON/OFF</dt><dd>Shift + S</dd></div>
              <div><dt>Play/Pause</dt><dd>Shift + Space</dd></div>
              <div><dt>Bloco anterior</dt><dd>Shift + ←</dd></div>
              <div><dt>Proximo bloco</dt><dd>Shift + →</dd></div>
              <div><dt>Voltar 5s</dt><dd>Shift + ↓</dd></div>
              <div><dt>Avancar 5s</dt><dd>Shift + ↑</dd></div>
              <div><dt>Loop ON/OFF</dt><dd>Shift + L</dd></div>
              <div><dt>Navigation Mode</dt><dd>Shift + N</dd></div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PresentationSyncControls;
