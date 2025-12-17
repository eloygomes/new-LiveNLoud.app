/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaSpotify, FaApple } from "react-icons/fa";
import { startSpotifyLogin } from "./spotifyAuth";

export default function PlaylistExport({ visibleSongs = [] }) {
  const disabled = !visibleSongs?.length;

  const defaultName = useMemo(() => {
    const date = new Date().toLocaleDateString("pt-BR");
    const count = visibleSongs?.length || 0;
    return `Sustenido • ${count} músicas • ${date}`;
  }, [visibleSongs]);

  // idle -> mostra botões
  // naming -> mostra input e ações
  // working -> feedback enquanto redireciona
  const [mode, setMode] = useState("idle");
  const [playlistName, setPlaylistName] = useState(defaultName);

  function goToNaming() {
    setPlaylistName(defaultName);
    setMode("naming");
  }

  function cancelNaming() {
    setMode("idle");
  }

  function confirmAndStart() {
    const name = String(playlistName || "").trim();
    if (!name) return;

    // 1) salva o nome escolhido
    sessionStorage.setItem("spotify_playlist_name", name);

    // 2) salva as músicas visíveis (o callback vai ler isso)
    sessionStorage.setItem(
      "spotify_playlist_songs",
      JSON.stringify(visibleSongs || [])
    );

    // 3) feedback e inicia login
    setMode("working");
    startSpotifyLogin();
  }

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
                onClick={goToNaming}
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

              {/* Apple Music (somente layout por enquanto) */}
              <button
                type="button"
                disabled
                title="Em breve"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-gray-400 cursor-not-allowed text-white"
              >
                <FaApple className="text-lg" />
                Apple Music
              </button>
            </div>

            <div className="pt-3 text-[10px] text-gray-600">
              * Spotify: vai abrir autenticação e, depois, criaremos a playlist
              com as músicas visíveis.
            </div>
          </>
        )}

        {mode === "naming" && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <FaSpotify className="text-lg text-gray-500" />
              <h2 className="text-gray-500 font-bold text-sm">
                Nome da playlist (Spotify)
              </h2>
            </div>

            <p className="text-gray-600 text-[11px] mb-3">
              Escolha um nome para a playlist que será criada com as músicas
              visíveis.
            </p>

            {/* <label className="text-gray-400 text-[10px]">Nome</label> */}
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
                      ? "bg-[#1DB954] hover:bg-[goldenrod] text-black active:scale-95"
                      : "bg-gray-500 text-white cursor-not-allowed"
                  }`}
              >
                <FaSpotify className="text-lg" />
                Criar
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
              <FaSpotify className="text-lg text-[#9ca3af]" />
              <h2 className="text-gray-600 font-bold text-sm">
                Conectando ao Spotify…
              </h2>
            </div>
            <p className="text-gray-600 text-[11px]">
              Abrindo autenticação. Se nada acontecer, verifique se o navegador
              bloqueou pop-up/redirecionamento.
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
