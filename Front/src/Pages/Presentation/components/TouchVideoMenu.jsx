import { IoClose } from "react-icons/io5";

function TouchVideoMenu({ open, onClose, onCloseVideo }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/30">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label="Close video options"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#f2f2f2] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[1.4rem] font-black tracking-tight text-black">
            Video
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
            onClick={onClose}
            aria-label="Close video options"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          className="w-full rounded-[16px] bg-white px-4 py-4 text-left text-base font-black text-black shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
          onClick={onCloseVideo}
        >
          Close video
        </button>
      </div>
    </div>
  );
}

export default TouchVideoMenu;
