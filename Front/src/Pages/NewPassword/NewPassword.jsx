import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import musician from "../../assets/musician.jpg";
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
    <div className="flex justify-center h-screen pt-5">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto flex flex-col">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">
              {isResetMode ? "Create New Password" : "Reset Password"}
            </h1>
            <h4 className="ml-auto mt-auto text-sm">
              Secure access for your account
            </h4>
          </div>

          <div className="flex flex-row my-5 neuphormism-b p-5 h-[75vh]">
            <div className="w-1/2 flex items-center justify-center">
              <img src={musician} className="h-[70vh] object-cover" alt="" />
            </div>

            <div className="w-1/2 flex flex-col justify-center">
              <div className="mx-10 neuphormism-b p-8">
                <h2 className="text-2xl font-bold mb-2">
                  {isResetMode ? "Choose a new password" : "Request reset link"}
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  {isResetMode
                    ? "Use o link recebido por email para criar uma nova senha para a sua conta."
                    : "Enter your email and we will prepare a reset link for this account."}
                </p>

                <form
                  onSubmit={isResetMode ? handleResetPassword : handleRequestReset}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={isResetMode ? initialEmail : requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      disabled={isResetMode || loading}
                      className="w-full p-3 border border-gray-300 rounded input-neumorfismo bg-white"
                    />
                  </div>

                  {isResetMode && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold mb-2">
                          New password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded input-neumorfismo bg-white"
                          disabled={loading}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm font-semibold mb-2">
                          Confirm new password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded input-neumorfismo bg-white"
                          disabled={loading}
                        />
                      </div>

                      <p className="text-[11px] text-gray-500 leading-snug">
                        A nova senha precisa ter pelo menos 8 caracteres e nao pode ser igual a senha anterior.
                      </p>
                    </>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {status && <p className="text-sm text-green-700">{status}</p>}

                  <button
                    type="submit"
                    disabled={loading || saved}
                    className="neuphormism-b-btn-gold w-full py-3 mt-2"
                  >
                    {loading
                      ? "Processing..."
                      : isResetMode
                        ? "Save new password"
                        : "Request reset"}
                  </button>
                </form>

                <div className="text-sm pt-5 flex items-center justify-between">
                  <Link to="/login">Back to login</Link>
                  {saved && (
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="neuphormism-b-btn px-4 py-2"
                    >
                      Go to login
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewPassword;
