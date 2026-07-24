import { useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
} from "../api/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If there's no token, we're never "loading" a session.
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem("access_token"),
  );

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    let cancelled = false;

    getUserProfile()
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        // If token is invalid, clear everything
        localStorage.clear();
        sessionStorage.clear();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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

  const logout = useCallback(async (clearAll = true) => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          await logoutUser();
        } catch (err) {
          // Ignore logout API errors
          console.log("Logout API error (ignored):", err);
        }
      }
    } catch (error) {
      console.log("Logout error (ignored):", error);
    } finally {
      if (clearAll) {
        // Clear ALL local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear any cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/",
            );
        });
      } else {
        // Just clear the auth tokens, leave other stored data alone
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }

      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getUserProfile();
      setUser(res.data);
      return res.data;
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      // If we can't refresh the profile, the token might be invalid
      if (error.response?.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
      }
      return null;
    }
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
