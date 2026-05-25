import PropTypes from "prop-types";

function ToolBoxEditControls({
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
  marksEditorOpen,
  onToggleMarksEditor,
  onToggleMarksVisibility,
  markEntries,
  onChangeMarkTitle,
  onChangeMarkPosition,
  activeLayoutLabel,
  touchFontSizeLabel,
  isTwoColumns,
  showProgressionMarkers,
}) {
  const canEditCifra = Boolean(songCifraData);
  const marksToggleLabel = showProgressionMarkers ? "Hide Marks" : "Show Marks";
  const marksEditorToggleLabel = marksEditorOpen ? "Close Mark Editor" : "Edit Marks";

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[14px] bg-white/65 px-3 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
        <div className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-black/45">
          Active layout
        </div>
        <div className="mt-1 text-base font-black leading-tight text-black">
          {activeLayoutLabel}
        </div>
        <div className="mt-3 space-y-2 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-black/55">
          <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white/70 px-3 py-2">
            <span>Font</span>
            <span className="text-black">{touchFontSizeLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white/70 px-3 py-2">
            <span>Columns</span>
            <span className="text-black">{isTwoColumns ? "Auto" : "Off"}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white/70 px-3 py-2">
            <span>Marks visible</span>
            <span className="text-black">
              {showProgressionMarkers ? "On" : "Off"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white/70 px-3 py-2">
            <span>Detected blocks</span>
            <span className="text-black">{markEntries.length}</span>
          </div>
        </div>
      </div>

      {isEditing ? (
        <>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              className="rounded-md neuphormism-b-btn-green-save px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={handleSaveCifra}
              disabled={isSavingCifra || !hasDraftChanges}
            >
              {isSavingCifra ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="rounded-md neuphormism-b-btn-red-cancel px-3 py-2 text-sm text-gray-800 disabled:opacity-50"
              onClick={handleDiscardDraft}
              disabled={isSavingCifra}
            >
              Discard
            </button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            className="rounded-md neuphormism-b-btn-gold bg-[#d9ad26] px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
            onClick={startEditingCifra}
            disabled={!canEditCifra}
          >
            Edit
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          className="rounded-md neuphormism-b-btn px-3 py-2 text-sm font-bold text-black"
          onClick={onToggleMarksVisibility}
        >
          {marksToggleLabel}
        </button>
        <button
          type="button"
          className="rounded-md neuphormism-b-btn px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
          onClick={onToggleMarksEditor}
          disabled={!canEditCifra}
        >
          {marksEditorToggleLabel}
        </button>
      </div>

      {marksEditorOpen ? (
        <div className="neuphormism-b mt-1 rounded-[14px] p-3">
          <div className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-black/45">
            Mark editor
          </div>
          <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
            {markEntries.length ? (
              markEntries.map((entry) => (
                <div
                  key={entry.blockKey}
                  className="rounded-[12px] bg-white/70 p-3 shadow-[0_4px_10px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-black/45">
                      Block {entry.defaultPosition}
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={entry.position}
                      onChange={(event) =>
                        onChangeMarkPosition?.(entry.blockKey, event.target.value)
                      }
                      className="w-20 rounded-[10px] border border-gray-300 bg-white px-2 py-2 text-sm font-bold text-black outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(event) =>
                      onChangeMarkTitle?.(entry.blockKey, event.target.value)
                    }
                    className="mt-2 w-full rounded-[10px] border border-gray-300 bg-white px-2 py-2 text-sm font-bold text-black outline-none"
                  />
                </div>
              ))
            ) : (
              <div className="rounded-[12px] bg-white/70 px-3 py-3 text-sm font-bold text-black/55 shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
                No marks detected for the current cifra.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

ToolBoxEditControls.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  isSavingCifra: PropTypes.bool.isRequired,
  hasDraftChanges: PropTypes.bool.isRequired,
  songCifraData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  handleSaveCifra: PropTypes.func.isRequired,
  handleDiscardDraft: PropTypes.func.isRequired,
  startEditingCifra: PropTypes.func.isRequired,
  marksEditorOpen: PropTypes.bool.isRequired,
  onToggleMarksEditor: PropTypes.func.isRequired,
  onToggleMarksVisibility: PropTypes.func.isRequired,
  markEntries: PropTypes.arrayOf(
    PropTypes.shape({
      blockKey: PropTypes.string.isRequired,
      defaultPosition: PropTypes.number.isRequired,
      position: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChangeMarkTitle: PropTypes.func.isRequired,
  onChangeMarkPosition: PropTypes.func.isRequired,
  activeLayoutLabel: PropTypes.string.isRequired,
  touchFontSizeLabel: PropTypes.string.isRequired,
  isTwoColumns: PropTypes.bool.isRequired,
  showProgressionMarkers: PropTypes.bool.isRequired,
};

export default ToolBoxEditControls;
