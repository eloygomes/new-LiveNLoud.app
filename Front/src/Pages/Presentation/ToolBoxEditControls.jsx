import PropTypes from "prop-types";

const getColumnIndexFromLabel = (value = "") => {
  const normalizedValue = String(value).trim();
  const numericValue = Number.parseInt(normalizedValue, 10);

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  const letters = normalizedValue.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return 1;

  return letters
    .split("")
    .reduce(
      (index, letter) => index * 26 + letter.charCodeAt(0) - 64,
      0,
    );
};

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
  touchFontSizeLabel,
  showProgressionMarkers,
  progressionBadgeSide,
  onChangeProgressionBadgeSide,
  onDecreaseFontSize,
  onIncreaseFontSize,
}) {
  const canEditCifra = Boolean(songCifraData);
  const marksEditorToggleLabel = marksEditorOpen ? "Close Mark Editor" : "Edit Marks";

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[14px] px-1 py-1">
        <div className="rounded-[18px] px-1 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="neuphormism-b-btn flex h-9 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.25rem] font-black leading-none text-black active:scale-[0.98]"
              onClick={onDecreaseFontSize}
              aria-label="Decrease font size"
            >
              -
            </button>
            <div className="min-w-0 flex-1 text-center text-[0.95rem] font-black leading-none tracking-tight text-black">
              {touchFontSizeLabel}
            </div>
            <button
              type="button"
              className="neuphormism-b-btn flex h-9 w-11 shrink-0 items-center justify-center rounded-[14px] text-[1.25rem] font-black leading-none text-black active:scale-[0.98]"
              onClick={onIncreaseFontSize}
              aria-label="Increase font size"
            >
              +
            </button>
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

      <div className="space-y-3">
        <div className="flex flex-col items-start gap-2 rounded-[14px] px-1 py-1">
          <div className="text-sm font-black text-black">Progression marks</div>
          <button
            type="button"
            className={`w-full rounded-[14px] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] ${
              showProgressionMarkers
                ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
                : "neuphormism-b-se text-black"
            }`}
            onClick={onToggleMarksVisibility}
          >
            {showProgressionMarkers ? "On" : "Off"}
          </button>
        </div>

        <div className="flex flex-col items-start gap-2 rounded-[14px] px-1 py-1">
          <div className="text-sm font-black text-black">Mark tag side</div>
          <button
            type="button"
            className="w-full rounded-[14px] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] neuphormism-b-se text-black"
            onClick={onChangeProgressionBadgeSide}
          >
            {progressionBadgeSide === "left" ? "Left" : "Right"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          className="rounded-md neuphormism-b-btn px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
          onClick={onToggleMarksEditor}
          disabled={!canEditCifra}
        >
          {marksEditorToggleLabel}
        </button>
        </div>
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
                      type="text"
                      value={entry.columnLabel || entry.position}
                      onChange={(event) =>
                        onChangeMarkPosition?.(
                          entry.blockKey,
                          getColumnIndexFromLabel(event.target.value),
                        )
                      }
                      aria-label={`Column for block ${entry.defaultPosition}`}
                      className="w-20 rounded-[10px] border border-gray-300 bg-white px-2 py-2 text-center text-sm font-black uppercase tracking-[0.12em] text-black outline-none"
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
      columnLabel: PropTypes.string,
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChangeMarkTitle: PropTypes.func.isRequired,
  onChangeMarkPosition: PropTypes.func.isRequired,
  touchFontSizeLabel: PropTypes.string.isRequired,
  showProgressionMarkers: PropTypes.bool.isRequired,
  progressionBadgeSide: PropTypes.oneOf(["left", "right"]).isRequired,
  onChangeProgressionBadgeSide: PropTypes.func.isRequired,
  onDecreaseFontSize: PropTypes.func.isRequired,
  onIncreaseFontSize: PropTypes.func.isRequired,
};

export default ToolBoxEditControls;
