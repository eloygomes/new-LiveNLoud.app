import { useContext } from "react";
import { AdminAuthContext } from "./AdminAuthProvider.jsx";

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
