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
          : "flex h-full min-h-[260px] flex-col rounded-[14px] bg-[#f2f2f2] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
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
        className="min-h-[180px] flex-1 resize-none rounded-[12px] border border-gray-300 bg-white p-3 text-sm font-medium leading-5 text-black outline-none focus:border-[goldenrod]"
        placeholder="Write notes for this instrument"
        spellCheck="true"
      />

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="rounded-[12px] bg-[goldenrod] px-4 py-2 text-sm font-black text-black disabled:opacity-50"
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
