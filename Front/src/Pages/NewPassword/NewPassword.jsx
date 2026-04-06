import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../Auth/AuthShell";
import {
  requestPasswordReset,
  resetPassword,
} from "../../Tools/Controllers";

function NewPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialEmail = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";
  const isResetMode = useMemo(
    () => Boolean(initialEmail && resetToken),
    [initialEmail, resetToken],
  );

  const [requestEmail, setRequestEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const data = await requestPasswordReset(requestEmail);
      setStatus(
        data?.delivery === "smtp_not_configured" ||
          data?.delivery === "nodemailer_not_installed"
          ? "Reset solicitado. Configure o envio de e-mail no backend para receber o link em produção."
          : "Se o email existir, você receberá um link para redefinir a senha.",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Não foi possível solicitar a redefinição de senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");
    setSaved(false);

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      await resetPassword({
        email: initialEmail,
        token: resetToken,
        newPassword,
      });
      setSaved(true);
      setStatus("Senha atualizada com sucesso. Agora voce pode voltar para o login.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Não foi possível redefinir a senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password Access"
      title={isResetMode ? "Create New Password" : "Reset Password"}
      subtitle={isResetMode ? "Set a secure new password" : "Request a reset link"}
      panelTitle="Secure the next session."
      panelCopy="Reset access without leaving the same authentication flow already connected to the backend."
    >
      <form
        onSubmit={isResetMode ? handleResetPassword : handleRequestReset}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Email
          </label>
          <input
            type="email"
            value={isResetMode ? initialEmail : requestEmail}
            onChange={(e) => setRequestEmail(e.target.value)}
            disabled={isResetMode || loading}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[goldenrod] disabled:bg-gray-100"
            placeholder="you@email.com"
          />
        </div>

        {isResetMode ? (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[goldenrod]"
                disabled={loading}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[goldenrod]"
                disabled={loading}
                placeholder="Repeat your password"
              />
            </div>

            <p className="rounded-[18px] bg-white/70 px-4 py-3 text-[11px] leading-5 text-gray-500">
              The new password must have at least 8 characters and should be different from the previous one.
            </p>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {status ? <p className="text-sm text-green-700">{status}</p> : null}

        <button
          type="submit"
          disabled={loading || saved}
          className="neuphormism-b-btn-gold w-full py-3 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-60"
        >
          {loading
            ? "Processing..."
            : isResetMode
              ? "Save New Password"
              : "Request Reset"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3 text-sm">
        <Link to="/login" className="text-gray-600">
          Back to login
        </Link>
        {saved ? (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="neuphormism-b-btn px-4 py-2 text-xs font-bold uppercase"
          >
            Go to Login
          </button>
        ) : null}
      </div>
    </AuthShell>
  );
}

export default NewPassword;
