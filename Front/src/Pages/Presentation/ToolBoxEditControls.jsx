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
  blockSpacingLabel,
  onDecreaseBlockSpacing,
  onIncreaseBlockSpacing,
  showProgressionMarkers,
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

  const renderStepControl = ({
    label,
    value,
    decreaseLabel,
    increaseLabel,
    onDecrease,
    onIncrease,
    disabled = false,
  }) => (
    <div className="rounded-[16px] px-1 py-2">
      <div className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/55">
        {label}
      </div>
      <div
        className={`grid grid-cols-[2.6rem_minmax(0,1fr)_2.6rem] items-center gap-2 rounded-[16px] px-1 py-1 ${
          disabled ? "opacity-45" : ""
        }`}
      >
        <button
          type="button"
          className="neuphormism-b-btn flex h-10 w-full items-center justify-center rounded-[14px] text-[1.25rem] font-black leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
          onClick={onDecrease}
          disabled={disabled}
          aria-label={decreaseLabel}
        >
          -
        </button>
        <div
          className="min-w-0 rounded-[14px] bg-white/55 px-2 py-2.5 text-center text-sm font-black leading-none text-black"
          aria-label={`${label} value`}
        >
          {value}
        </div>
        <button
          type="button"
          className="neuphormism-b-btn flex h-10 w-full items-center justify-center rounded-[14px] text-[1.25rem] font-black leading-none text-black active:scale-[0.98] disabled:cursor-not-allowed"
          onClick={onIncrease}
          disabled={disabled}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  );

  const renderToggleControl = ({
    label,
    active,
    activeText,
    inactiveText,
    onClick,
  }) => (
    <div className="flex flex-col gap-2 rounded-[16px] px-1 py-2">
      <div className="text-sm font-black text-black">{label}</div>
      <button
        type="button"
        className={`flex h-[42px] w-full items-center justify-between rounded-[14px] px-3 text-sm font-black uppercase tracking-[0.1em] transition active:scale-[0.98] ${
          active
            ? "neuphormism-b-btn-gold bg-[goldenrod] text-black"
            : "neuphormism-b-se text-black"
        }`}
        onClick={onClick}
      >
        <span>{active ? activeText : inactiveText}</span>
        <span
          className={`h-4 w-8 rounded-full p-0.5 shadow-[inset_1px_1px_3px_rgba(190,190,190,0.45),inset_-1px_-1px_3px_rgba(255,255,255,0.85)] ${
            active ? "bg-[goldenrod]" : "bg-white"
          }`}
        >
          <span
            className={`block h-3 w-3 rounded-full bg-black transition ${
              active ? "translate-x-4" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );

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
    <div className="flex flex-col gap-5">
      {!isEditing ? (
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
      ) : null}

      <div className="space-y-5">
        {renderStepControl({
          label: "Block spacing",
          value: blockSpacingLabel,
          decreaseLabel: "Decrease block spacing",
          increaseLabel: "Increase block spacing",
          onDecrease: onDecreaseBlockSpacing,
          onIncrease: onIncreaseBlockSpacing,
        })}

        {renderToggleControl({
          label: "Progression marks",
          active: showProgressionMarkers,
          activeText: "On",
          inactiveText: "Off",
          onClick: onToggleMarksVisibility,
        })}

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

      {isEditing ? (
        <div className="grid grid-cols-1 gap-3 pt-1">
          <button
            type="button"
            className="rounded-[14px] neuphormism-b-btn-green-save px-4 py-3.5 text-base font-black tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(28,120,24,0.22)] disabled:opacity-50"
            onClick={handleSaveCifra}
            disabled={isSavingCifra || !hasDraftChanges}
          >
            {isSavingCifra ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="rounded-[14px] neuphormism-b-btn-red-cancel px-4 py-3 text-sm font-black text-gray-800 disabled:opacity-50"
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
  onToggleMarksVisibility: PropTypes.func.isRequired,
  blockSpacingLabel: PropTypes.string.isRequired,
  onDecreaseBlockSpacing: PropTypes.func.isRequired,
  onIncreaseBlockSpacing: PropTypes.func.isRequired,
  showProgressionMarkers: PropTypes.bool.isRequired,
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
