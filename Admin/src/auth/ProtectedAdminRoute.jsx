import { Navigate } from "react-router-dom";
import { useAdminAuth } from "./useAdminAuth.js";

export function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="screen-state">Carregando sessao...</div>;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}
