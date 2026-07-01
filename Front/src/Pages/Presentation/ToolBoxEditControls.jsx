import PropTypes from "prop-types";

function ToolBoxEditControls({
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  handleSaveCifra,
  handleDiscardDraft,
  isTouchLayout = false,
}) {
  if (!isEditing) return null;

  return (
    <div
      className={isTouchLayout ? "flex flex-col gap-2" : "flex flex-col gap-3"}
    >
      <button
        type="button"
        className={
          isTouchLayout
            ? "rounded-[14px] bg-green-700 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_12px_26px_rgba(21,128,61,0.34)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-[16px] bg-green-700 px-4 py-4 text-base font-black uppercase tracking-[0.08em] text-white shadow-[0_16px_32px_rgba(21,128,61,0.38)] transition hover:bg-green-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
            ? "rounded-[12px] border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.05em] text-red-700 shadow-[0_6px_14px_rgba(127,29,29,0.08)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            : "rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.05em] text-red-700 shadow-[0_8px_18px_rgba(127,29,29,0.1)] transition hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        }
        onClick={handleDiscardDraft}
        disabled={isSavingCifra}
      >
        Discard
      </button>
    </div>
  );
}

ToolBoxEditControls.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  isSavingCifra: PropTypes.bool.isRequired,
  hasDraftChanges: PropTypes.bool.isRequired,
  handleSaveCifra: PropTypes.func.isRequired,
  handleDiscardDraft: PropTypes.func.isRequired,
  isTouchLayout: PropTypes.bool,
};

export default ToolBoxEditControls;
