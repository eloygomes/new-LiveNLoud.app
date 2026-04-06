import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../Auth/AuthShell";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCurrentUserProfile,
  login as loginApi,
} from "../../Tools/Controllers";

function Login() {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login: loginContext } = useAuth(); // ✅ renomeia o do contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = await loginApi(userEmail, userPassword); // ✅ usa Controllers
      if (!accessToken) {
        // Controllers já mostra alert em caso de erro
        return;
      }

      // Atualiza o estado global de auth (se o seu contexto usa isso)
      loginContext(accessToken, userEmail);
      await fetchCurrentUserProfile();

      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login inválido. Verifique e-mail e senha.");
      setUserPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (userEmail) {
      navigate(`/newpassword?email=${encodeURIComponent(userEmail)}`);
    } else {
      alert("Insert a valid email");
    }
  };

  return (
    <AuthShell
      eyebrow="Public Access"
      title="Login"
      subtitle="Sign in to your workspace"
      panelTitle="Practice starts before the first note."
      panelCopy="Access your dashboard, manage charts, plan rehearsals and keep your collaborators aligned in the same environment."
    >
      <form className="space-y-5" noValidate onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Email
          </label>
          <input
            required
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="you@email.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Password
            </label>
            <button
              type="button"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[goldenrod]"
              onClick={handlePasswordReset}
            >
              Forgot Password
            </button>
          </div>
          <input
            required
            name="password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            className="w-full rounded-[20px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[goldenrod]"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="neuphormism-b-btn-gold w-full py-3 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex items-center justify-between gap-3 pt-2 text-sm text-gray-600">
          <span>Need a new account?</span>
          <Link
            to="/userregistration"
            className="font-bold uppercase tracking-[0.12em] text-[goldenrod]"
          >
            Create Account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export default Login;
