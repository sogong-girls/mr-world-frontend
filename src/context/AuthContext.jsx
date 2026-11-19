// src/context/AuthContext.jsx
// 로그인 상태는 GET /api/users/me 성공 여부로 판단한다 (토큰은 HttpOnly 쿠키라 화면에서 읽지 않음).
import { useEffect, useState } from "react";
import { getMeApi, loginApi, logoutApi } from "../api/auth";
import { AuthContext } from "./useAuth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMeApi()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) setUser(null); // 로그인 안 함 또는 세션 만료
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (loginId, password) => {
    await loginApi(loginId.trim(), password);
    const me = await getMeApi();
    if (!me?.role) {
      throw new Error("로그인한 사용자의 권한 정보를 확인할 수 없습니다.");
    }
    setUser(me);
    return me;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // 로그아웃 요청이 실패해도 화면에서는 로그아웃 처리
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
