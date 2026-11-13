// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { loginApi, getMeApi, logoutApi } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Load user details on initial startup if a token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await getMeApi();
          setUser(userData);
          localStorage.setItem("role", userData.role);
        } catch (error) {
          console.error("Failed to restore session:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (loginId, password) => {
    // 1. Call login endpoint to receive Bearer token
    const data = await loginApi(loginId.trim(), password);
    setToken(data.accessToken);
    localStorage.setItem("token", data.accessToken);

    // 2. Call GET /api/users/me to fetch role and profile details
    const userData = data.user || await getMeApi();
    if (!userData?.role) {
      throw new Error("로그인한 사용자의 권한 정보를 확인할 수 없습니다.");
    }
    setUser(userData);
    localStorage.setItem("role", userData.role);
    return userData;
  };

  const logout = async () => {
    try {
      if (token) await logoutApi();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || localStorage.getItem("role") || null,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);