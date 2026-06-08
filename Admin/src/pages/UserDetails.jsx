import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteAllSongs,
  deleteSong,
  deleteUser,
  getUserDetails,
  getUserFriendships,
  listUserLogs,
  listUserSongs,
  removeFriendship,
  updateUserStatus,
} from "../api/admin.js";
import { ConfirmActionModal } from "../components/ConfirmActionModal.jsx";
import { DataState } from "../components/DataState.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export function UserDetails() {
  const { userId } = useParams();
  const [details, setDetails] = useState(null);
  const [songs, setSongs] = useState([]);
  const [friendships, setFriendships] = useState(null);
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  async function load() {
    try {
      setError("");
      const nextDetails = await getUserDetails(userId);
      const [nextSongs, nextFriendships, nextLogs] = await Promise.all([
        listUserSongs(userId).catch(() => ({ items: [] })),
        getUserFriendships(userId).catch(() => ({ accepted: [], pendingSent: [], pendingReceived: [] })),
        listUserLogs(userId).catch(() => ({ adminLogs: [], userLogs: [] })),
      ]);
      setDetails(nextDetails);
      setSongs(nextSongs.items || []);
      setFriendships(nextFriendships);
      setLogs(nextLogs);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  const user = details?.user;

  async function runAction(payload) {
    if (modal.type === "status") await updateUserStatus(user.id, { status: modal.status, reason: payload.reason });
    if (modal.type === "deleteUser") await deleteUser(user.id, payload);
    if (modal.type === "deleteAllSongs") await deleteAllSongs(user.id, payload);
    if (modal.type === "deleteSong") await deleteSong(user.id, modal.song.key, payload);
    if (modal.type === "removeFriend") await removeFriendship(user.id, modal.email, payload);
    setModal(null);
    await load();
  }

  return (
    <DataState loading={!details && !error} error={error}>
      <section className="page-header">
        <div>
          <h1>{user?.email}</h1>
          <div className="muted">{user?.username || user?.fullName || "Sem perfil publico"}</div>
        </div>
        <StatusBadge status={user?.approvalStatus} />
      </section>

      <div className="metric-grid">
        <div className="metric"><span>Musicas</span><strong>{user?.songCount}</strong></div>
        <div className="metric"><span>Amigos</span><strong>{user?.friendCount}</strong></div>
        <div className="metric"><span>Convites</span><strong>{user?.pendingInvitationCount}</strong></div>
      </div>

      <section className="panel action-panel">
        <h2>Risco/Acoes</h2>
        <button className="button secondary" onClick={() => setModal({ type: "status", status: "approved", title: "Reativar usuario" })}>Reativar</button>
        <button className="button danger" onClick={() => setModal({ type: "status", status: "blocked", title: "Bloquear usuario" })}>Bloquear</button>
        <button className="button danger" onClick={() => setModal({ type: "deleteUser", title: "Excluir usuario" })}>Excluir usuario</button>
        <button className="button danger" onClick={() => setModal({ type: "deleteAllSongs", title: "Excluir todas as musicas" })}>Excluir musicas</button>
      </section>

      <section className="panel">
        <h2>Musicas</h2>
        {songs.length ? (
          <div className="table-wrap">
            <table>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.key}>
                    <td>{song.artist}</td>
                    <td>{song.song}</td>
                    <td><button className="button compact danger" onClick={() => setModal({ type: "deleteSong", title: "Excluir musica", song })}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-panel">Nenhuma musica encontrada para este usuario.</div>
        )}
      </section>

      <section className="panel">
        <h2>Amizades</h2>
        {friendships?.accepted?.length ? (
          <div className="table-wrap">
            <table>
              <tbody>
                {friendships.accepted.map((friend) => (
                  <tr key={friend.counterpartEmail}>
                    <td>{friend.counterpartEmail}</td>
                    <td>{friend.counterpartUsername}</td>
                    <td><button className="button compact danger" onClick={() => setModal({ type: "removeFriend", title: "Remover amizade", email: friend.counterpartEmail })}>Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-panel">Nenhuma amizade aceita encontrada para este usuario.</div>
        )}
      </section>

      <section className="panel">
        <h2>Logs</h2>
        {logs?.adminLogs?.length ? (
          <div className="log-list">
            {logs.adminLogs.map((log) => (
              <div className="log-row" key={log.id}>
                <strong>{log.action}</strong>
                <span>{log.reason || log.adminEmail}</span>
                <time>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-panel">Nenhuma acao administrativa registrada para este usuario.</div>
        )}
      </section>

      {modal ? (
        <ConfirmActionModal
          title={modal.title}
          expectedText={user.email}
          requireReason={modal.status !== "approved"}
          onCancel={() => setModal(null)}
          onConfirm={runAction}
        />
      ) : null}
    </DataState>
  );
}
