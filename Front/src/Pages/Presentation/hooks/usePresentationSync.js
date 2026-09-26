import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizePlaybackSync } from "../sync/syncBlockModel";
import {
  getActiveSyncPoint,
  getLoopBounds,
  getNextSyncPoint,
  getPreviousSyncPoint,
  getSortedSyncPoints,
  getSyncProgress,
} from "../sync/syncEngine";

const SYNC_OFFSET_STORAGE_KEY = "presentation-sync:user-offset-seconds";
const SYNC_PLAYER_DISPLAY_STORAGE_KEY = "presentation-sync:player-display-mode";

function getStoredOffset() {
  if (typeof window === "undefined") return 0;

  const value = Number(window.localStorage.getItem(SYNC_OFFSET_STORAGE_KEY));
  return Number.isFinite(value) ? value : 0;
}

function getStoredPlayerDisplayMode() {
  if (typeof window === "undefined") return "video";

  const value = window.localStorage.getItem(SYNC_PLAYER_DISPLAY_STORAGE_KEY);
  return value === "compact" ? "compact" : "video";
}

function getSafeSelectorForSyncBlock(syncBlockId) {
  return `[data-sync-block-id="${String(syncBlockId || "").replace(/"/g, '\\"')}"]`;
}

function isTouchLandscape() {
  if (typeof window === "undefined") return false;

  return window.innerWidth > window.innerHeight;
}

function getElementTopInsideViewport(element, viewport) {
  const elementRect = element.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  return elementRect.top - viewportRect.top + viewport.scrollTop;
}

function isTypingTarget(target) {
  return (
    target instanceof HTMLElement &&
    (target.closest('input, textarea, select, button, [contenteditable="true"]') ||
      target.isContentEditable)
  );
}

function scrollViewportToSyncBlock({
  activePoint,
  currentTime,
  offset,
  presentationContentRef,
  setActiveLiveColumnKey,
  shouldUseHorizontalColumnFlow,
  syncPoints,
}) {
  const viewport = presentationContentRef.current;
  if (!viewport || !activePoint?.syncBlockId) return;

  const target = viewport.querySelector(
    getSafeSelectorForSyncBlock(activePoint.syncBlockId),
  );
  if (!target) return;

  if (shouldUseHorizontalColumnFlow) {
    const targetColumn =
      target.closest(".presentation-column") ||
      target.closest(".presentation-render-block") ||
      target;
    const columnKey =
      targetColumn.querySelector("[data-live-column-key]")?.dataset
        ?.liveColumnKey ||
      targetColumn.dataset?.liveColumnKey ||
      "";

    viewport.scrollTo({
      left: Math.max(
        0,
        targetColumn.offsetLeft -
          (viewport.clientWidth - targetColumn.clientWidth) / 2,
      ),
      behavior: "auto",
    });

    setActiveLiveColumnKey?.(columnKey);
    return;
  }

  const nextPoint = getNextSyncPoint(activePoint, syncPoints);
  const nextTarget = nextPoint
    ? viewport.querySelector(getSafeSelectorForSyncBlock(nextPoint.syncBlockId))
    : null;
  const progress = getSyncProgress({
    currentTime,
    offset,
    activePoint,
    nextPoint,
  });
  const targetTop = getElementTopInsideViewport(target, viewport);
  const nextTop = nextTarget
    ? getElementTopInsideViewport(nextTarget, viewport)
    : targetTop;
  const interpolatedTop = targetTop + (nextTop - targetTop) * progress;

  viewport.scrollTo({
    top: Math.max(0, interpolatedTop - viewport.clientHeight * 0.35),
    behavior: "auto",
  });
}

function loadYouTubeIframeApi() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;

    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
}

export function usePresentationSync({
  isEditing,
  isTouchLayout,
  liveView,
  playbackSync,
  presentationContentRef,
  setActiveLiveColumnKey,
  shouldUseHorizontalColumnFlow,
}) {
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const lastActiveBlockRef = useRef("");
  const [enabled, setEnabled] = useState(false);
  const [navigationMode, setNavigationMode] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerDisplayMode, setPlayerDisplayMode] = useState(
    getStoredPlayerDisplayMode,
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSyncBlockId, setActiveSyncBlockId] = useState("");
  const [offset, setOffset] = useState(getStoredOffset);
  const [isLandscapeBlocked, setIsLandscapeBlocked] = useState(false);

  const normalizedSync = useMemo(
    () => normalizePlaybackSync(playbackSync),
    [playbackSync],
  );
  const syncPoints = useMemo(
    () => getSortedSyncPoints(normalizedSync?.syncPoints || []),
    [normalizedSync],
  );
  const canSync = Boolean(normalizedSync?.videoId && syncPoints.length);
  const activePoint = useMemo(
    () =>
      getActiveSyncPoint({
        currentTime,
        offset,
        syncPoints,
      }),
    [currentTime, offset, syncPoints],
  );
  const loopBounds = useMemo(
    () =>
      getLoopBounds({
        activePoint,
        duration,
        syncPoints,
      }),
    [activePoint, duration, syncPoints],
  );

  useEffect(() => {
    if (canSync) return;
    setEnabled(false);
    setNavigationMode(false);
    setLoopMode(false);
  }, [canSync]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setIsLandscapeBlocked(Boolean(isTouchLayout && isTouchLandscape()));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [isTouchLayout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SYNC_OFFSET_STORAGE_KEY, String(offset));
  }, [offset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SYNC_PLAYER_DISPLAY_STORAGE_KEY,
      playerDisplayMode,
    );
  }, [playerDisplayMode]);

  useEffect(() => {
    if (!enabled || !normalizedSync?.videoId || !playerHostRef.current) {
      return undefined;
    }

    let cancelled = false;

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !playerHostRef.current) return;

      playerRef.current?.destroy?.();
      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId: normalizedSync.videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [enabled, normalizedSync?.videoId]);

  useEffect(() => {
    if (!enabled || isEditing || liveView === "setlist") return undefined;

    let frameId = 0;
    let lastStateUpdate = 0;

    const tick = () => {
      const player = playerRef.current;
      const nextCurrentTime = Number(player?.getCurrentTime?.() || 0);
      const nextDuration = Number(player?.getDuration?.() || 0);
      const nextActivePoint = getActiveSyncPoint({
        currentTime: nextCurrentTime,
        offset,
        syncPoints,
      });

      if (nextActivePoint?.syncBlockId) {
        if (lastActiveBlockRef.current !== nextActivePoint.syncBlockId) {
          lastActiveBlockRef.current = nextActivePoint.syncBlockId;
          setActiveSyncBlockId(nextActivePoint.syncBlockId);
        }

        if (!isLandscapeBlocked) {
          scrollViewportToSyncBlock({
            activePoint: nextActivePoint,
            currentTime: nextCurrentTime,
            offset,
            presentationContentRef,
            setActiveLiveColumnKey,
            shouldUseHorizontalColumnFlow,
            syncPoints,
          });
        }
      }

      if (loopMode && nextActivePoint) {
        const bounds = getLoopBounds({
          activePoint: nextActivePoint,
          duration: nextDuration,
          syncPoints,
        });

        if (bounds && nextCurrentTime >= bounds.end - 0.05) {
          player?.seekTo?.(bounds.start, true);
          player?.playVideo?.();
        }
      }

      const now = performance.now();
      if (now - lastStateUpdate > 250) {
        lastStateUpdate = now;
        setCurrentTime(nextCurrentTime);
        if (Number.isFinite(nextDuration)) setDuration(nextDuration);
        try {
          setIsPlaying(player?.getPlayerState?.() === 1);
        } catch {}
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [
    enabled,
    isEditing,
    isLandscapeBlocked,
    liveView,
    loopMode,
    offset,
    presentationContentRef,
    setActiveLiveColumnKey,
    shouldUseHorizontalColumnFlow,
    syncPoints,
  ]);

  const seekToSyncBlock = useCallback(
    (syncBlockId) => {
      const point = syncPoints.find((item) => item.syncBlockId === syncBlockId);
      if (!point) return false;

      playerRef.current?.seekTo?.(Math.max(0, point.time), true);
      playerRef.current?.playVideo?.();
      setActiveSyncBlockId(point.syncBlockId);
      setCurrentTime(point.time);
      return true;
    },
    [syncPoints],
  );

  const seekToPoint = useCallback((point) => {
    if (!point) return false;

    playerRef.current?.seekTo?.(Math.max(0, Number(point.time) || 0), true);
    playerRef.current?.playVideo?.();
    setActiveSyncBlockId(point.syncBlockId);
    setCurrentTime(Number(point.time) || 0);
    setIsPlaying(true);
    return true;
  }, []);

  const seekToAdjacentPoint = useCallback(
    (direction) => {
      const referencePoint =
        getActiveSyncPoint({ currentTime, offset, syncPoints }) ||
        syncPoints[0] ||
        null;
      const targetPoint =
        direction > 0
          ? getNextSyncPoint(referencePoint, syncPoints)
          : getPreviousSyncPoint(referencePoint, syncPoints);

      return seekToPoint(targetPoint || referencePoint);
    },
    [currentTime, offset, seekToPoint, syncPoints],
  );

  const seekRelative = useCallback((delta) => {
    const nextTime = Math.max(
      0,
      Number(playerRef.current?.getCurrentTime?.() || currentTime || 0) + delta,
    );
    playerRef.current?.seekTo?.(nextTime, true);
    setCurrentTime(nextTime);
  }, [currentTime]);

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (player.getPlayerState?.() === 1) {
        player.pauseVideo?.();
        setIsPlaying(false);
      } else {
        player.playVideo?.();
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled((current) => canSync && !current);
  }, [canSync]);

  const adjustOffset = useCallback((delta) => {
    setOffset((current) => Math.round((Number(current || 0) + delta) * 10) / 10);
  }, []);

  useEffect(() => {
    if (!canSync || typeof window === "undefined") return undefined;

    const handleShortcut = (event) => {
      if (!event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) return;

      if (event.code === "KeyS") {
        event.preventDefault();
        toggleEnabled();
        return;
      }

      if (!enabled) return;

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
        return;
      }
      if (event.code === "KeyL") {
        event.preventDefault();
        setLoopMode((current) => !current);
        return;
      }
      if (event.code === "KeyN") {
        event.preventDefault();
        setNavigationMode((current) => !current);
        return;
      }
      if (event.code === "ArrowRight") {
        event.preventDefault();
        seekToAdjacentPoint(1);
        return;
      }
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        seekToAdjacentPoint(-1);
        return;
      }
      if (event.code === "ArrowUp") {
        event.preventDefault();
        seekRelative(5);
        return;
      }
      if (event.code === "ArrowDown") {
        event.preventDefault();
        seekRelative(-5);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [
    canSync,
    enabled,
    seekRelative,
    seekToAdjacentPoint,
    toggleEnabled,
    togglePlayback,
  ]);

  return {
    activePoint,
    activeSyncBlockId,
    adjustOffset,
    canSync,
    currentTime,
    duration,
    enabled,
    isLandscapeBlocked,
    isPlaying,
    loopBounds,
    loopMode,
    navigationMode,
    offset,
    playerDisplayMode,
    playerHostRef,
    seekRelative,
    seekToAdjacentPoint,
    seekToSyncBlock,
    setPlayerDisplayMode,
    setLoopMode,
    setNavigationMode,
    syncPoints,
    toggleEnabled,
    togglePlayback,
  };
}
