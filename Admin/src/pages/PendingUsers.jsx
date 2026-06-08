import { useEffect, useState } from "react";
import { listPendingUsers, updateApproval } from "../api/admin.js";
import { DataState } from "../components/DataState.jsx";
import { UserTable } from "../components/UserTable.jsx";

export function PendingUsers() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  async function load() {
    setError("");
    try {
      setData(await listPendingUsers());
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(user, decision) {
    setBusyUserId(user.id);
    setError("");
    try {
      await updateApproval(user.id, { decision });
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Aprovacoes</h1>
          <div className="muted">{data?.total || 0} usuarios aguardando decisao</div>
        </div>
        <button className="button secondary" onClick={load}>Atualizar</button>
      </section>
      <DataState loading={!data && !error} error={error} empty={data?.items?.length === 0}>
        <section className="panel section-summary">
          <strong>{data?.items?.length || 0}</strong>
          <span>cadastros pendentes encontrados no banco do Sustenido.</span>
        </section>
        <UserTable
          users={data?.items || []}
          actions={(user) => (
            <>
              <button
                className="button compact primary"
                disabled={busyUserId === user.id}
                onClick={() => decide(user, "approve")}
              >
                Aprovar
              </button>
              <button
                className="button compact danger"
                disabled={busyUserId === user.id}
                onClick={() => decide(user, "reject")}
              >
                Rejeitar
              </button>
            </>
          )}
        />
      </DataState>
    </>
  );
}
