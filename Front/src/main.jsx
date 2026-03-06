/* eslint-disable react/prop-types */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { BluetoothProvider } from "./contexts/BluetoothContext";

// Router
import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
  RouterProvider,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import Menu from "./Layouts/Menu";
import Dashboard from "./Pages/Dashboard/Dashboard";
import NewSong from "./Pages/NewSong/NewSong";
import Metronome from "./Pages/Metronome/Metronome";
import EditSong from "./Pages/EditSong/EditSong";
import ChordLibrary from "./Pages/ChordLibrary/ChordLibrary";
import Tuner from "./Pages/Tuner/Tuner";
import Presentation from "./Pages/Presentation/Presentation";
import Login from "./Pages/Login/Login";
import UserRegistration from "./Pages/UserRegistration/UserRegistration";
import UserProfile from "./Pages/UserProfile/UserProfile";
import SpotifyCallback from "./Pages/Dashboard/SpotifyCallback";
// import YouTubeCallback from "./Pages/Dashboard/YouTubeCallback";

// Firebase Authentication

// Componente para proteger rotas
const ProtectedRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("token");

  return token ? <Component {...rest} /> : <Navigate to="/login" />;
};

// ✅ Dedicated popup completion route for YouTube OAuth
const YouTubePopupDone = () => {
  const [searchParams] = useSearchParams();
  const yt = searchParams.get("yt");
  const [seconds, setSeconds] = React.useState(10);

  React.useEffect(() => {
    // Try to notify the opener that OAuth finished.
    // This can be blocked if COOP is set to `same-origin` (fix via NGINX: same-origin-allow-popups).
    if (yt === "ok") {
      try {
        window.opener?.postMessage(
          { type: "YT_OAUTH_OK", href: window.location.href },
          window.location.origin,
        );
      } catch (e) {
        // Do not hard-fail; user can still close manually.
        console.error("[YT DONE] failed to postMessage to opener", e);
      }
    }

    const id = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [yt]);

  React.useEffect(() => {
    if (seconds < 0) {
      try {
        window.close();
      } catch {
        // ignore
      }
    }
  }, [seconds]);

  const canClose = seconds >= 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "#0b0b0b",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <div
        style={{
          width: "min(460px, 92vw)",
          background: "#121212",
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
          ✅ YouTube conectado
        </div>

        {yt === "ok" ? (
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14 }}>
            Autenticação concluída. A janela principal vai continuar o export.
          </div>
        ) : (
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14 }}>
            Não detectei <code style={{ color: "#ddd" }}>yt=ok</code> na URL. Se
            algo falhar, volte para o app e tente novamente.
          </div>
        )}

        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 14 }}>
          {canClose ? `Fechando automaticamente em ${seconds}s…` : "Fechando…"}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              try {
                window.close();
              } catch {
                // ignore
              }
            }}
            style={{
              border: "1px solid #666",
              background: "#1d1d1d",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Fechar
          </button>
        </div>

        <div
          style={{ marginTop: 12, fontSize: 11, opacity: 0.7, lineHeight: 1.4 }}
        >
          Se esta janela n\u00e3o fechar automaticamente, talvez o navegador
          esteja bloqueando
          <code style={{ color: "#ddd" }}>window.close()</code>. Voc\u00ea pode
          fechar manualmente.
        </div>
      </div>
    </div>
  );
};

// Configuração das rotas
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/userregistration" element={<UserRegistration />} />

      {/* ✅ Callback leve para popup do YouTube (NÃO protegido) */}
      <Route path="/yt/done" element={<YouTubePopupDone />} />

      {/* 🔑 Callback do Spotify (NÃO protegido) */}
      <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
      {/* <Route path="/auth/youtube/callback" element={<YouTubeCallback />} /> */}

      {/* Rotas com menu / protegidas */}
      <Route element={<Menu />}>
        <Route
          path="/chordlibrary"
          element={<ProtectedRoute element={ChordLibrary} />}
        />
        <Route path="/" element={<ProtectedRoute element={Dashboard} />} />
        <Route
          path="/editsong/:artist/:song"
          element={<ProtectedRoute element={EditSong} />}
        />
        <Route
          path="/metronome"
          element={<ProtectedRoute element={Metronome} />}
        />
        <Route path="/newsong" element={<ProtectedRoute element={NewSong} />} />
        <Route
          path="/presentation/:artist/:song/:instrument"
          element={<ProtectedRoute element={Presentation} />}
        />
        <Route path="/tuner" element={<ProtectedRoute element={Tuner} />} />
        <Route
          path="/userprofile/:userid"
          element={<ProtectedRoute element={UserProfile} />}
        />
      </Route>
    </>,
  ),
);

ReactDOM.createRoot(document.getElementById("REMOVED_MONGO_USER")).render(
  <React.StrictMode>
    <AuthProvider>
      <BluetoothProvider>
        <RouterProvider router={router} />
      </BluetoothProvider>
    </AuthProvider>
  </React.StrictMode>,
);
