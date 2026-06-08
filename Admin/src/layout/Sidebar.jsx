import { Activity, BarChart3, Gauge, Handshake, PanelLeftClose, PanelLeftOpen, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/pending", label: "Aprovacoes", icon: UserCheck },
  { to: "/users", label: "Usuarios", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/friendships", label: "Amizades", icon: Handshake },
  { to: "/logs", label: "Logs", icon: Activity },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("admin.sidebarCollapsed") === "true");

  useEffect(() => {
    localStorage.setItem("admin.sidebarCollapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`} aria-label="Navegacao principal">
      <div className="sidebar-head">
        <div className="sidebar-brand"><span>#</span> SUSTENIDO</div>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="nav-link" title={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
