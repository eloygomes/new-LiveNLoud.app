import PropTypes from "prop-types";

function ToolBoxEditControls({
  isEditing,
  isSavingCifra,
  hasDraftChanges,
  songCifraData,
  handleSaveCifra,
  handleDiscardDraft,
  startEditingCifra,
  onToggleMarksVisibility,
  touchFontSizeLabel,
  showProgressionMarkers,
  progressionBadgeSide,
  onChangeProgressionBadgeSide,
  onDecreaseFontSize,
  onIncreaseFontSize,
  activeProgressionMarkSettings,
  onDecreaseActiveMarkWidth,
  onIncreaseActiveMarkWidth,
  onDecreaseActiveMarkHeight,
  onIncreaseActiveMarkHeight,
  onRequestDeleteActiveMark,
}) {
  const canEditCifra = Boolean(songCifraData);
  const markControlsEnabled =
    isEditing && Boolean(activeProgressionMarkSettings?.active);
  const activeMarkLabel = activeProgressionMarkSettings?.label || "--";

  const renderMarkDimensionControl = ({
    label,
    value,
    decreaseLabel,
    increaseLabel,
    onDecrease,
    onIncrease,
  }) => (
    <div className="rounded-[14px] px-1 py-1">
      <div className="mb-1 text-xs font-black uppercase tracking-[0.08em] text-black/65">
        {label}
      </div>
      <div
        className={`grid grid-cols-[2.4rem_minmax(0,1fr)_2.4rem] items-center gap-2 rounded-[14px] px-1 py-1 ${
          markControlsEnabled ? "" : "opacity-45"
        }`}
      >
        <button
          type="button"
          className="neuphormism-b-btn flex h-9 w-full items-center justify-center rounded-[14px] text-[1.2rem] font-black leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
          onClick={onDecrease}
          disabled={!markControlsEnabled}
          aria-label={decreaseLabel}
        >
          -
        </button>
        <div
          className="min-w-0 rounded-[14px] bg-white/45 px-2 py-2 text-center text-sm font-black leading-none text-black"
          aria-label={`${label} value`}
        >
          {`${value}px`}
        </div>
        <button
          type="button"
          className="neuphormism-b-btn flex h-9 w-full items-center justify-center rounded-[14px] text-[1.2rem] font-black leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
          onClick={onIncrease}
          disabled={!markControlsEnabled}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  );

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

        {markControlsEnabled ? (
          <div className="flex flex-col gap-2 rounded-[14px] px-1 py-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-black text-black">Selected mark</div>
              <div className="rounded-[999px] bg-white/60 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black/70">
                {activeMarkLabel}
              </div>
            </div>
            {renderMarkDimensionControl({
              label: "Width",
              value: activeProgressionMarkSettings?.width || 0,
              decreaseLabel: "Decrease selected mark width",
              increaseLabel: "Increase selected mark width",
              onDecrease: onDecreaseActiveMarkWidth,
              onIncrease: onIncreaseActiveMarkWidth,
            })}
            {renderMarkDimensionControl({
              label: "Height",
              value: activeProgressionMarkSettings?.height || 0,
              decreaseLabel: "Decrease selected mark height",
              increaseLabel: "Increase selected mark height",
              onDecrease: onDecreaseActiveMarkHeight,
              onIncrease: onIncreaseActiveMarkHeight,
            })}
            <button
              type="button"
              className="neuphormism-b-btn-red-cancel mt-1 w-full rounded-[14px] px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-45"
              onClick={onRequestDeleteActiveMark}
              disabled={!markControlsEnabled}
            >
              Delete block
            </button>
          </div>
        ) : null}
      </div>
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
  onToggleMarksVisibility: PropTypes.func.isRequired,
  touchFontSizeLabel: PropTypes.string.isRequired,
  showProgressionMarkers: PropTypes.bool.isRequired,
  progressionBadgeSide: PropTypes.oneOf(["left", "right"]).isRequired,
  onChangeProgressionBadgeSide: PropTypes.func.isRequired,
  onDecreaseFontSize: PropTypes.func.isRequired,
  onIncreaseFontSize: PropTypes.func.isRequired,
  activeProgressionMarkSettings: PropTypes.shape({
    active: PropTypes.bool,
    label: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    blockKeys: PropTypes.arrayOf(PropTypes.string),
  }),
  onDecreaseActiveMarkWidth: PropTypes.func,
  onIncreaseActiveMarkWidth: PropTypes.func,
  onDecreaseActiveMarkHeight: PropTypes.func,
  onIncreaseActiveMarkHeight: PropTypes.func,
  onRequestDeleteActiveMark: PropTypes.func,
};

export default ToolBoxEditControls;
