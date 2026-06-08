import { useEffect, useState } from "react";
import { listFriendships } from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";

export function Friendships() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setData(await listFriendships());
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <DataState loading={!data && !error} error={error}>
      <section className="page-header">
        <div>
          <h1>Amizades</h1>
          <div className="muted">
            {(data?.pending?.length || 0)} pendentes, {(data?.accepted?.length || 0)} relacoes aceitas
          </div>
        </div>
        <button className="button secondary" onClick={load}>Atualizar</button>
      </section>
      <section className="panel">
        <h2>Convites pendentes</h2>
        {data?.pending?.length ? (
          <div className="log-list">
            {data.pending.map((item) => (
              <div className="log-row" key={item.id}>
                <strong>{item.senderEmail}</strong>
                <span>{item.receiverEmail}</span>
                <time>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-panel">Nenhum convite pendente.</div>
        )}
      </section>
      <section className="panel">
        <h2>Relacoes aceitas</h2>
        {data?.accepted?.length ? (
          <div className="log-list">
            {data.accepted.slice(0, 200).map((item) => (
              <div className="log-row" key={`${item.userEmail}-${item.counterpartEmail}`}>
                <strong>{item.userEmail}</strong>
                <span>{item.counterpartEmail || item.counterpartUsername || "Sem contraparte"}</span>
                <time>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-panel">Nenhuma relacao aceita encontrada.</div>
        )}
      </section>
    </DataState>
  );
}
