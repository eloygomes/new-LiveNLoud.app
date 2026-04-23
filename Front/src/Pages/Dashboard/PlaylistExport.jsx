/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { FaSpotify, FaYoutube } from "react-icons/fa";

import { pickJwtToken, startYouTubeLoginPopup } from "./youtubeAuth";
import { startSpotifyLogin } from "./spotifyAuth";
import { formatDisplayDate } from "../../Tools/dateFormat";

function normalizeSongsForExport(list = []) {
  // Backend expects: [{ song, artist }]
  // Robust: only require `song`; allow missing `artist`.
  return (list || [])
    .map((s) => ({
      song: String(s?.song || s?.title || s?.name || "").trim(),
      artist: String(s?.artist || "").trim(),
    }))
    .filter((s) => s.song);
}

export default function PlaylistExport({ visibleSongs = [] }) {
  const disabled = !visibleSongs?.length;

  const defaultName = useMemo(() => {
    const date = formatDisplayDate(new Date());
    const count = visibleSongs?.length || 0;
    return `Sustenido • ${count} músicas • ${date}`;
  }, [visibleSongs]);

  const [mode, setMode] = useState("idle"); // idle | naming | working
  const [provider, setProvider] = useState(null); // spotify | youtube | null
  const [playlistName, setPlaylistName] = useState(defaultName);
  const [statusLine, setStatusLine] = useState("");

  function goToNaming(nextProvider) {
    setProvider(nextProvider);
    setPlaylistName(defaultName);
    setStatusLine("");
    setMode("naming");
  }

  function cancelNaming() {
    setProvider(null);
    setStatusLine("");
    setMode("idle");
  }

  async function confirmAndStart() {
    const name = String(playlistName || "").trim();
    if (!name) return;

    // console.log("[PLAYLIST_EXPORT] start", {
    //   provider,
    //   songs: visibleSongs?.length || 0,
    //   name,
    // });
    // console.log("[PLAYLIST_EXPORT] current location", {
    //   href: window.location.href,
    //   pathname: window.location.pathname,
    //   search: window.location.search,
    // });

    setMode("working");
    setStatusLine("");

    // ======================
    // SPOTIFY (já existente)
    // ======================
    if (provider === "spotify") {
      sessionStorage.setItem("spotify_playlist_name", name);
      sessionStorage.setItem(
        "spotify_playlist_songs",
        JSON.stringify(visibleSongs || []),
      );

      setStatusLine("Redirecionando para o Spotify…");
      startSpotifyLogin();
      return;
    }

    // ======================
    // YOUTUBE (NOVO: backend)
    // ======================
    if (provider === "youtube") {
      console.group("[YT EXPORT] pre-redirect snapshot");
      // console.log("songs visible", {
      //   count: (visibleSongs || []).length,
      //   sample: (visibleSongs || []).slice(0, 1),
      // });
      // console.log("defaultName", defaultName);
      // console.log("playlistName", name);
      // console.log("token keys", {
      //   accessToken: !!localStorage.getItem("accessToken"),
      //   access_token: !!localStorage.getItem("access_token"),
      //   jwt: !!localStorage.getItem("jwt"),
      //   token: !!localStorage.getItem("token"),
      // });
      console.groupEnd();

      // ✅ salva igual ao Spotify (pra sobreviver ao redirect OAuth)
      sessionStorage.setItem("youtube_playlist_name", name);
      sessionStorage.setItem(
        "youtube_playlist_songs",
        JSON.stringify(visibleSongs || []),
      );

      setStatusLine("Abrindo login do YouTube (popup)…");

      try {
        await startYouTubeLoginPopup({
          // IMPORTANT: return to a page that mounts this component in the popup.
          // Now using dedicated /yt/done route for popup completion.
          returnTo: "/yt/done",
        });

        // After popup success, trigger export directly from current page.
        setStatusLine("Conectado. Iniciando exportação…");
        window.postMessage(
          { type: "YT_OAUTH_OK", from: "self" },
          window.location.origin,
        );
      } catch (e) {
        console.error("[YT EXPORT] popup auth failed", e);
        setMode("idle");
        setStatusLine(`❌ Falha no login do YouTube: ${e?.message || "erro"}`);
      }
      return;
    }
  }

  // ✅ Quando voltar do OAuth: ?yt=ok&returnTo=...
  useEffect(() => {
    console.group("[YT EXPORT] callback effect mounted");
    // console.log("location", {
    //   href: window.location.href,
    //   pathname: window.location.pathname,
    //   search: window.location.search,
    // });

    // If this page is running inside the popup AND we have yt=ok, report back to opener and close.
    // Note: embedding Google in an iframe/modal is blocked; popup is the supported approach.
    const isPopup = !!window.opener && window.opener !== window;

    const params = new URLSearchParams(window.location.search);
    const yt = params.get("yt");

    const hasStoredSongs = !!sessionStorage.getItem("youtube_playlist_songs");
    const attempted = sessionStorage.getItem("yt_export_attempted") === "1";

    // Trigger if yt=ok OR we have stored payload (fallback), but never retry endlessly
    const shouldTrigger = yt === "ok" || hasStoredSongs;
    // console.log("trigger check", {
    //   yt,
    //   hasStoredSongs,
    //   attempted,
    //   shouldTrigger,
    //   storedName: sessionStorage.getItem("youtube_playlist_name"),
    //   rawSongsLen: (sessionStorage.getItem("youtube_playlist_songs") || "")
    //     .length,
    // });

    function runExportFromStorage() {
      let cancelled = false;

      async function runExportFromStorageInner() {
        const storedName =
          sessionStorage.getItem("youtube_playlist_name") || "";
        const rawSongs =
          sessionStorage.getItem("youtube_playlist_songs") || "[]";

        const name = String(storedName).trim();
        let songs = [];
        try {
          songs = JSON.parse(rawSongs);
        } catch {
          songs = [];
        }

        const payloadSongs = normalizeSongsForExport(songs);
        // console.log("[YT EXPORT] payload build", {
        //   name,
        //   parsedSongsCount: (songs || []).length,
        //   payloadSongsCount: (payloadSongs || []).length,
        //   payloadSample: (payloadSongs || []).slice(0, 3),
        // });

        if (!name || !payloadSongs.length) {
          setProvider("youtube");
          setMode("idle");
          setStatusLine(
            "Nada para exportar (nome ou músicas vazias no sessionStorage).",
          );
          sessionStorage.removeItem("yt_export_attempted");
          console.groupEnd();
          try {
            window.history.replaceState({}, "", window.location.pathname);
          } catch {
            // ignore
          }
          return;
        }

        const token = pickJwtToken();
        // console.log("[YT EXPORT] token", {
        //   ok: !!token,
        //   length: token ? token.length : 0,
        //   preview: token ? token.slice(0, 12) + "…" : "",
        // });

        if (!token) {
          setProvider("youtube");
          setMode("idle");
          setStatusLine(
            "Você conectou no YouTube, mas não achei seu JWT (faça login de novo no app).",
          );
          sessionStorage.removeItem("yt_export_attempted");
          console.groupEnd();
          return;
        }

        async function runExport() {
          try {
            setProvider("youtube");
            setMode("working");
            setStatusLine("Criando playlist no YouTube…");

            // console.log("[YT EXPORT] POST /api/youtube/export", {
            //   playlistName: name,
            //   songs: payloadSongs.length,
            //   privacyStatus: "public",
            // });

            const resp = await fetch("/api/youtube/export", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                playlistName: name,
                songs: payloadSongs,
                privacyStatus: "public",
              }),
            });

            const respText = await resp.text().catch(() => "");
            // console.log("[YT EXPORT] response", {
            //   ok: resp.ok,
            //   status: resp.status,
            //   textPreview: respText.slice(0, 400),
            // });

            let data = {};
            try {
              data = respText ? JSON.parse(respText) : {};
            } catch {
              data = { raw: respText };
            }

            if (!resp.ok) {
              const msg =
                data?.message || data?.error || `Erro HTTP ${resp.status}`;
              throw new Error(msg);
            }

            if (cancelled) return;

            setStatusLine(
              `✅ Playlist criada! Itens adicionados: ${
                data?.added ?? "?"
              } • Não encontrados: ${data?.notFound?.length ?? 0}`,
            );

            sessionStorage.removeItem("youtube_playlist_name");
            sessionStorage.removeItem("youtube_playlist_songs");
            sessionStorage.removeItem("yt_export_attempted");
            console.groupEnd();
            try {
              window.history.replaceState({}, "", window.location.pathname);
            } catch {
              // ignore
            }
          } catch (err) {
            console.error("[YT EXPORT] failed:", err);
            if (cancelled) return;

            setMode("idle");
            setStatusLine(
              `❌ Falha ao exportar no YouTube: ${err?.message || "erro"}`,
            );

            sessionStorage.removeItem("yt_export_attempted");
            console.groupEnd();
            try {
              window.history.replaceState({}, "", window.location.pathname);
            } catch {
              // ignore
            }
          }
        }

        await runExport();
      }

      // Keep reference for the message handler
      // eslint-disable-next-line no-inner-declarations
      async function runExportFromStorageWrapper() {
        return runExportFromStorageInner();
      }

      // Expose to onMessage via closure
      // (do not attach to window)
      return runExportFromStorageWrapper();
    }

    function onMessage(ev) {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== "YT_OAUTH_OK") return;

      // console.log("[YT EXPORT] received YT_OAUTH_OK message", data);

      // Force trigger using stored payload even if URL does not have yt=ok (popup flow)
      if (attempted) {
        // console.log("[YT EXPORT] already attempted, ignoring message");
        return;
      }

      // Mark attempt and run the same flow below by faking the conditions.
      sessionStorage.setItem("yt_export_attempted", "1");
      // console.log("[YT EXPORT] marked attempted (via message)");

      // Re-run the export logic by calling runExportFromStorage()
      runExportFromStorage();
    }

    window.addEventListener("message", onMessage);

    // If URL indicates completion, run immediately
    if (yt === "ok") {
      // Mark attempt early to avoid loops
      sessionStorage.setItem("yt_export_attempted", "1");
      // console.log("[YT EXPORT] marked attempted (via url)");
      runExportFromStorage();
    }

    if (!shouldTrigger || attempted) {
      // console.log("[YT EXPORT] not triggering", { shouldTrigger, attempted });
      console.groupEnd();
      return () => {
        window.removeEventListener("message", onMessage);
      };
    }

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const providerLabel =
    provider === "spotify"
      ? "Spotify"
      : provider === "youtube"
        ? "YouTube"
        : "";

  return (
    <section className="neuphormism-b p-4">
      <div className="flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-black uppercase">Playlists</h1>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">
              Create a playlist with the visible songs.
            </p>
          </div>
          <div className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-black text-gray-600">
            {visibleSongs?.length || 0} songs
          </div>
        </div>

        {mode === "idle" && (
          <>
            {!!statusLine && (
              <p className="mt-3 text-[11px] text-gray-500">{statusLine}</p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => goToNaming("spotify")}
                disabled={disabled}
                className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-black transition-transform
                  ${
                    disabled
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "border  hover:bg-[goldenrod] hover:border-[goldenrod] hover:text-black active:scale-95 text-[#9ca3af]"
                  }`}
              >
                <FaSpotify className="text-lg" />
                Spotify
              </button>

              <button
                type="button"
                onClick={() => goToNaming("youtube")}
                disabled={disabled}
                className={`neuphormism-b-btn flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-black transition-transform
                  ${
                    disabled
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "border  hover:bg-[goldenrod] hover:border-[goldenrod] hover:text-black active:scale-95 text-[#9ca3af]"
                  }`}
              >
                <FaYoutube className="text-lg" />
                YouTube
              </button>
            </div>
          </>
        )}

        {mode === "naming" && (
          <>
            <div className="flex items-center gap-2 mb-2">
              {provider === "spotify" ? (
                <FaSpotify className="text-lg text-gray-500" />
              ) : (
                <FaYoutube className="text-lg text-gray-500" />
              )}
              <h2 className="text-gray-500 font-bold text-sm">
                Nome da playlist ({providerLabel})
              </h2>
            </div>

            <input
              autoFocus
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelNaming();
                if (e.key === "Enter") confirmAndStart();
              }}
              className="w-full mt-1 mb-3 px-3 py-1 text-sm rounded-md bg-transparent border border-gray-500 text-gray-500 outline-none focus:border-[goldenrod]"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelNaming}
                className="flex items-center justify-center gap-2 w-32 h-10 rounded-md border border-red-500 text-red-400 hover:text-white hover:bg-red-500 text-sm"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmAndStart}
                disabled={!String(playlistName || "").trim()}
                className={`flex items-center justify-center gap-2 w-32 h-10 rounded-md font-semibold transition-transform text-sm 
                  ${
                    String(playlistName || "").trim()
                      ? "bg-[goldenrod] text-black active:scale-95"
                      : "bg-gray-500 text-white cursor-not-allowed"
                  }`}
              >
                {provider === "spotify" ? (
                  <>
                    <FaSpotify className="text-lg" /> Criar
                  </>
                ) : (
                  <>
                    <FaYoutube className="text-lg" /> Criar
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {mode === "working" && (
          <>
            <div className="flex items-center gap-2 mb-2">
              {provider === "spotify" ? (
                <FaSpotify className="text-lg text-[#9ca3af]" />
              ) : (
                <FaYoutube className="text-lg text-[#9ca3af]" />
              )}
              <h2 className="text-gray-600 font-bold text-sm">Processando…</h2>
            </div>

            <p className="text-gray-600 text-[11px]">
              {statusLine || "Executando… veja o console para detalhes."}
            </p>

            <div className="pt-3 text-[10px] text-gray-600">
              Criando playlist:{" "}
              <span className="text-gray-300">{playlistName}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
