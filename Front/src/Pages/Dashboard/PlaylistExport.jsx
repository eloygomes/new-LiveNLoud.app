/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaSpotify, FaYoutube } from "react-icons/fa";
import { startSpotifyLogin } from "./spotifyAuth";
import { startYouTubeTokenFlow } from "./youtubeAuth";
import {
  youtubeCreatePlaylist,
  youtubeSearchVideoId,
  youtubeAddVideoToPlaylist,
} from "./youtubeApi";

export default function PlaylistExport({ visibleSongs = [] }) {
  const disabled = !visibleSongs?.length;

  const defaultName = useMemo(() => {
    const date = new Date().toLocaleDateString("pt-BR");
    const count = visibleSongs?.length || 0;
    return `Sustenido • ${count} músicas • ${date}`;
  }, [visibleSongs]);

  // idle -> mostra botões
  // naming -> mostra input e ações (provider selecionado)
  // working -> feedback enquanto executa
  const [mode, setMode] = useState("idle");
  const [provider, setProvider] = useState(null); // "spotify" | "youtube"
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

    setMode("working");
    setStatusLine("");

    if (provider === "spotify") {
      sessionStorage.setItem("spotify_playlist_name", name);
      sessionStorage.setItem(
        "spotify_playlist_songs",
        JSON.stringify(visibleSongs || [])
      );
      startSpotifyLogin();
      return;
    }

    if (provider === "youtube") {
      try {
        // 1) autentica (SEM client_secret)
        setStatusLine("Conectando ao Google/YouTube…");
        await startYouTubeTokenFlow({
          scope: "https://www.googleapis.com/auth/youtube",
        });

        // 2) cria playlist
        setStatusLine("Criando playlist no YouTube…");
        const created = await youtubeCreatePlaylist({
          title: name,
          description: "Playlist criada automaticamente pelo LiveNLoud",
          privacyStatus: "public",
        });

        const playlistId = created?.id;
        if (!playlistId)
          throw new Error("Não consegui obter o ID da playlist criada.");

        // 3) adiciona músicas (busca vídeo por título/artista)
        const songs = Array.isArray(visibleSongs) ? visibleSongs : [];
        let added = 0;
        let notFound = 0;

        for (let i = 0; i < songs.length; i++) {
          const s = songs[i] || {};
          const song = s.song || s.title || s.name || "";
          const artist = s.artist || s.band || "";
          const q = [song, artist].filter(Boolean).join(" ").trim();

          setStatusLine(`Buscando e adicionando… (${i + 1}/${songs.length})`);

          if (!q) {
            notFound++;
            continue;
          }

          const videoId = await youtubeSearchVideoId(q);
          if (!videoId) {
            notFound++;
            continue;
          }

          await youtubeAddVideoToPlaylist({ playlistId, videoId });
          added++;
        }

        setStatusLine(
          `✅ Pronto! Adicionadas: ${added} • Não encontradas: ${notFound}`
        );
        setTimeout(() => {
          setProvider(null);
          setMode("idle");
          setStatusLine("");
        }, 1200);
      } catch (e) {
        setStatusLine(`Falhou: ${e?.message || String(e)}`);
      }
    }
  }

  const providerLabel =
    provider === "spotify"
      ? "Spotify"
      : provider === "youtube"
      ? "YouTube"
      : "";

  return (
    <div className="neuphormism-b m-2">
      <div className="px-5 py-4 flex flex-col">
        <h1 className="text-sm pb-2">Playlists</h1>

        {mode === "idle" && (
          <>
            <p className="text-[11px] pb-3">
              Crie uma playlist automaticamente com as músicas visíveis usando
              sua conta.
            </p>

            <div className="flex flex-row flex-wrap gap-3">
              {/* Spotify */}
              <button
                type="button"
                onClick={() => goToNaming("spotify")}
                disabled={disabled}
                title={
                  disabled
                    ? "Nenhuma música visível para exportar"
                    : "Conectar ao Spotify para criar a playlist"
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-transform
                  ${
                    disabled
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "border border-[#9ca3af] hover:bg-[goldenrod] hover:border-[goldenrod] hover:text-black active:scale-95 text-[#9ca3af]"
                  }`}
              >
                <FaSpotify className="text-lg" />
                Spotify
              </button>

              {/* YouTube */}
              <button
                type="button"
                onClick={() => goToNaming("youtube")}
                disabled={disabled}
                title={
                  disabled
                    ? "Nenhuma música visível para exportar"
                    : "Conectar ao YouTube para criar a playlist"
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-transform
                  ${
                    disabled
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "border border-[#9ca3af] hover:bg-[goldenrod] hover:border-[goldenrod] hover:text-black active:scale-95 text-[#9ca3af]"
                  }`}
              >
                <FaYoutube className="text-lg" />
                YouTube
              </button>
            </div>

            <div className="pt-3 text-[10px] text-gray-600">
              * Spotify: autentica e cria playlist no Spotify. <br />* YouTube:
              autentica via Google (sem callback) e cria playlist no YouTube.
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

            <p className="text-gray-600 text-[11px] mb-3">
              Escolha um nome para a playlist que será criada com as músicas
              visíveis.
            </p>

            <input
              autoFocus
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelNaming();
                if (e.key === "Enter") confirmAndStart();
              }}
              placeholder="Ex: Sustenido • Treino de hoje"
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

            <div className="pt-3 text-[10px] text-gray-600">
              Dica: Enter confirma • Esc cancela
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
              {statusLine ||
                "Abrindo autenticação. Se nada acontecer, verifique se o navegador bloqueou pop-up."}
            </p>

            <div className="pt-3 text-[10px] text-gray-600">
              Criando playlist:{" "}
              <span className="text-gray-300">{playlistName}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
