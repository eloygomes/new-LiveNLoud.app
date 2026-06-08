import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { clearTokens, getAccessToken } from "../api/client.js";
import { getMe, login as loginRequest } from "../api/auth.js";

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));
  const [error, setError] = useState("");

  const loadMe = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      setAdmin(await getMe());
      setError("");
    } catch (loadError) {
      clearTokens();
      setAdmin(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    await loginRequest(email, password);
    const me = await getMe();
    setAdmin(me);
    setError("");
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, loading, error, login, logout, reload: loadMe }), [admin, loading, error, login, logout, loadMe]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
