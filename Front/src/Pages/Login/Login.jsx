import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../Auth/AuthShell";
import SnackBar from "../../Tools/SnackBar";
import { useAuth } from "../../contexts/AuthContext";
import {
  canOfflineLoginForEmail,
  fetchCurrentUserProfile,
  login as loginApi,
  tryOfflineLogin,
} from "../../Tools/Controllers";
import { setLocalStorageItemSafe } from "../../Tools/storageSafe";

const REMEMBERED_EMAIL_KEY = "auth:rememberedEmail";
const STAY_CONNECTED_KEY = "auth:stayConnected";

function Login() {
  const [userEmail, setUserEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
  });
  const [userPassword, setUserPassword] = useState("");
  const [stayConnected, setStayConnected] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STAY_CONNECTED_KEY);
    return stored === null ? true : stored === "true";
  });
  const [loading, setLoading] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    title: "",
    message: "",
  });
  const navigate = useNavigate();
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const canContinueOffline = canOfflineLoginForEmail(userEmail);

  const { login: loginContext } = useAuth(); // ✅ renomeia o do contexto

  useEffect(() => {
    if (!isOffline) return;
    if (!canOfflineLoginForEmail()) return;

    let active = true;
    tryOfflineLogin().then((allowed) => {
      if (!active || !allowed) return;
      setSnackbarMessage({
        title: "Offline Ready",
        message: "Stored session restored automatically.",
      });
      setShowSnackBar(true);
      navigate("/");
    });

    return () => {
      active = false;
    };
  }, [isOffline, navigate]);

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

      if (stayConnected) {
        setLocalStorageItemSafe(REMEMBERED_EMAIL_KEY, userEmail.trim());
        setLocalStorageItemSafe(STAY_CONNECTED_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        setLocalStorageItemSafe(STAY_CONNECTED_KEY, "false");
      }

      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      const offlineAllowed = await tryOfflineLogin(userEmail);

      if (offlineAllowed) {
        setSnackbarMessage({
          title: "Offline Active",
          message: "Stored session restored. Some songs still require internet.",
        });
        setShowSnackBar(true);
        navigate("/");
      } else {
        setSnackbarMessage({
          title: "Error",
          message:
            err?.response?.data?.error ||
            "Login inválido. Verifique e-mail e senha.",
        });
        setShowSnackBar(true);
        setUserPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (userEmail) {
      navigate(`/newpassword?email=${encodeURIComponent(userEmail)}`);
    } else {
      setSnackbarMessage({
        title: "Info",
        message: "Insert a valid email.",
      });
      setShowSnackBar(true);
    }
  };

  const handleContinueOffline = async () => {
    setLoading(true);
    try {
      const allowed = await tryOfflineLogin(userEmail);
      if (!allowed) {
        setSnackbarMessage({
          title: "Error",
          message: "Offline session unavailable for this user on this device.",
        });
        setShowSnackBar(true);
        return;
      }
      setSnackbarMessage({
        title: "Offline Ready",
        message: "Offline session restored.",
      });
      setShowSnackBar(true);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Public Access"
      title="Login"
      subtitle="Sign in to your workspace"
      panelTitle="Practice starts before the first note."
      panelCopy="Access your dashboard, manage charts, plan rehearsals and keep your collaborators aligned in the same environment."
      hideHeader
    >
      <div className={`${showSnackBar ? "block opacity-100" : "hidden"}`}>
        <SnackBar snackbarMessage={snackbarMessage} />
      </div>
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

        <label className="flex items-center gap-3 rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={stayConnected}
            onChange={(e) => setStayConnected(e.target.checked)}
            className="h-4 w-4 accent-[goldenrod]"
          />
          <span className="font-semibold">Stay connected</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="neuphormism-b-btn-gold w-full py-3 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {isOffline ? (
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-bold uppercase tracking-[0.12em]">
              Offline mode
            </p>
            <p className="mt-1 text-xs leading-5">
              Offline access is only allowed for a previously validated session on this device.
            </p>
            <button
              type="button"
              disabled={!canContinueOffline || loading}
              onClick={handleContinueOffline}
              className="mt-3 w-full rounded-[16px] border border-amber-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue Offline
            </button>
          </div>
        ) : null}

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
