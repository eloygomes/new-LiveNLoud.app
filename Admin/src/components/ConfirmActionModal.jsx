import { useState } from "react";

export function ConfirmActionModal({ title, confirmLabel = "Confirmar", expectedText, requireReason = true, onCancel, onConfirm }) {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const canConfirm = typed === expectedText && (!requireReason || reason.trim());

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{title}</h2>
        <label>
          Confirmacao
          <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={expectedText} />
        </label>
        {requireReason ? (
          <label>
            Motivo
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
          </label>
        ) : null}
        <div className="modal-actions">
          <button className="button secondary" onClick={onCancel}>Cancelar</button>
          <button className="button danger" disabled={!canConfirm} onClick={() => onConfirm({ reason })}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
