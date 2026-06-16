import { useCallback, useMemo, useState } from "react";
import {
  clampLiveCifraZoomPercent,
  getPresentationBlockSpacingPx,
} from "../presentationLayoutHelpers";

const TOUCH_LIVE_CIFRA_ZOOM_SCALE = 0.6;

export function usePresentationVisualScale({
  blockSpacingStep,
  isTouchLayout = false,
  touchFontSizeStep,
}) {
  const [liveCifraZoomPercent, setLiveCifraZoomPercent] = useState(() =>
    isTouchLayout ? 100 : 120,
  );

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
  const clampedLiveCifraZoomPercent =
    clampLiveCifraZoomPercent(liveCifraZoomPercent);
  const liveCifraZoomScale =
    (clampedLiveCifraZoomPercent / 100) *
    (isTouchLayout ? TOUCH_LIVE_CIFRA_ZOOM_SCALE : 1);
  const liveCifraZoomLabel = `${clampedLiveCifraZoomPercent}%`;
  const adjustLiveCifraZoom = useCallback((delta) => {
    setLiveCifraZoomPercent((current) =>
      clampLiveCifraZoomPercent(current + delta),
    );
  }, []);

  return {
    adjustLiveCifraZoom,
    blockSpacingLabel,
    blockSpacingPx,
    liveCifraZoomLabel,
    liveCifraZoomScale,
    presentationFontScale,
    touchFontSizeLabel,
    touchFontSizeRem,
  };
}
