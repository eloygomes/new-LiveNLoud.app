/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { FaChartLine } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

export default function DashboardSongActionSheet({
  selectedSong,
  instrumentLabels,
  renderInstrumentIcon,
  onClose,
  onOpenInstrument,
  onEditSong,
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(null);
  const activePointerId = useRef(null);

  if (!selectedSong) {
    return null;
  }

  const handleDragStart = (event) => {
    activePointerId.current = event.pointerId;
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleDragMove = (event) => {
    if (
      dragStartY.current === null ||
      activePointerId.current !== event.pointerId
    ) {
      return;
    }

    setDragOffset(Math.max(0, event.clientY - dragStartY.current));
  };

  const handleDragEnd = (event) => {
    if (activePointerId.current !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragStartY.current = null;
    activePointerId.current = null;

    if (dragOffset >= 72) {
      onClose();
      return;
    }

    setDragOffset(0);
  };

  return (
    <div className="fixed inset-0 z-[12200] bg-black/45">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close song actions"
        onClick={onClose}
      />

      <div
        className="absolute inset-x-0 bottom-0 z-[12201] max-h-[88vh] overflow-y-auto rounded-t-[22px] bg-[#f0f0f0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]"
        style={{
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          transform: `translateY(${dragOffset}px)`,
          transition: dragStartY.current === null ? "transform 180ms ease-out" : "none",
        }}
        onContextMenu={(event) => event.preventDefault()}
        onTouchStart={() => window.getSelection?.().removeAllRanges?.()}
        onMouseDown={() => window.getSelection?.().removeAllRanges?.()}
      >
        <button
          type="button"
          className="mx-auto mb-3 flex h-5 w-20 touch-none items-start justify-center"
          aria-label="Drag down to close song sheet"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span className="mt-0.5 h-1.5 w-12 rounded-full bg-[#c8c8c8]" />
        </button>

        <div className="rounded-[18px] border border-black/5 bg-white/55 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[1rem] font-bold leading-[1.1rem] text-black">
                {selectedSong.song || "N/A"}
              </div>
              <div className="mt-1 truncate text-[0.9rem] font-bold leading-[1rem] text-[goldenrod]">
                {selectedSong.artist || "N/A"}
              </div>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-black/5 text-black"
              onClick={onClose}
              aria-label="Close song sheet"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-black/5 bg-white/70 p-3 shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[goldenrod]/15 text-black">
            <FaChartLine className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
              Song progression
            </div>
            <div className="mt-1 text-[11px] font-semibold text-gray-500">
              Overall rehearsal readiness
            </div>
          </div>
          <div className="rounded-full bg-black px-3 py-1.5 text-[12px] font-bold text-white">
            {selectedSong.progressBar || 0}%
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[goldenrod]">
              Open presentation
            </div>
            <div className="mt-1 text-[12px] font-bold text-[#626878]">
              Choose an available instrument
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
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
                className={`flex min-h-14 items-center gap-2.5 rounded-[14px] border px-3 py-2.5 text-left ${
                  isEnabled
                    ? "border-[goldenrod] bg-[goldenrod] text-black shadow-[0_6px_16px_rgba(217,173,38,0.22)]"
                    : "border-black/5 bg-white/55 text-[#a4a4a4]"
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

        <div className="mt-5 border-t border-black/5 pt-4">
          <div
            className="mb-3 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
            role="status"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                selectedSong.offlineEnabled ? "bg-[goldenrod]" : "bg-gray-400"
              }`}
            />
            {selectedSong.offlineEnabled
              ? "Available offline"
              : "Online access only"}
          </div>
          <button
            type="button"
            className="min-h-12 w-full rounded-[14px] bg-[goldenrod] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black shadow-[0_6px_16px_rgba(217,173,38,0.22)]"
            onClick={() => onEditSong(selectedSong)}
          >
            Edit song
          </button>
        </div>
      </div>
    </div>
  );
}
