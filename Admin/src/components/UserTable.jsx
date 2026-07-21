import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge.jsx";

export function UserTable({ users, actions }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Role</th>
            <th>Musicas</th>
            <th>Amigos</th>
            <th>Reset de senha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <Link to={`/users/${user.id}`} className="table-link">{user.email}</Link>
                <div className="muted">{user.username || user.fullName}</div>
              </td>
              <td><StatusBadge status={user.approvalStatus} /></td>
              <td>{user.role || "user"}</td>
              <td>{user.songCount}</td>
              <td>{user.friendCount}</td>
              <td>
                {user.passwordResetPending ? (
                  <span className="status-badge pending">Solicitado</span>
                ) : user.resetPasswordRequestedAt ? (
                  new Date(user.resetPasswordRequestedAt).toLocaleString("pt-BR")
                ) : (
                  "—"
                )}
              </td>
              <td className="row-actions">{actions?.(user)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
