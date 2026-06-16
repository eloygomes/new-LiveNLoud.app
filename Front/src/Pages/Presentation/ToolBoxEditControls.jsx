import PropTypes from "prop-types";

function ToolBoxEditControls({
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
  isTouchLayout = false,
}) {
  const canEditCifra = Boolean(songCifraData);

  return (
    <div
      className={isTouchLayout ? "flex flex-col gap-3" : "flex flex-col gap-4"}
    >
      {!isEditing ? (
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            className={
              isTouchLayout
                ? "rounded-md neuphormism-b-btn-gold bg-[#d9ad26] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                : "rounded-md neuphormism-b-btn-gold bg-[#d9ad26] px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
            }
            onClick={startEditingCifra}
            disabled={!canEditCifra}
          >
            Edit
          </button>
        </div>
      ) : null}

      {isEditing ? (
        <div
          className={
            isTouchLayout
              ? "grid grid-cols-1 gap-2 pt-1"
              : "grid grid-cols-1 gap-3 pt-1"
          }
        >
          <button
            type="button"
            className={
              isTouchLayout
                ? "rounded-[12px] neuphormism-b-btn-green-save px-4 py-2.5 text-sm font-bold tracking-[0.02em] text-white shadow-[0_8px_18px_rgba(28,120,24,0.18)] disabled:opacity-50"
                : "rounded-[14px] neuphormism-b-btn-green-save px-4 py-3.5 text-base font-bold tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(28,120,24,0.22)] disabled:opacity-50"
            }
            onClick={handleSaveCifra}
            disabled={isSavingCifra || !hasDraftChanges}
          >
            {isSavingCifra ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className={
              isTouchLayout
                ? "rounded-[12px] neuphormism-b-btn-red-cancel px-4 py-2.5 text-xs font-bold text-gray-800 disabled:opacity-50"
                : "rounded-[14px] neuphormism-b-btn-red-cancel px-4 py-3 text-sm font-bold text-gray-800 disabled:opacity-50"
            }
            onClick={handleDiscardDraft}
            disabled={isSavingCifra}
          >
            Discard
          </button>
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
  isTouchLayout: PropTypes.bool,
};

export default ToolBoxEditControls;
