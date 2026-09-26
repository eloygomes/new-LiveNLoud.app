import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  clampPresentationBlockSpacingStep,
  clampLiveCifraZoomPercent,
  getPresentationBlockSpacingPx,
} from "../presentationLayoutHelpers";
import { setLocalStorageJsonSafe } from "../../../Tools/storageSafe";

const TOUCH_LIVE_CIFRA_ZOOM_SCALE = 0.6;

export function getDefaultLiveCifraZoomPercent({
  isTouchLayout = false,
  windowRef = typeof window === "undefined" ? null : window,
} = {}) {
  if (isTouchLayout) return 100;
  if (!windowRef) return 160;

  const width = Number(windowRef.innerWidth || 0);
  const height = Number(windowRef.innerHeight || 0);

  if (width >= 1600 && height >= 850) return 180;
  if (width >= 1280 && height >= 720) return 160;
  return 140;
}

export function getLiveBlockSpacingPx({
  baseSpacingPx = 32,
  liveZoomScale = 1,
  viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth,
} = {}) {
  const safeBaseSpacing = Math.max(0, Number(baseSpacingPx) || 0);
  const overflowScale = Math.max(0, (Number(liveZoomScale) || 1) - 1);
  const liveColumnWidth = Math.min(
    992,
    Math.max(608, (Number(viewportWidth) || 1440) * 0.46),
  );

  return Math.round(
    safeBaseSpacing + overflowScale * liveColumnWidth * 0.8,
  );
}

export function usePresentationVisualScale({
  blockSpacingStep,
  isTouchLayout = false,
  liveSettingsStorageKey = "",
  touchFontSizeStep,
}) {
  const createLivePreferences = useCallback(
    (storageKey) => {
      const fallback = {
        key: storageKey,
        zoomPercent: getDefaultLiveCifraZoomPercent({ isTouchLayout }),
        spacingStep: clampPresentationBlockSpacingStep(blockSpacingStep),
        tabsVisible: true,
      };
      if (!storageKey || typeof window === "undefined") return fallback;

      try {
        const rawStored = window.localStorage.getItem(storageKey);
        if (!rawStored) return fallback;
        const stored = JSON.parse(rawStored);
        return {
          key: storageKey,
          zoomPercent: clampLiveCifraZoomPercent(stored?.zoomPercent),
          spacingStep: clampPresentationBlockSpacingStep(
            Number(stored?.spacingStep),
          ),
          tabsVisible:
            typeof stored?.tabsVisible === "boolean"
              ? stored.tabsVisible
              : true,
        };
      } catch {
        return fallback;
      }
    },
    [blockSpacingStep, isTouchLayout],
  );
  const [livePreferences, setLivePreferences] = useState(() =>
    createLivePreferences(liveSettingsStorageKey),
  );

  useLayoutEffect(() => {
    if (livePreferences.key === liveSettingsStorageKey) return;
    setLivePreferences(createLivePreferences(liveSettingsStorageKey));
  }, [createLivePreferences, livePreferences.key, liveSettingsStorageKey]);

  useEffect(() => {
    if (
      !liveSettingsStorageKey ||
      livePreferences.key !== liveSettingsStorageKey
    ) {
      return;
    }
    setLocalStorageJsonSafe(liveSettingsStorageKey, {
      zoomPercent: livePreferences.zoomPercent,
      spacingStep: livePreferences.spacingStep,
      tabsVisible: livePreferences.tabsVisible,
    });
  }, [livePreferences, liveSettingsStorageKey]);

  const blockSpacingPx = getPresentationBlockSpacingPx(blockSpacingStep);
  const blockSpacingLabel = `${blockSpacingPx}px`;
  const touchFontSizePercent = Math.max(
    0,
    Math.min(200, 100 + touchFontSizeStep * 10),
  );
  const touchFontSizeRem = useMemo(
    () => 0.82 * (touchFontSizePercent / 100),
    [touchFontSizePercent],
  );
  const presentationFontScale = touchFontSizeRem / 0.82;
  const touchFontSizeLabel = `${touchFontSizePercent}%`;
  const clampedLiveCifraZoomPercent = clampLiveCifraZoomPercent(
    livePreferences.zoomPercent,
  );
  const liveCifraZoomScale =
    (clampedLiveCifraZoomPercent / 100) *
    (isTouchLayout ? TOUCH_LIVE_CIFRA_ZOOM_SCALE : 1);
  const liveCifraZoomLabel = `${clampedLiveCifraZoomPercent}%`;
  const liveBlockSpacingPx = getLiveBlockSpacingPx({
    baseSpacingPx: getPresentationBlockSpacingPx(
      livePreferences.spacingStep,
    ),
    liveZoomScale: liveCifraZoomScale,
  });
  const liveBlockSpacingLabel = `${liveBlockSpacingPx}px`;
  const adjustLiveCifraZoom = useCallback((delta) => {
    setLivePreferences((current) => ({
      ...current,
      zoomPercent: clampLiveCifraZoomPercent(current.zoomPercent + delta),
    }));
  }, []);
  const adjustLiveBlockSpacing = useCallback((delta) => {
    setLivePreferences((current) => ({
      ...current,
      spacingStep: clampPresentationBlockSpacingStep(
        current.spacingStep + delta,
      ),
    }));
  }, []);
  const toggleLiveTabs = useCallback(() => {
    setLivePreferences((current) => ({
      ...current,
      tabsVisible: !current.tabsVisible,
    }));
  }, []);

  return {
    adjustLiveCifraZoom,
    adjustLiveBlockSpacing,
    blockSpacingLabel,
    blockSpacingPx,
    liveBlockSpacingLabel,
    liveBlockSpacingPx,
    liveTabsVisible: livePreferences.tabsVisible,
    liveCifraZoomLabel,
    liveCifraZoomScale,
    presentationFontScale,
    touchFontSizeLabel,
    touchFontSizeRem,
    toggleLiveTabs,
  };
}
