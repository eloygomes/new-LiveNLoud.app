/* eslint-disable react/prop-types */
import { FaLink, FaRegFileAlt, FaTimes } from "react-icons/fa";

export default function NewSongStartChoice({ open, onClose, onChooseLink }) {
  if (!open) return null;

  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth < 768;

  const handleBlank = () => {
    onClose?.();
  };

  const content = (
    <div
      className={
        isTouchLayout
          ? "absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-8 pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]"
          : "absolute left-1/2 top-1/2 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-[#f2f2f2] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
      }
    >
      {isTouchLayout ? (
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-300" />
      ) : null}

      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
            New song
          </p>
          <h2 className="mt-2 text-[2rem] font-black leading-none text-black">
            Choose how to start
          </h2>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
          onClick={onClose}
          aria-label="Close new song options"
        >
          <FaTimes />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="neuphormism-b-se flex items-center gap-3 rounded-[18px] px-4 py-4 text-left text-black"
          onClick={handleBlank}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] neuphormism-b-btn text-gray-500">
            <FaRegFileAlt />
          </span>
          <span>
            <span className="block text-lg font-black">Blank</span>
            <span className="mt-1 block text-xs font-bold text-gray-500">
              Coming soon
            </span>
          </span>
        </button>

        <button
          type="button"
          className="neuphormism-b-se flex items-center gap-3 rounded-[18px] px-4 py-4 text-left text-black"
          onClick={onChooseLink}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] neuphormism-b-btn text-[goldenrod]">
            <FaLink />
          </span>
          <span>
            <span className="block text-lg font-black">Link</span>
            <span className="mt-1 block text-xs font-bold text-gray-500">
              Add from a song URL
            </span>
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[12150] bg-black/25">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close new song options"
        onClick={onClose}
      />
      {content}
    </div>
  );
}
