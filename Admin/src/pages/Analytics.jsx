import { useEffect, useMemo, useState } from "react";
import {
  getAnalyticsActivationFunnel,
  getAnalyticsErrors,
  getAnalyticsSummary,
  getAnalyticsTopSongs,
} from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";

function todayMinus(days) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
}

export function Analytics() {
  const [filters, setFilters] = useState({ start: todayMinus(30), end: new Date().toISOString().slice(0, 10) });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const params = useMemo(() => ({ start: filters.start, end: filters.end }), [filters]);

  useEffect(() => {
    let active = true;
    setError("");
    Promise.all([
      getAnalyticsSummary(params),
      getAnalyticsActivationFunnel(params),
      getAnalyticsTopSongs(params),
      getAnalyticsErrors(params),
    ])
      .then(([summary, funnel, topSongs, errors]) => {
        if (active) setData({ summary, funnel, topSongs, errors });
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [params]);

  const hasEvents = data?.summary?.events?.total > 0;

  return (
    <>
      <section className="page-header analytics-header">
        <div>
          <h1>Analytics</h1>
          <div className="muted">Leitura do banco Sustenido, sem misturar com o banco de acesso do Admin.</div>
        </div>
        <div className="filters">
          <input
            aria-label="Inicio"
            type="date"
            value={filters.start}
            onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))}
          />
          <input
            aria-label="Fim"
            type="date"
            value={filters.end}
            onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))}
          />
        </div>
      </section>

      <DataState loading={!data && !error} error={error}>
        {!hasEvents ? (
          <section className="panel analytics-empty">
            <h2>Analytics ainda sem eventos</h2>
            <p>
              A estrutura esta pronta para ler a colecao analytics_events. Quando o app Sustenido comecar a enviar eventos,
              esta tela passa a mostrar funil, musicas e erros automaticamente.
            </p>
          </section>
        ) : null}

        <div className="analytics-grid">
          <section className="panel">
            <h2>Funil de ativacao</h2>
            <div className="funnel-list">
              {(data?.funnel?.items || []).map((item) => (
                <div className="funnel-row" key={item.key}>
                  <div className="funnel-meta">
                    <strong>{item.label}</strong>
                    <span>{item.users} usuarios</span>
                  </div>
                  <div className="funnel-track">
                    <div className="funnel-fill" style={{ width: `${Math.min(item.conversion, 100)}%` }} />
                  </div>
                  <span className="funnel-rate">{item.conversion}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Erros recentes</h2>
            {data?.errors?.recent?.length ? (
              <div className="log-list">
                {data.errors.recent.map((item) => (
                  <div className="log-row compact-log" key={item.id}>
                    <strong>{item.eventName}</strong>
                    <span>{item.message || item.path || item.user || "Sem detalhe"}</span>
                    <time>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}</time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-panel">Nenhum erro tecnico no periodo.</div>
            )}
          </section>
        </div>

        <section className="panel">
          <h2>Musicas em destaque</h2>
          {data?.topSongs?.items?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Musica</th>
                    <th>Artista</th>
                    <th>Aberturas</th>
                    <th>Praticas</th>
                    <th>Minutos</th>
                    <th>Ultimo evento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topSongs.items.map((song) => (
                    <tr key={song.key}>
                      <td><strong>{song.song}</strong></td>
                      <td>{song.artist}</td>
                      <td>{song.opens}</td>
                      <td>{song.practiceSessions}</td>
                      <td>{song.totalPracticeMinutes}</td>
                      <td>{song.lastEventAt ? new Date(song.lastEventAt).toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-panel">Nenhuma musica com evento de analytics no periodo.</div>
          )}
        </section>
      </DataState>
    </>
  );
}
