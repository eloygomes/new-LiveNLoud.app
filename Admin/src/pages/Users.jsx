import { useEffect, useState } from "react";
import { listUsers } from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";
import { UserTable } from "../components/UserTable.jsx";

export function Users() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
      listUsers({ q: query, status }).then(setData).catch((err) => setError(err.message));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, status]);

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Usuarios</h1>
          <div className="muted">{data?.total || 0} usuarios no banco do Sustenido</div>
        </div>
        <div className="filters">
          <input placeholder="Buscar email" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </section>
      <DataState loading={!data && !error} error={error} empty={data?.items?.length === 0}>
        <UserTable users={data?.items || []} />
      </DataState>
    </>
  );
}
