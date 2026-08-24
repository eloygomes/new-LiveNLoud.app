import { Music2, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { deleteGeneralSong, listGeneralSongs } from "../api/admin.js";
import { ConfirmActionModal } from "../components/ConfirmActionModal.jsx";
import { DataState } from "../components/DataState.jsx";

const SONG_SEARCH_STORAGE_KEY = "admin:songs-search";

function loadStoredSearch() {
  try {
    return window.localStorage.getItem(SONG_SEARCH_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function Songs() {
  const [query, setQuery] = useState(loadStoredSearch);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (search = "") => {
    setError("");
    try {
      setData(await listGeneralSongs({ q: search }));
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SONG_SEARCH_STORAGE_KEY, query);
    } catch {
      // Keep the in-memory search working if storage is blocked.
    }

    const timer = setTimeout(() => load(query), 250);
    return () => clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    const refresh = () => load(query);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const refreshTimer = window.setInterval(refreshWhenVisible, 15000);

    window.addEventListener("sustenido:songs-updated", refresh);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("sustenido:songs-updated", refresh);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load, query]);

  async function handleDelete({ reason }) {
    if (!selected || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await deleteGeneralSong(selected.id, { reason });
      setSelected(null);
      await load(query);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="page-header songs-header">
        <div>
          <h1>Musicas</h1>
          <div className="muted">{data?.total || 0} musicas em generalCifras</div>
        </div>
        <label className="song-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Buscar musica</span>
          <input
            type="search"
            placeholder="Buscar por artista ou musica"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <DataState loading={!data && !error} error={error}>
        <section className="panel songs-panel">
          <div className="songs-panel-title">
            <div>
              <h2>Biblioteca geral</h2>
              <div className="muted">Selecione uma musica para liberar as acoes administrativas.</div>
            </div>
            {selected ? (
              <button className="button danger" type="button" onClick={() => setSelected({ ...selected, confirm: true })}>
                <Trash2 size={16} /> Excluir musica
              </button>
            ) : null}
          </div>

          {data?.items?.length ? (
            <div className="table-wrap">
              <table className="songs-table">
                <thead>
                  <tr><th>Musica</th><th>Artista</th><th>Instrumentos</th></tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      className={selected?.id === item.id ? "selected" : ""}
                      onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(selected?.id === item.id ? null : item);
                        }
                      }}
                      aria-selected={selected?.id === item.id}
                    >
                      <td><span className="song-title"><Music2 size={16} />{item.song || "Sem titulo"}</span></td>
                      <td>{item.artist || "Artista desconhecido"}</td>
                      <td>{item.instruments.length ? item.instruments.join(", ") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-panel">{query ? "Nenhuma musica encontrada para esta busca." : "Nenhuma musica cadastrada."}</div>
          )}
          {data?.total > data?.items?.length ? <div className="songs-limit muted">Mostrando as primeiras {data.items.length} musicas.</div> : null}
        </section>
      </DataState>

      {selected?.confirm ? (
        <ConfirmActionModal
          title={`Excluir ${selected.song || "musica"}?`}
          confirmLabel={deleting ? "Excluindo..." : "Excluir musica"}
          expectedText="EXCLUIR"
          onCancel={() => setSelected(({ confirm, ...song }) => song)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}
