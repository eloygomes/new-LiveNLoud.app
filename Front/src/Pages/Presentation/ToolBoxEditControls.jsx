import PropTypes from "prop-types";

function ToolBoxEditControls({
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
}) {
  return (
    <div className="flex flex-col gap-2">
      {isEditing ? (
        <>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={handleSaveCifra}
            disabled={isSavingCifra || !hasDraftChanges}
          >
            {isSavingCifra ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-800 disabled:opacity-50"
            onClick={handleDiscardDraft}
            disabled={isSavingCifra}
          >
            Delete
          </button>
        </>
      ) : (
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          onClick={startEditingCifra}
          disabled={!songCifraData}
        >
          Edit
        </button>
      )}
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
};

export default ToolBoxEditControls;
