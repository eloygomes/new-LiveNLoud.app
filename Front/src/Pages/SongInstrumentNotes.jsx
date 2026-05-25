/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";

function SongInstrumentNotes({
  instrumentName,
  value = "",
  onChange,
  onSave,
  onClose,
  title,
  isSaving = false,
  mobile = false,
  autoFocus = true,
}) {
  const [draft, setDraft] = useState(value || "");
  const textareaRef = useRef(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const saveDraft = () => {
    const plainText = String(draft || "");
    onChange?.(plainText);
    onSave?.(plainText);
  };

  return (
    <div
      className={
        mobile
          ? "flex max-h-[72dvh] flex-col"
          : "flex h-full min-h-[260px] flex-col rounded-[14px] bg-[linear-gradient(145deg,#efefef,#f0f0f0)] p-3 shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[goldenrod]">
            Notes
          </div>
          <div className="truncate text-lg font-black text-black">
            {title || instrumentName}
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            className="neuphormism-b-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-black"
            onClick={onClose}
            aria-label="Close notes"
          >
            <FaTimes className="text-sm" />
          </button>
        ) : null}
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange?.(event.target.value);
        }}
        className="min-h-[180px] flex-1 resize-none rounded-[12px] border border-[#d8d8d8] bg-[linear-gradient(145deg,#fafafa,#ffffff)] p-3 text-sm font-medium leading-5 text-black outline-none shadow-[inset_2px_2px_6px_#d2d2d2,inset_-2px_-2px_6px_#ffffff] focus:border-[goldenrod]"
        placeholder="Write notes for this instrument"
        spellCheck="true"
      />

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="neuphormism-b-btn-gold rounded-[12px] px-4 py-2 text-sm font-black text-black disabled:opacity-50"
          onClick={saveDraft}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}

export default SongInstrumentNotes;
