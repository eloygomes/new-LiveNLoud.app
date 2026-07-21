import { useState } from "react";

function formatDateTime(value) {
  if (!value) return "Nunca registrada";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ResetPasswordModal({ userEmail, lastPasswordChangedAt, resetRequestedAt, onCancel, onConfirm }) {
  const [typedEmail, setTypedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const passwordsMatch = newPassword === confirmPassword;
  const canConfirm =
    typedEmail === userEmail &&
    newPassword.length >= 8 &&
    passwordsMatch &&
    Boolean(reason.trim()) &&
    !submitting;

  async function submit() {
    if (!canConfirm) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm({ newPassword, reason: reason.trim() });
    } catch (submitError) {
      setError(submitError.message || "Nao foi possivel redefinir a senha.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Redefinir senha</h2>
        <p className="muted">
          A nova senha substitui a atual e encerra as sessoes existentes.
        </p>
        <div className="password-history">
          <div><strong>Ultima alteracao:</strong> {formatDateTime(lastPasswordChangedAt)}</div>
          <div><strong>Ultima solicitacao:</strong> {formatDateTime(resetRequestedAt)}</div>
        </div>
        <label>
          Confirme o email
          <input value={typedEmail} onChange={(event) => setTypedEmail(event.target.value)} placeholder={userEmail} autoComplete="off" />
        </label>
        <label>
          Nova senha
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Confirmar nova senha
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" />
        </label>
        {confirmPassword && !passwordsMatch ? <div className="error">As senhas nao coincidem.</div> : null}
        <label>
          Motivo
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
        </label>
        {error ? <div className="error">{error}</div> : null}
        {!canConfirm && !submitting ? (
          <div className="muted">
            Para habilitar: confirme exatamente o email, use ao menos 8 caracteres, repita a senha e informe o motivo.
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="button secondary" onClick={onCancel} disabled={submitting}>Cancelar</button>
          <button className="button danger" disabled={!canConfirm} onClick={submit}>
            {submitting ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </div>
      </div>
    </div>
  );
}
