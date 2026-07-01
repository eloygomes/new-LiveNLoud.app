import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updateSongEntry } from "../../../Tools/Controllers";
import {
  getProgressionColumnsDebugSummary,
  getPresentationContentDebugSummary,
  getPresentationLayoutsDebugSummary,
  toPresentationLayoutPayload,
} from "../presentationLayoutHelpers";
import {
  getVisibleBlocksDebugSummary,
  logPresentationDebug,
} from "../helpers/presentationUtils";
import { collectEditedPresentationBlocksFromNode } from "../helpers/editableCifraDom";
import {
  buildCifraSavePayload,
  mergeSavedCifraState,
  persistPresentationLayoutsToStorage,
  restoreOriginalLayoutsInSongData,
} from "../helpers/cifraPersistence";

export function usePresentationCifraEditor({
  activeLayoutVariant,
  activeProgressionRenderColumns,
  currentInstrumentData,
  editableSongCifra,
  editOriginalCifraRef,
  editOriginalLayoutsRef,
  hasEditedCifraContent,
  hasEditedLayoutContent,
  instrumentPresentationLayouts,
  instrumentSelected,
  isEditing,
  isExpandedCifra,
  presentationContentRef,
  presentationLayoutIdentity,
  presentationLayoutStorageKey,
  pushSnackbarMessage,
  setHasEditedCifraContent,
  setHasEditedLayoutContent,
  setIsEditing,
  setSongDataFetched,
  setToolBoxBtnStatus,
  setToolBoxRequestedPanel,
  shouldUseHorizontalColumnFlow,
  songDataFetched,
  visibleContentBlocks,
}) {
  const [draftCifra, setDraftCifra] = useState("");
  const [isSavingCifra, setIsSavingCifra] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState("");
  const [saveError, setSaveError] = useState("");
  const previousActiveLayoutVariantRef = useRef(activeLayoutVariant);

  const updateEditedCifraContent = useCallback(
    (value) => {
      setHasEditedCifraContent(value);
    },
    [setHasEditedCifraContent],
  );

  useEffect(() => {
    if (!isEditing) {
      setDraftCifra(editableSongCifra);
      updateEditedCifraContent(false);
    }
  }, [editableSongCifra, isEditing, updateEditedCifraContent]);

  useEffect(() => {
    if (previousActiveLayoutVariantRef.current === activeLayoutVariant) return;

    previousActiveLayoutVariantRef.current = activeLayoutVariant;
    setDraftCifra(editableSongCifra);
    updateEditedCifraContent(false);
    setSaveError("");
  }, [activeLayoutVariant, editableSongCifra, updateEditedCifraContent]);

  const startEditingCifra = useCallback(() => {
    editOriginalCifraRef.current = editableSongCifra;
    editOriginalLayoutsRef.current = toPresentationLayoutPayload(
      instrumentPresentationLayouts,
    );
    logPresentationDebug("edit:start", {
      identity: presentationLayoutIdentity,
      activeLayoutVariant,
      isExpandedCifra,
      content: getPresentationContentDebugSummary(editableSongCifra),
      layouts: getPresentationLayoutsDebugSummary(
        instrumentPresentationLayouts,
      ),
      visibleBlocks: getVisibleBlocksDebugSummary(visibleContentBlocks),
      columns: getProgressionColumnsDebugSummary(
        activeProgressionRenderColumns,
      ),
    });
    setSaveError("");
    setIsEditing(true);
    updateEditedCifraContent(false);
    setDraftCifra(editableSongCifra);
  }, [
    activeLayoutVariant,
    activeProgressionRenderColumns,
    editableSongCifra,
    editOriginalCifraRef,
    editOriginalLayoutsRef,
    instrumentPresentationLayouts,
    isExpandedCifra,
    presentationLayoutIdentity,
    setIsEditing,
    updateEditedCifraContent,
    visibleContentBlocks,
  ]);

  const openEditorToolBox = useCallback(() => {
    if (!isEditing && editableSongCifra) {
      startEditingCifra();
    }
    setToolBoxRequestedPanel({
      id: "panel-editor",
      requestId: Date.now(),
    });
    setToolBoxBtnStatus(true);
  }, [
    editableSongCifra,
    isEditing,
    setToolBoxBtnStatus,
    setToolBoxRequestedPanel,
    startEditingCifra,
  ]);

  const handleDiscardDraft = useCallback(() => {
    const originalLayouts = editOriginalLayoutsRef.current;

    if (originalLayouts && instrumentSelected) {
      setSongDataFetched((prev) => {
        return restoreOriginalLayoutsInSongData({
          previousSongData: prev,
          instrumentSelected,
          originalLayouts,
        });
      });

      persistPresentationLayoutsToStorage({
        storageKey: presentationLayoutStorageKey,
        layouts: originalLayouts,
      });
    }

    setDraftCifra(editOriginalCifraRef.current || editableSongCifra);
    setIsEditing(false);
    setToolBoxBtnStatus(false);
    setToolBoxRequestedPanel(null);
    updateEditedCifraContent(false);
    setHasEditedLayoutContent(false);
    editOriginalLayoutsRef.current = null;
    setSaveError("");
  }, [
    editableSongCifra,
    editOriginalCifraRef,
    editOriginalLayoutsRef,
    instrumentSelected,
    presentationLayoutStorageKey,
    setHasEditedLayoutContent,
    setIsEditing,
    setSongDataFetched,
    setToolBoxBtnStatus,
    setToolBoxRequestedPanel,
    updateEditedCifraContent,
  ]);

  const collectEditedPresentationBlocks = useCallback(() => {
    // Layout contract: expanded horizontal editing must save the columns exactly
    // as the user left them. `persistVisualColumnBreaks` is deliberately tied to
    // `shouldUseHorizontalColumnFlow`; removing it causes saved content to be
    // repaginated after reload and makes blocks jump between columns.
    return collectEditedPresentationBlocksFromNode({
      contentNode: presentationContentRef.current,
      fallbackCifra: draftCifra,
      preserveColumnBreaks: isExpandedCifra,
      persistVisualColumnBreaks: shouldUseHorizontalColumnFlow,
      sourceBlocks: visibleContentBlocks,
    });
  }, [
    draftCifra,
    isExpandedCifra,
    presentationContentRef,
    shouldUseHorizontalColumnFlow,
    visibleContentBlocks,
  ]);

  const markCifraContentAsEdited = useCallback(
    (event) => {
      const inputType = event?.nativeEvent?.inputType || event?.inputType || "";
      if (!inputType || inputType.startsWith("history")) return;
      updateEditedCifraContent(true);
    },
    [updateEditedCifraContent],
  );

  const collectSafeEditedPresentationBlocks = useCallback(() => {
    const nextCifra = collectEditedPresentationBlocks();
    const currentCifra =
      typeof draftCifra === "string" ? draftCifra : editableSongCifra || "";
    const currentSummary = getPresentationContentDebugSummary(currentCifra);
    const nextSummary = getPresentationContentDebugSummary(nextCifra);

    if (currentCifra.trim() && !String(nextCifra || "").trim()) {
      console.warn(
        "Edição ignorada: coleta do conteúdo retornou vazio para uma cifra existente.",
      );
      logPresentationDebug("content:collect-edited:fallback-current", {
        identity: presentationLayoutIdentity,
        current: currentSummary,
        collected: nextSummary,
      });
      return currentCifra;
    }

    logPresentationDebug("content:collect-edited", {
      identity: presentationLayoutIdentity,
      current: currentSummary,
      collected: nextSummary,
    });

    return nextCifra;
  }, [
    collectEditedPresentationBlocks,
    draftCifra,
    editableSongCifra,
    presentationLayoutIdentity,
  ]);

  const handleSaveCifra = useCallback(async () => {
    if (!instrumentSelected || !songDataFetched) {
      setSaveError("Sem dados da música carregados para salvar.");
      pushSnackbarMessage(
        "Erro",
        "Sem dados da música carregados para salvar.",
      );
      return;
    }
    setIsSavingCifra(true);
    setSaveError("");

    // Layout contract: while the cifra editor is open, the contenteditable DOM
    // is the source of truth. Do not gate collection on `hasEditedCifraContent`;
    // browser editing can miss that flag for deletes, selections, IME/input
    // edge cases, or whole-column edits. Saving must persist exactly the editor
    // content that the user sees at click time.
    const shouldCollectEditedDom =
      isEditing && Boolean(presentationContentRef.current);
    const nextDraftCifra = shouldCollectEditedDom
      ? collectSafeEditedPresentationBlocks()
      : editableSongCifra || draftCifra;
    const { currentLayouts, nextSongData, persistedLayouts, updatedBlock } =
      buildCifraSavePayload({
        activeLayoutVariant,
        currentInstrumentData,
        instrumentSelected,
        nextDraftCifra,
        songDataFetched,
      });

    logPresentationDebug("save:before-request", {
      identity: presentationLayoutIdentity,
      activeLayoutVariant,
      instrumentSelected,
      hasEditedCifraContent,
      hasEditedLayoutContent,
      nextDraftCifra: getPresentationContentDebugSummary(nextDraftCifra),
      currentLayouts: getPresentationLayoutsDebugSummary(currentLayouts),
      persistedLayouts: getPresentationLayoutsDebugSummary(persistedLayouts),
      visibleBlocks: getVisibleBlocksDebugSummary(visibleContentBlocks),
      columns: getProgressionColumnsDebugSummary(
        activeProgressionRenderColumns,
      ),
    });

    try {
      const saveResult = await updateSongEntry(nextSongData);
      logPresentationDebug("save:response", {
        identity: presentationLayoutIdentity,
        queued: Boolean(saveResult?.queued),
        hasSong: Boolean(saveResult?.song),
        serverInstrumentLayouts: getPresentationLayoutsDebugSummary(
          saveResult?.song?.[instrumentSelected]?.presentationLayouts,
        ),
        serverInstrumentSongCifra: getPresentationContentDebugSummary(
          saveResult?.song?.[instrumentSelected]?.songCifra,
        ),
      });

      if (presentationLayoutStorageKey && typeof window !== "undefined") {
        logPresentationDebug("save:localStorage-write", {
          identity: presentationLayoutIdentity,
          key: presentationLayoutStorageKey,
          layouts: getPresentationLayoutsDebugSummary(persistedLayouts),
        });
        persistPresentationLayoutsToStorage({
          storageKey: presentationLayoutStorageKey,
          layouts: persistedLayouts,
        });
      }

      setDraftCifra(nextDraftCifra);
      setSongDataFetched((prev) => {
        logPresentationDebug("save:state-merge", {
          identity: presentationLayoutIdentity,
          previousLayouts: getPresentationLayoutsDebugSummary(
            prev?.[instrumentSelected]?.presentationLayouts,
          ),
          nextLayouts: getPresentationLayoutsDebugSummary(persistedLayouts),
          serverLayouts: getPresentationLayoutsDebugSummary(
            saveResult?.song?.[instrumentSelected]?.presentationLayouts,
          ),
        });

        return mergeSavedCifraState({
          previousSongData: prev,
          saveResult,
          nextSongData,
          instrumentSelected,
          updatedBlock,
          persistedLayouts,
        });
      });
      setIsEditing(false);
      setToolBoxBtnStatus(false);
      setToolBoxRequestedPanel(null);
      updateEditedCifraContent(false);
      setHasEditedLayoutContent(false);
      editOriginalLayoutsRef.current = null;
      const timestamp = new Date().toLocaleTimeString();
      setLastSaveTimestamp(timestamp);
      pushSnackbarMessage("Salvo", `Último salvamento às ${timestamp}`);
    } catch (error) {
      setSaveError("Não foi possível salvar a cifra. Tente novamente.");
      pushSnackbarMessage(
        "Erro",
        "Não foi possível salvar a cifra. Tente novamente.",
      );
      console.error("Erro ao salvar cifra:", error);
    } finally {
      setIsSavingCifra(false);
    }
  }, [
    activeLayoutVariant,
    activeProgressionRenderColumns,
    collectSafeEditedPresentationBlocks,
    currentInstrumentData,
    draftCifra,
    editableSongCifra,
    editOriginalLayoutsRef,
    hasEditedCifraContent,
    hasEditedLayoutContent,
    instrumentSelected,
    isEditing,
    presentationLayoutIdentity,
    presentationLayoutStorageKey,
    presentationContentRef,
    pushSnackbarMessage,
    setHasEditedLayoutContent,
    setIsEditing,
    setSongDataFetched,
    setToolBoxBtnStatus,
    setToolBoxRequestedPanel,
    shouldUseHorizontalColumnFlow,
    songDataFetched,
    updateEditedCifraContent,
    visibleContentBlocks,
  ]);

  const hasDraftChanges = useMemo(
    () =>
      isEditing ||
      hasEditedLayoutContent ||
      ((isEditing ? editOriginalCifraRef.current : editableSongCifra) || "") !==
        (draftCifra || ""),
    [
      draftCifra,
      editableSongCifra,
      editOriginalCifraRef,
      hasEditedLayoutContent,
      isEditing,
    ],
  );

  return {
    draftCifra,
    handleDiscardDraft,
    handleSaveCifra,
    hasDraftChanges,
    isSavingCifra,
    lastSaveTimestamp,
    markCifraContentAsEdited,
    openEditorToolBox,
    saveError,
    setDraftCifra,
    setSaveError,
    startEditingCifra,
  };
}
