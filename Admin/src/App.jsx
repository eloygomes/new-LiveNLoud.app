import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedAdminRoute } from "./auth/ProtectedAdminRoute.jsx";
import { AdminLayout } from "./layout/AdminLayout.jsx";
import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Users } from "./pages/Users.jsx";
import { PendingUsers } from "./pages/PendingUsers.jsx";
import { UserDetails } from "./pages/UserDetails.jsx";
import { Friendships } from "./pages/Friendships.jsx";
import { AdminLogs } from "./pages/AdminLogs.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { AccessDenied } from "./pages/AccessDenied.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route
        path="/"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pending" element={<PendingUsers />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:userId" element={<UserDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="friendships" element={<Friendships />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
