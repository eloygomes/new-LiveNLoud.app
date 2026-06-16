/* eslint-disable react/prop-types */
import { IoClose } from "react-icons/io5";

export default function DashboardSongActionSheet({
  selectedSong,
  instrumentLabels,
  availableInstrumentCount,
  renderInstrumentIcon,
  onClose,
  onOpenInstrument,
  onEditSong,
  onToggleOffline,
}) {
  if (!selectedSong) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[12200] bg-black/45">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close song actions"
        onClick={onClose}
      />

      <div
        className="absolute inset-x-0 bottom-0 z-[12201] max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-[#f0f0f0] px-4 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom)))] pt-4 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]"
        style={{
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={() => window.getSelection?.().removeAllRanges?.()}
        onMouseDown={() => window.getSelection?.().removeAllRanges?.()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#c8c8c8]" />

        <div className="rounded-[22px] bg-[#e8e8e8] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[goldenrod]">
            # sustenido
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[1.12rem] font-bold leading-[1.15rem] text-black">
                {selectedSong.song || "N/A"}
              </div>
              <div className="mt-1 truncate text-[0.9rem] font-bold leading-[1rem] text-[goldenrod]">
                {selectedSong.artist || "N/A"}
              </div>
            </div>
            <button
              type="button"
              className="rounded-full bg-black/5 p-2 text-black"
              onClick={onClose}
              aria-label="Close song sheet"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-2 rounded-[18px] bg-[#f7f7f7] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
              Progression
            </div>
            <div className="rounded-full bg-black px-3 py-1 text-[12px] font-bold text-white">
              {selectedSong.progressBar || 0}%
            </div>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e2e2e2]">
            <div
              className="h-full rounded-full bg-[goldenrod]"
              style={{ width: `${selectedSong.progressBar || 0}%` }}
            />
          </div>
        </div>

        <div className="mt-3 px-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
            Open presentation
          </div>
          <div className="mt-1 text-[12px] font-bold text-[#626878]">
            Choose an available instrument
          </div>
        </div>

        <div className="my-3 grid grid-cols-2 gap-2">
          {instrumentLabels.map((instrument) => {
            const isEnabled = Boolean(selectedSong.instruments?.[instrument.key]);

            return (
              <button
                key={instrument.key}
                type="button"
                disabled={!isEnabled}
                onClick={() =>
                  isEnabled && onOpenInstrument(selectedSong, instrument.key)
                }
                className={`flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-left ${
                  isEnabled
                    ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(217,173,38,0.28)]"
                    : "bg-[#f5f5f5] text-[#a4a4a4]"
                }`}
              >
                {renderInstrumentIcon(instrument, isEnabled)}
                <div>
                  <div className="text-[12px] font-bold uppercase leading-none">
                    {instrument.modalLabel}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                    {isEnabled ? "Available" : "Unavailable"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            className={`flex-1 rounded-[16px] border px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] ${
              selectedSong.offlineEnabled
                ? "border-[goldenrod] bg-[goldenrod] text-black"
                : "border-[#cfcfcf] bg-[#f5f5f5] text-[#626878]"
            }`}
            onClick={() => onToggleOffline?.(selectedSong)}
          >
            {selectedSong.offlineEnabled ? "Offline ON" : "Offline OFF"}
          </button>
          <button
            type="button"
            className="flex-1 rounded-[16px] bg-[goldenrod] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-black shadow-[0_8px_18px_rgba(217,173,38,0.28)]"
            onClick={() => onEditSong(selectedSong)}
          >
            Edit song
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center rounded-[16px] border border-[goldenrod] bg-[#f5f5f5] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#a27b13]">
          {availableInstrumentCount} instruments
        </div>
      </div>
    </div>
  );
}
