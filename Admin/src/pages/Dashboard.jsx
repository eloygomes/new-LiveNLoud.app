import { useEffect, useState } from "react";
import { getAnalyticsSummary, getSummary } from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([getSummary(), getAnalyticsSummary()])
      .then(([nextSummary, nextAnalytics]) => {
        setSummary(nextSummary);
        setAnalytics(nextAnalytics);
      })
      .catch((err) => setError(err.message));
  }, []);

  const cards = summary
    ? [
        ["Usuarios", summary.users.total],
        ["Pendentes", summary.users.pending],
        ["Aprovados", summary.users.approved],
        ["Bloqueados", summary.users.blocked],
        ["Musicas", summary.songs.totalUserSongsApprox],
        ["Amizades", summary.friendships.acceptedRelations],
      ]
    : [];

  const analyticsCards = analytics
    ? [
        ["DAU", analytics.users.dau, "Ultimas 24h", "Usuarios distintos com atividade registrada desde ontem."],
        ["WAU", analytics.users.wau, "Ultimos 7 dias", "Usuarios ativos na semana, somando logins e eventos de uso."],
        ["MAU", analytics.users.mau, "Ultimos 30 dias", "Usuarios ativos no mes, usado como base de retencao."],
        ["Novos usuarios", analytics.users.new, "No periodo", "Contas criadas dentro da janela analisada."],
        ["Ativados", analytics.users.activated, `${analytics.users.activationRate}% de ativacao`, "Usuarios que chegaram ao valor principal: musica, apresentacao ou pratica."],
        ["Sessoes de pratica", analytics.usage.practiceSessions, `${analytics.usage.avgSessionMinutes} min media`, "Quantidade de praticas iniciadas e tempo medio finalizado."],
        ["Apresentacoes", analytics.usage.presentationsOpened, "Aberturas", "Aberturas da Presentation page durante o periodo."],
        ["Erros tecnicos", analytics.events.technicalErrors, "No periodo", "Falhas de frontend, API, SMTP ou Safari registradas."],
      ]
    : [];

  return (
    <DataState loading={(!summary || !analytics) && !error} error={error}>
      <section className="page-header">
        <h1>Dashboard</h1>
      </section>
      <section className="panel dashboard-hero">
        <div>
          <h2>Insights</h2>
          <p className="muted">Cards principais de uso, ativacao e qualidade tecnica do Sustenido.</p>
        </div>
        <span className="pill">{analytics?.events?.total || 0} eventos</span>
      </section>
      <div className="metric-grid analytics-metrics">
        {analyticsCards.map(([label, value, detail, description]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
            <p>{description}</p>
          </div>
        ))}
      </div>
      <section className="panel">
        <h2>Controle administrativo</h2>
        <div className="metric-grid compact-metrics">
          {cards.map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Acoes recentes</h2>
        {summary?.recentAdminActions?.length ? (
          <div className="log-list">
            {summary.recentAdminActions.map((log) => (
              <div className="log-row" key={log.id}>
                <strong>{log.action}</strong>
                <span>{log.targetUserEmail || log.targetType}</span>
                <time>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-panel">Nenhuma acao administrativa registrada ainda.</div>
        )}
      </section>
    </DataState>
  );
}
