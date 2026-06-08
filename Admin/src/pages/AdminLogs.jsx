import { useEffect, useState } from "react";
import { listAdminLogs } from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";

export function AdminLogs() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setData(await listAdminLogs());
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
          <h1>Logs</h1>
          <div className="muted">{data?.items?.length || 0} eventos administrativos recentes</div>
        </div>
        <button className="button secondary" onClick={load}>Atualizar</button>
      </section>
      <section className="panel">
        {data?.items?.length ? (
          <div className="log-list">
            {data.items.map((log) => (
              <div className="log-row" key={log.id}>
                <strong>{log.action}</strong>
                <span>{log.adminEmail}{" -> "}{log.targetUserEmail || log.targetType}</span>
                <time>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-panel">Nenhum log administrativo registrado ainda.</div>
        )}
      </section>
    </DataState>
  );
}
