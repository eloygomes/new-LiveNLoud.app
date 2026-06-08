import { LogOut } from "lucide-react";
import { useAdminAuth } from "../auth/useAdminAuth.js";

export function Header() {
  const { admin, logout } = useAdminAuth();

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">Sustenido Admin</div>
        <div className="topbar-subtitle">{admin?.email}</div>
      </div>
      <button className="icon-button" onClick={logout} title="Sair">
        <LogOut size={18} />
      </button>
    </header>
  );
}
