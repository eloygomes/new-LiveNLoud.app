import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

export function usePresentationEditableColumns({ columns, isEditing, sessionKey }) {
  const [draft, setDraft] = useState({ columns, isEditing, sessionKey, added: [] });

  // Keep new columns within this editing session, including when changing layouts.
  const isCurrentSession =
    draft.columns === columns &&
    draft.isEditing === isEditing &&
    draft.sessionKey === sessionKey;
  if (!isCurrentSession) {
    setDraft({ columns, isEditing, sessionKey, added: [] });
  }
  const added = isCurrentSession ? draft.added : [];
  const editableColumns = [...columns, ...added];

  const createNextBlock = useCallback((contentNode) => {
    if (!isEditing || !columns.length) return null;

    const position = columns.length + draft.added.length + 1;
    const groupKey = `editor-column-${position}`;
    const lastColumn = draft.added.at(-1) || columns.at(-1);
    const nextColumn = {
      groupKey,
      blockKeys: [groupKey],
      blocks: [{ blockKey: groupKey, block: "", index: position - 1 }],
      isProgressionEligible: lastColumn.isProgressionEligible,
      visualColumnIndex: position,
      displayPosition: position,
    };

    // React must own the column wrapper before the DOM editor moves content into it.
    flushSync(() => {
      setDraft((previous) => ({
        ...previous,
        added: [...previous.added, nextColumn],
      }));
    });

    return contentNode.querySelector(
      `[data-live-column-key="${groupKey}"] .presentation-render-content-block`,
    );
  }, [columns, draft.added, isEditing]);

  return { editableColumns, createNextBlock };
}
