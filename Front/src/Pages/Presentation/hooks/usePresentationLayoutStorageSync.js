import { useEffect, useRef } from "react";
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

export function usePresentationLayoutStorageSync({
  currentInstrumentData,
  instrumentPresentationLayouts,
  instrumentSelected,
  isExpandedCifra,
  isRouteSongLoading,
  presentationLayoutIdentity,
  presentationLayoutModeStorageKey,
  presentationLayoutSettingsSnapshot,
  presentationLayoutStorageKey,
  setIsExpandedCifra,
  setSongDataFetched,
  songDataFetched,
}) {
  const lastHydratedLayoutIdentityRef = useRef("");
  const skipNextLayoutPersistRef = useRef(false);
  const skipNextModePersistRef = useRef(false);

  useEffect(() => {
    if (!presentationLayoutModeStorageKey || typeof window === "undefined") {
      return;
    }

    skipNextModePersistRef.current = true;
    const storedLayoutMode = window.localStorage.getItem(
      presentationLayoutModeStorageKey,
    );
    setIsExpandedCifra(storedLayoutMode === "expanded");
  }, [presentationLayoutModeStorageKey, setIsExpandedCifra]);

  useEffect(() => {
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
    skipNextLayoutPersistRef.current = true;

    if (typeof window === "undefined") return;

    try {
      const rawStoredLayouts = window.localStorage.getItem(
        presentationLayoutStorageKey,
      );
      if (!rawStoredLayouts) {
        logPresentationDebug("localStorage:hydrate:empty", {
          identity: presentationLayoutIdentity,
          key: presentationLayoutStorageKey,
        });
        return;
      }

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
      window.localStorage.setItem(
        presentationLayoutStorageKey,
        JSON.stringify(persistedLayouts),
      );
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

    try {
      window.localStorage.setItem(
        presentationLayoutModeStorageKey,
        isExpandedCifra ? "expanded" : "default",
      );
    } catch (error) {
      console.error("Erro ao persistir modo da presentation:", error);
    }
  }, [isExpandedCifra, presentationLayoutModeStorageKey]);
}
