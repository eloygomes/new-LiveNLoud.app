import { createContext, useContext, useState, useEffect } from "react";
import { setLocalStorageItemSafe } from "../Tools/storageSafe";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedEmail = localStorage.getItem("userEmail");

    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUserEmail(savedEmail);
    }
  }, []);

  const login = (token, email) => {
    setLocalStorageItemSafe("token", token);
    setLocalStorageItemSafe("userEmail", email);
    setToken(token);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    setToken(null);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ token, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
