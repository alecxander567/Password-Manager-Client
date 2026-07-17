import { useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, getUserProfile } from "../api/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem("access_token"),
  );

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    getUserProfile()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser({ email, password });
    const accessToken = res.data.access || res.data.access_token;
    const refreshToken = res.data.refresh || res.data.refresh_token;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    const profileRes = await getUserProfile();
    setUser(profileRes.data);
    return profileRes.data;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await registerUser(userData);
    const accessToken = res.data.access || res.data.access_token;
    const refreshToken = res.data.refresh || res.data.refresh_token;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    const profileRes = await getUserProfile();
    setUser(profileRes.data);
    return profileRes.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // even if the request fails, clear local state
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await getUserProfile();
    setUser(res.data);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        setUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}