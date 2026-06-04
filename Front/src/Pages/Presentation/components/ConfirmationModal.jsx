function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4">
      <div className="neuphormism-b w-full max-w-sm rounded-[18px] bg-[#ececec] p-4 text-black shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
        <div className="mb-2 text-lg font-bold tracking-tight">{title}</div>
        <p className="text-sm font-bold leading-relaxed text-black/70">
          {message}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="neuphormism-b-btn rounded-[14px] px-4 py-3 text-sm font-bold text-black"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="neuphormism-b-btn-red-cancel rounded-[14px] px-4 py-3 text-sm font-bold text-black"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
