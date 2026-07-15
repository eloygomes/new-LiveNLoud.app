/* eslint-disable react/prop-types */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { BluetoothProvider } from "./contexts/BluetoothContext";
import { LanguageProvider } from "./contexts/LanguageContext";

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
import DrumMachine from "./Pages/DrumMachine/DrumMachine";
import EditSong from "./Pages/EditSong/EditSong";
import ChordLibrary from "./Pages/ChordLibrary/ChordLibrary";
import Tuner from "./Pages/Tuner/Tuner";
import Calendar from "./Pages/Calendar/Calendar";
import Presentation from "./Pages/Presentation/Presentation";
import BlankPresentation from "./Pages/Presentation/BlankPresentation";
import Login from "./Pages/Login/Login";
import NewPassword from "./Pages/NewPassword/NewPassword";
import UserRegistration from "./Pages/UserRegistration/UserRegistration";
import UserProfile from "./Pages/UserProfile/UserProfile";
import SpotifyCallback from "./Pages/Dashboard/SpotifyCallback";
import ToolsHub from "./Pages/Tools/ToolsHub";
import { registerServiceWorker } from "./registerServiceWorker";
import {
  ensureAuthenticatedSession,
  exportYouTubePlaylist,
  isOfflineModeEnabled,
  markOfflineReauthRequired,
} from "./Tools/Controllers";
// import YouTubeCallback from "./Pages/Dashboard/YouTubeCallback";

// Firebase Authentication

// Componente para proteger rotas
const ProtectedRoute = ({ element: Component, ...rest }) => {
  const [status, setStatus] = React.useState("checking");

  React.useEffect(() => {
    let active = true;

    ensureAuthenticatedSession().then((isAuthenticated) => {
      if (active) setStatus(isAuthenticated ? "authenticated" : "anonymous");
    });

    const handleOnline = () => {
      if (isOfflineModeEnabled()) {
        markOfflineReauthRequired(true);
        setStatus("anonymous");
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (status === "checking") return null;

  return status === "authenticated" ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

function pickStoredJwtToken() {
  const keys = ["accessToken", "access_token", "jwt", "token"];
  for (const key of keys) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value && String(value).trim()) return String(value).trim();
  }
  return null;
}

function normalizeSongsForYouTubeExport(list = []) {
  return (list || [])
    .map((song) => ({
      song: String(song?.song || song?.title || song?.name || "").trim(),
      artist: String(song?.artist || "").trim(),
    }))
    .filter((song) => song.song);
}

// ✅ Dedicated popup completion route for YouTube OAuth
const YouTubePopupDone = () => {
  const [searchParams] = useSearchParams();
  const yt = searchParams.get("yt");
  const reason = searchParams.get("reason");
  const [seconds, setSeconds] = React.useState(null);
  const [status, setStatus] = React.useState(
    yt === "ok" ? "working" : "error",
  );
  const [message, setMessage] = React.useState(
    yt === "ok"
      ? "Criando playlist no YouTube..."
      : `Nao foi possivel concluir a autenticacao${reason ? `: ${reason}` : "."}`,
  );
  const [summary, setSummary] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function finishWithError(errorMessage) {
      if (!active) return;
      setStatus("error");
      setMessage(errorMessage);
      setSeconds(5);
      try {
        window.opener?.postMessage(
          {
            type: "YT_EXPORT_ERROR",
            href: window.location.href,
            message: errorMessage,
          },
          window.location.origin,
        );
      } catch (e) {
        console.error("[YT DONE] failed to postMessage export error", e);
      }
    }

    async function exportFromPopupStorage() {
      if (yt !== "ok") {
        await finishWithError(
          reason || "OAuth do YouTube falhou. Tente novamente.",
        );
        return;
      }

      try {
        const playlistName = String(
          sessionStorage.getItem("youtube_playlist_name") || "",
        ).trim();
        const rawSongs = sessionStorage.getItem("youtube_playlist_songs") || "[]";
        const songs = normalizeSongsForYouTubeExport(JSON.parse(rawSongs));
        const token = pickStoredJwtToken();

        if (!playlistName || !songs.length) {
          throw new Error("Nao encontrei nome ou musicas para exportar.");
        }

        if (!token) {
          throw new Error("Nao encontrei o token do usuario. Faca login novamente.");
        }

        const data = await exportYouTubePlaylist({
          playlistName,
          songs,
          privacyStatus: "public",
          token,
        });

        if (!active) return;

        sessionStorage.removeItem("youtube_playlist_name");
        sessionStorage.removeItem("youtube_playlist_songs");
        sessionStorage.removeItem("yt_export_attempted");

        const added = data?.added ?? "?";
        const notFound = data?.notFound?.length ?? 0;
        setStatus("success");
        setMessage("Playlist criada no YouTube.");
        setSummary(`Itens adicionados: ${added}. Nao encontrados: ${notFound}.`);
        setSeconds(3);

        try {
          window.opener?.postMessage(
            {
              type: "YT_EXPORT_OK",
              href: window.location.href,
              added,
              notFound,
            },
            window.location.origin,
          );
        } catch (e) {
          console.error("[YT DONE] failed to postMessage export success", e);
        }
      } catch (error) {
        await finishWithError(
          `Falha ao criar playlist: ${error?.message || "erro"}`,
        );
      }
    }

    exportFromPopupStorage();

    return () => {
      active = false;
    };
  }, [yt, reason]);

  React.useEffect(() => {
    if (seconds === null) return undefined;
    const id = setInterval(() => {
      setSeconds((s) => (s === null ? null : s - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [seconds]);

  React.useEffect(() => {
    if (seconds !== null && seconds <= 0) {
      try {
        window.close();
      } catch {
        // ignore
      }
    }
  }, [seconds]);

  const canClose = seconds === null || seconds > 0;
  const isOk = status === "success";

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
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
          {status === "working"
            ? "Criando playlist"
            : isOk
              ? "Playlist criada"
              : "Falha no YouTube"}
        </div>

        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>
          {message}
        </div>

        {summary ? (
          <div style={{ fontSize: 12, opacity: 0.78, marginBottom: 14 }}>
            {summary}
          </div>
        ) : null}

        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 14 }}>
          {seconds === null
            ? "Aguarde..."
            : canClose
              ? `Fechando automaticamente em ${seconds}s...`
              : "Fechando..."}
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

const PresentationRoute = () => {
  return <Presentation />;
};

const DashboardRoute = () => {
  const [searchParams] = useSearchParams();
  return searchParams.has("yt") ? (
    <YouTubePopupDone />
  ) : (
    <ProtectedRoute element={Dashboard} />
  );
};

// Configuração das rotas
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/newpassword" element={<NewPassword />} />
      <Route path="/userregistration" element={<UserRegistration />} />

      {/* ✅ Callback leve para popup do YouTube (NÃO protegido) */}
      <Route path="/yt/done" element={<YouTubePopupDone />} />

      {/* 🔑 Callback do Spotify (NÃO protegido) */}
      <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
      {/* <Route path="/auth/youtube/callback" element={<YouTubeCallback />} /> */}

      {/* Rotas com menu / protegidas */}
      <Route element={<Menu />}>
        <Route
          path="/tools"
          element={<ProtectedRoute element={ToolsHub} />}
        />
        <Route
          path="/chordlibrary"
          element={<ProtectedRoute element={ChordLibrary} />}
        />
        <Route path="/" element={<DashboardRoute />} />
        <Route
          path="/editsong/:artist/:song"
          element={<ProtectedRoute element={EditSong} />}
        />
        <Route
          path="/metronome"
          element={<ProtectedRoute element={Metronome} />}
        />
        <Route
          path="/drum-machine"
          element={<ProtectedRoute element={DrumMachine} />}
        />
        <Route
          path="/calendar"
          element={<ProtectedRoute element={Calendar} />}
        />
        <Route path="/newsong" element={<ProtectedRoute element={NewSong} />} />
        <Route
          path="/presentation/:artist/:song/:instrument"
          element={<ProtectedRoute element={PresentationRoute} />}
        />
        <Route
          path="/blankpresentation/:artist/:song/:instrument"
          element={<ProtectedRoute element={BlankPresentation} />}
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

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("REMOVED_MONGO_USER")).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <BluetoothProvider>
          <RouterProvider router={router} />
        </BluetoothProvider>
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>,
);
