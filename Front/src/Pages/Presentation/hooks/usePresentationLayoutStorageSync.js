import { useEffect, useLayoutEffect, useRef } from "react";
import {
  buildInstrumentPresentationLayouts,
  getPresentationContentDebugSummary,
  getPresentationLayoutSettingsSnapshot,
  getPresentationLayoutsDebugSummary,
  hasPersistablePresentationLayouts,
  normalizePresentationLayoutVariant,
  toPresentationLayoutPayload,
} from "../presentationLayoutHelpers";
import { logPresentationDebug } from "../helpers/presentationUtils";
import {
  setLocalStorageItemSafe,
  setLocalStorageJsonSafe,
} from "../../../Tools/storageSafe";

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function getAutomaticPresentationLayoutMode(windowRef) {
  if (!windowRef) return "vertical";
  return windowRef.innerHeight > windowRef.innerWidth
    ? "vertical"
    : "horizontal";
}

export function usePresentationLayoutStorageSync({
  currentInstrumentData,
  instrumentPresentationLayouts,
  instrumentSelected,
  isExpandedCifra,
  isEditing = false,
  isLayoutModeManual = false,
  isRouteSongLoading,
  presentationLayoutIdentity,
  presentationLayoutModeStorageKey,
  presentationLayoutSettingsSnapshot,
  presentationLayoutStorageKey,
  setIsExpandedCifra,
  setIsLayoutModeManual = () => {},
  setSongDataFetched,
  songDataFetched,
}) {
  const lastHydratedLayoutIdentityRef = useRef("");
  const skipNextLayoutPersistRef = useRef(false);
  const skipNextModePersistRef = useRef(false);

  useBrowserLayoutEffect(() => {
    if (!presentationLayoutModeStorageKey || typeof window === "undefined") {
      return;
    }

    skipNextModePersistRef.current = true;
    const storedLayoutMode = window.localStorage.getItem(
      presentationLayoutModeStorageKey,
    );
    const hasStoredManualMode = [
      "vertical",
      "horizontal",
      "default",
      "expanded",
    ].includes(
      storedLayoutMode,
    );
    setIsLayoutModeManual(hasStoredManualMode);
    setIsExpandedCifra(
      hasStoredManualMode
        ? ["horizontal", "expanded"].includes(storedLayoutMode)
        : getAutomaticPresentationLayoutMode(window) === "horizontal",
    );
  }, [
    presentationLayoutModeStorageKey,
    setIsExpandedCifra,
    setIsLayoutModeManual,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || isLayoutModeManual) return undefined;

    const applyAutomaticLayout = () => {
      setIsExpandedCifra(
        getAutomaticPresentationLayoutMode(window) === "horizontal",
      );
    };

    applyAutomaticLayout();
    window.addEventListener("resize", applyAutomaticLayout);
    window.addEventListener("orientationchange", applyAutomaticLayout);

    return () => {
      window.removeEventListener("resize", applyAutomaticLayout);
      window.removeEventListener("orientationchange", applyAutomaticLayout);
    };
  }, [isLayoutModeManual, setIsExpandedCifra]);

  useBrowserLayoutEffect(() => {
    if (
      !presentationLayoutIdentity ||
      !presentationLayoutStorageKey ||
      !songDataFetched
    ) {
      return;
    }

    if (lastHydratedLayoutIdentityRef.current === presentationLayoutIdentity) {
      return;
    }

    lastHydratedLayoutIdentityRef.current = presentationLayoutIdentity;

    if (typeof window === "undefined") return;

    try {
      const rawStoredLayouts = window.localStorage.getItem(
        presentationLayoutStorageKey,
      );
      if (!rawStoredLayouts) {
        skipNextLayoutPersistRef.current = false;
        logPresentationDebug("localStorage:hydrate:empty", {
          identity: presentationLayoutIdentity,
          key: presentationLayoutStorageKey,
        });
        return;
      }

      skipNextLayoutPersistRef.current = true;

      const parsedStoredLayouts = JSON.parse(rawStoredLayouts);
      logPresentationDebug("localStorage:hydrate:read", {
        identity: presentationLayoutIdentity,
        key: presentationLayoutStorageKey,
        storedLayouts: getPresentationLayoutsDebugSummary(parsedStoredLayouts),
      });

      setSongDataFetched((prev) => {
        if (!prev || !instrumentSelected) return prev;

        const currentInstrument = prev[instrumentSelected] || {};
        const currentLayouts =
          buildInstrumentPresentationLayouts(currentInstrument);
        const nextLayouts = {
          default: normalizePresentationLayoutVariant(
            parsedStoredLayouts?.default,
            {
              fallbackSongCifra: currentLayouts.default.songCifra,
              defaultTwoColumns: false,
            },
          ),
          expanded: normalizePresentationLayoutVariant(
            parsedStoredLayouts?.expanded,
            {
              fallbackSongCifra: currentLayouts.expanded.songCifra,
              defaultTwoColumns: true,
            },
          ),
        };
        const currentSnapshot =
          getPresentationLayoutSettingsSnapshot(currentLayouts);
        const nextSnapshot = getPresentationLayoutSettingsSnapshot(nextLayouts);
        const shouldSkipHydration =
          currentSnapshot === nextSnapshot &&
          currentInstrument.songCifra === nextLayouts.default.songCifra;

        logPresentationDebug("localStorage:hydrate:compare", {
          identity: presentationLayoutIdentity,
          key: presentationLayoutStorageKey,
          skipped: shouldSkipHydration,
          currentLayouts: getPresentationLayoutsDebugSummary(currentLayouts),
          storedLayouts: getPresentationLayoutsDebugSummary(nextLayouts),
          currentSongCifra: getPresentationContentDebugSummary(
            currentInstrument.songCifra,
          ),
        });

        if (shouldSkipHydration) return prev;

        return {
          ...prev,
          [instrumentSelected]: {
            ...currentInstrument,
            songCifra: nextLayouts.default.songCifra,
            presentationLayouts: toPresentationLayoutPayload(nextLayouts),
          },
        };
      });
    } catch (error) {
      console.error("Erro ao hidratar layouts da presentation:", error);
    }
  }, [
    instrumentSelected,
    presentationLayoutIdentity,
    presentationLayoutStorageKey,
    setSongDataFetched,
    songDataFetched,
  ]);

  useEffect(() => {
    if (!presentationLayoutStorageKey || typeof window === "undefined") return;
    if (isEditing) return;
    if (
      isRouteSongLoading ||
      !songDataFetched ||
      !instrumentSelected ||
      !currentInstrumentData ||
      !hasPersistablePresentationLayouts(instrumentPresentationLayouts)
    ) {
      logPresentationDebug("localStorage:persist:skip", {
        identity: presentationLayoutIdentity,
        key: presentationLayoutStorageKey,
        isRouteSongLoading,
        hasSongDataFetched: Boolean(songDataFetched),
        instrumentSelected,
        hasCurrentInstrumentData: Boolean(currentInstrumentData),
        isPersistable: hasPersistablePresentationLayouts(
          instrumentPresentationLayouts,
        ),
      });
      return;
    }
    if (skipNextLayoutPersistRef.current) {
      skipNextLayoutPersistRef.current = false;
      return;
    }

    try {
      const persistedLayouts = toPresentationLayoutPayload(
        instrumentPresentationLayouts,
      );
      logPresentationDebug("localStorage:persist", {
        identity: presentationLayoutIdentity,
        key: presentationLayoutStorageKey,
        layouts: getPresentationLayoutsDebugSummary(persistedLayouts),
      });
      setLocalStorageJsonSafe(presentationLayoutStorageKey, persistedLayouts);
    } catch (error) {
      console.error(
        "Erro ao persistir layouts da presentation no navegador:",
        error,
      );
    }
  }, [
    currentInstrumentData,
    instrumentPresentationLayouts,
    instrumentSelected,
    isEditing,
    isRouteSongLoading,
    presentationLayoutIdentity,
    presentationLayoutSettingsSnapshot,
    presentationLayoutStorageKey,
    songDataFetched,
  ]);

  useEffect(() => {
    if (!presentationLayoutModeStorageKey || typeof window === "undefined") {
      return;
    }
    if (skipNextModePersistRef.current) {
      skipNextModePersistRef.current = false;
      return;
    }
    if (isEditing) return;
    if (!isLayoutModeManual) return;

    try {
      setLocalStorageItemSafe(
        presentationLayoutModeStorageKey,
        isExpandedCifra ? "horizontal" : "vertical",
      );
    } catch (error) {
      console.error("Erro ao persistir modo da presentation:", error);
    }
  }, [
    isEditing,
    isExpandedCifra,
    isLayoutModeManual,
    presentationLayoutModeStorageKey,
  ]);
}
