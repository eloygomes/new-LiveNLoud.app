import { useEffect, useState } from "react";
import { exchangeCodeForToken } from "./spotifyAuth";
import { FaSpotify } from "react-icons/fa";

export default function SpotifyCallback() {
  const [status, setStatus] = useState("Autenticando...");

  async function fetchSpotifyMe(accessToken) {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error?.message || "Falha ao buscar /me no Spotify."
      );
    }
    return data; // { id, ... }
  }

  async function createSpotifyPlaylist({ accessToken, userId, name }) {
    const res = await fetch(
      `https://api.spotify.com/v1/users/${encodeURIComponent(
        userId
      )}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          public: false,
          description: "Playlist criada automaticamente pelo LiveNLoud",
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error?.message || "Falha ao criar playlist no Spotify."
      );
    }
    return data; // { id, external_urls: { spotify }, ... }
  }

  function normalizeSongItem(item) {
    // tenta cobrir variações comuns do seu objeto
    const title = item?.song || item?.title || item?.name || item?.music;
    const artist = item?.artist || item?.band || item?.singer;

    return {
      title: title ? String(title).trim() : "",
      artist: artist ? String(artist).trim() : "",
    };
  }

  async function searchTrackUri({ accessToken, title, artist }) {
    // query mais “forte” usando track + artist
    const q = `track:${title} artist:${artist}`;
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error?.message || "Falha ao buscar faixa no Spotify."
      );
    }

    const track = data?.tracks?.items?.[0];
    return track?.uri || null; // ex: "spotify:track:xxxx"
  }

  async function addTracksToPlaylist({ accessToken, playlistId, uris }) {
    // Spotify aceita até 100 URIs por request
    const chunks = [];
    for (let i = 0; i < uris.length; i += 100) {
      chunks.push(uris.slice(i, i + 100));
    }

    for (let i = 0; i < chunks.length; i++) {
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${encodeURIComponent(
          playlistId
        )}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: chunks[i] }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error?.message || "Falha ao adicionar músicas na playlist."
        );
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const state = params.get("state");

    if (error) {
      setStatus(`Erro: ${error}`);
      return;
    }

    if (!code) {
      setStatus("Nenhum código recebido.");
      return;
    }

    (async () => {
      try {
        setStatus("Trocando código por token...");
        const tokenData = await exchangeCodeForToken(code, state);

        // guarda tokens (DEV)
        localStorage.setItem("spotify_access_token", tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem(
            "spotify_refresh_token",
            tokenData.refresh_token
          );
        }
        localStorage.setItem(
          "spotify_expires_at",
          String(Date.now() + tokenData.expires_in * 1000)
        );

        const playlistName =
          sessionStorage.getItem("spotify_playlist_name") ||
          `LiveNLoud • ${new Date().toLocaleDateString("pt-BR")}`;

        const rawSongs = sessionStorage.getItem("spotify_playlist_songs");
        const songs = rawSongs ? JSON.parse(rawSongs) : [];

        if (!songs.length) {
          setStatus(
            "✅ Spotify conectado, mas não encontrei músicas para adicionar (spotify_playlist_songs vazio)."
          );
          setTimeout(() => (window.location.href = "/"), 1200);
          return;
        }

        setStatus("Buscando seu usuário no Spotify...");
        const me = await fetchSpotifyMe(tokenData.access_token);

        setStatus(`Criando playlist: "${playlistName}"...`);
        const playlist = await createSpotifyPlaylist({
          accessToken: tokenData.access_token,
          userId: me.id,
          name: playlistName,
        });

        localStorage.setItem("spotify_last_playlist_id", playlist.id);
        if (playlist?.external_urls?.spotify) {
          localStorage.setItem(
            "spotify_last_playlist_url",
            playlist.external_urls.spotify
          );
        }

        // Buscar URIs no Spotify
        setStatus(`Procurando ${songs.length} músicas no Spotify...`);
        const uris = [];
        let found = 0;

        for (let i = 0; i < songs.length; i++) {
          const { title, artist } = normalizeSongItem(songs[i]);

          if (!title || !artist) continue;

          try {
            const uri = await searchTrackUri({
              accessToken: tokenData.access_token,
              title,
              artist,
            });

            if (uri) {
              uris.push(uri);
              found++;
            }
          } catch {
            // ignora falhas individuais pra não quebrar tudo
          }

          // feedback leve
          if ((i + 1) % 5 === 0 || i === songs.length - 1) {
            setStatus(
              `Procurando músicas... ${i + 1}/${
                songs.length
              } (encontradas: ${found})`
            );
          }
        }

        // remove duplicadas
        const uniqueUris = Array.from(new Set(uris));

        if (!uniqueUris.length) {
          setStatus(
            "✅ Playlist criada, mas nenhuma música foi encontrada no Spotify com os dados atuais (título/artista)."
          );
          sessionStorage.removeItem("spotify_playlist_name");
          sessionStorage.removeItem("spotify_playlist_songs");
          setTimeout(() => (window.location.href = "/"), 1400);
          return;
        }

        setStatus(`Adicionando ${uniqueUris.length} músicas na playlist...`);
        await addTracksToPlaylist({
          accessToken: tokenData.access_token,
          playlistId: playlist.id,
          uris: uniqueUris,
        });

        // limpeza
        sessionStorage.removeItem("spotify_playlist_name");
        sessionStorage.removeItem("spotify_playlist_songs");

        setStatus("✅ Playlist criada e preenchida! Voltando ao Dashboard...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } catch (e) {
        setStatus(`Falhou: ${e?.message || String(e)}`);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="neuphormism-b p-6 max-w-md w-full">
        <div className="flex flex-row items-center gap-3 mb-4">
          <FaSpotify className="text-4xl text-[#9ca3af]" />
          <h1 className="text-gray-600 font-bold text-xl mb-2">Spotify</h1>
        </div>
        <p className="text-gray-600 text-sm whitespace-pre-line">{status}</p>
        <p className="text-gray-600 text-xs mt-3">
          Dica: use sempre o mesmo host (localhost OU 127.0.0.1 OU IP). Não
          misture.
        </p>
      </div>
    </div>
  );
}
