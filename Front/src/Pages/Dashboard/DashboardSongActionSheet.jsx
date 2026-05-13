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
        className="absolute inset-x-0 bottom-0 z-[12201] max-h-[84vh] overflow-y-auto rounded-t-[28px] bg-[#f0f0f0] px-4 pb-[max(6.5rem,calc(6.5rem+env(safe-area-inset-bottom)))] pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]"
        style={{
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={() => window.getSelection?.().removeAllRanges?.()}
        onMouseDown={() => window.getSelection?.().removeAllRanges?.()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#c8c8c8]" />

        <div className="rounded-[22px] bg-[#e8e8e8] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[goldenrod]">
            # sustenido
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[1.7rem] font-black uppercase leading-none text-black">
                {selectedSong.song || "N/A"}
              </div>
              <div className="mt-2 truncate text-[14px] font-bold text-[#626878]">
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

        <div className="mt-3 rounded-[20px] bg-[#f7f7f7] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[goldenrod]">
                Progression
              </div>
              <div className="mt-1 text-[15px] font-black text-black">
                Practice progress
              </div>
            </div>
            <div className="rounded-full bg-black px-3 py-1.5 text-[12px] font-black text-white">
              {selectedSong.progressBar || 0}%
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e2e2e2]">
            <div
              className="h-full rounded-full bg-[goldenrod]"
              style={{ width: `${selectedSong.progressBar || 0}%` }}
            />
          </div>
        </div>

        <div className="mt-3 px-1">
          <div className="mt-10 text-[10px] font-black uppercase tracking-[0.2em] text-[goldenrod]">
            Open presentation
          </div>
          <div className="mt-1 text-[12px] font-bold text-[#626878]">
            Choose an available instrument
          </div>
        </div>

        <div className="my-10 mt-3 grid grid-cols-2 gap-2">
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
                className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-left ${
                  isEnabled
                    ? "bg-[goldenrod] text-black shadow-[0_8px_18px_rgba(217,173,38,0.28)]"
                    : "bg-[#f5f5f5] text-[#a4a4a4]"
                }`}
              >
                {renderInstrumentIcon(instrument, isEnabled)}
                <div>
                  <div className="text-[12px] font-black uppercase leading-none">
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

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-[16px] border border-[goldenrod] bg-[#f5f5f5] px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-[#a27b13]"
            onClick={() => onToggleOffline?.(selectedSong)}
          >
            {selectedSong.offlineEnabled ? "Online only" : "Works offline"}
          </button>
          <button
            type="button"
            className="flex-1 rounded-[16px] bg-[goldenrod] px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-black shadow-[0_8px_18px_rgba(217,173,38,0.28)]"
            onClick={() => onEditSong(selectedSong)}
          >
            Edit song
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center rounded-[16px] border border-[goldenrod] bg-[#f5f5f5] px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-[#a27b13]">
          {availableInstrumentCount} instruments
        </div>
      </div>
    </div>
  );
}
