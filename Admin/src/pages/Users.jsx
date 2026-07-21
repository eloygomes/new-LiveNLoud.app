import { useEffect, useState } from "react";
import { listUsers } from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";
import { UserTable } from "../components/UserTable.jsx";

export function Users() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [passwordResetPending, setPasswordResetPending] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = () => {
      setError("");
      listUsers({ q: query, status, password_reset_pending: passwordResetPending }).then(setData).catch((err) => setError(err.message));
    };
    const timer = setTimeout(loadUsers, 200);
    const refresh = setInterval(loadUsers, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(refresh);
    };
  }, [query, status, passwordResetPending]);

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
          <label>
            <input type="checkbox" checked={passwordResetPending} onChange={(event) => setPasswordResetPending(event.target.checked)} />
            Reset solicitado
          </label>
        </div>
      </section>
      <DataState loading={!data && !error} error={error} empty={data?.items?.length === 0}>
        <UserTable users={data?.items || []} />
      </DataState>
    </>
  );
}
