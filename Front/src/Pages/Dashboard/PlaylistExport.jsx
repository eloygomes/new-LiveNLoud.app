/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaSpotify, FaYoutube } from "react-icons/fa";

import { startYouTubeLoginPopup } from "./youtubeAuth";
import { startSpotifyLogin } from "./spotifyAuth";
import { formatDisplayDate } from "../../Tools/dateFormat";

export default function PlaylistExport({
  visibleSongs = [],
  isMobileLayout = false,
}) {
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
        const result = await startYouTubeLoginPopup({
          // IMPORTANT: return to a page that mounts this component in the popup.
          // Now using dedicated /yt/done route for popup completion.
          returnTo: "/yt/done",
        });

        setStatusLine(
          `✅ Playlist criada! Itens adicionados: ${
            result?.added ?? "?"
          } • Não encontrados: ${result?.notFound ?? 0}`,
        );
        sessionStorage.removeItem("youtube_playlist_name");
        sessionStorage.removeItem("youtube_playlist_songs");
        sessionStorage.removeItem("yt_export_attempted");
        setMode("idle");
      } catch (e) {
        console.error("[YT EXPORT] popup auth failed", e);
        setMode("idle");
        setStatusLine(`❌ Falha no login do YouTube: ${e?.message || "erro"}`);
      }
      return;
    }
  }

  const providerLabel =
    provider === "spotify"
      ? "Spotify"
      : provider === "youtube"
        ? "YouTube"
        : "";

  return (
    <section className={isMobileLayout ? "rounded-[18px] border border-black/5 bg-white/55 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)]" : "neuphormism-b p-4"}>
      <div className="flex flex-col">
        <div className={`flex flex-wrap items-start justify-between gap-3 ${isMobileLayout ? "text-center" : ""}`}>
          <div className={isMobileLayout ? "min-w-0 flex-1" : ""}>
            <h1 className={`${isMobileLayout ? "text-xs" : "text-sm"} font-bold uppercase`}>Playlists</h1>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">
              Create a playlist with the visible songs.
            </p>
          </div>
          <div className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold text-gray-600">
            {visibleSongs?.length || 0} songs
          </div>
        </div>

        {mode === "idle" && (
          <>
            {!!statusLine && (
              <p className="mt-3 text-[11px] text-gray-500">{statusLine}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => goToNaming("spotify")}
                disabled={disabled}
                className={`${isMobileLayout ? "min-h-24 flex-col rounded-[14px] border border-black/5 bg-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.05)]" : "neuphormism-b-btn rounded-lg"} flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold transition-transform
                  ${
                    disabled
                      ? "bg-gray-400 cursor-not-allowed text-black opacity-60"
                      : "border text-black hover:bg-[goldenrod] hover:border-[goldenrod] active:scale-95"
                  }`}
              >
                <FaSpotify className={isMobileLayout ? "text-3xl text-[#1DB954]" : "text-lg text-[#1DB954]"} />
                Spotify
              </button>

              <button
                type="button"
                onClick={() => goToNaming("youtube")}
                disabled={disabled}
                className={`${isMobileLayout ? "min-h-24 flex-col rounded-[14px] border border-black/5 bg-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.05)]" : "neuphormism-b-btn rounded-lg"} flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold transition-transform
                  ${
                    disabled
                      ? "bg-gray-400 cursor-not-allowed text-black opacity-60"
                      : "border text-black hover:bg-[goldenrod] hover:border-[goldenrod] active:scale-95"
                  }`}
              >
                <FaYoutube className={isMobileLayout ? "text-3xl text-[#FF0000]" : "text-lg text-[#FF0000]"} />
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
              className={`w-full mt-1 mb-3 px-3 text-[16px] outline-none focus:border-[goldenrod] ${isMobileLayout ? "min-h-12 rounded-xl border border-black/10 bg-white/80 text-gray-800" : "py-1 text-sm rounded-md bg-transparent border border-gray-500 text-gray-500"}`}
            />

            <div className={`flex gap-2 justify-end ${isMobileLayout ? "pt-1" : ""}`}>
              <button
                type="button"
                onClick={cancelNaming}
                className={`flex items-center justify-center gap-2 w-32 text-sm ${isMobileLayout ? "min-h-11 rounded-xl border border-black/10 bg-white text-gray-700" : "h-10 rounded-md border border-red-500 text-red-400 hover:text-white hover:bg-red-500"}`}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmAndStart}
                disabled={!String(playlistName || "").trim()}
                className={`flex items-center justify-center gap-2 w-32 h-11 rounded-xl font-semibold transition-transform text-sm
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
