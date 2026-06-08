import { Outlet } from "react-router-dom";
import { Header } from "./Header.jsx";
import { Sidebar } from "./Sidebar.jsx";

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <Header />
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
