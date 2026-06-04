import { useCallback, useMemo, useState } from "react";
import {
  clampLiveCifraZoomPercent,
  getPresentationBlockSpacingPx,
} from "../presentationLayoutHelpers";

export function usePresentationVisualScale({
  blockSpacingStep,
  touchFontSizeStep,
}) {
  const [liveCifraZoomPercent, setLiveCifraZoomPercent] = useState(120);

  const blockSpacingPx = getPresentationBlockSpacingPx(blockSpacingStep);
  const blockSpacingLabel = `${blockSpacingPx}px`;
  const touchFontSizeRem = useMemo(
    () => Math.max(0.58, Math.min(1.18, 0.82 + touchFontSizeStep * 0.08)),
    [touchFontSizeStep],
  );
  const presentationFontScale = touchFontSizeRem / 0.82;
  const touchFontSizeLabel = `${Math.round(presentationFontScale * 100)}%`;
  const liveCifraZoomScale =
    clampLiveCifraZoomPercent(liveCifraZoomPercent) / 100;
  const liveCifraZoomLabel = `${clampLiveCifraZoomPercent(liveCifraZoomPercent)}%`;
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
