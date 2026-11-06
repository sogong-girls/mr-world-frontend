import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAiClick = () => {
    navigate("/ai-chat");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      {/* Header Navigation Bar */}
      <header style={{ display: "flex", justifyContent: "space-between", padding: "15px 30px", background: "#1a1a2e", color: "#fff", alignItems: "center" }}>
        <Link to={role === "ADMIN" ? "/admin/tours" : "/"} style={{ color: "#fff", textDecoration: "none", fontSize: "20px", fontWeight: "bold" }}>
          Mr. World (미스터 월드)
        </Link>
        <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {role === "ADMIN" ? (
            <>
              <Link to="/admin/tours" style={{ color: "#fff", textDecoration: "none" }}>투어 관리</Link>
              <Link to="/admin/bookings" style={{ color: "#fff", textDecoration: "none" }}>예약 현황</Link>
              <Link to="/admin/inventory" style={{ color: "#fff", textDecoration: "none" }}>창고 재고</Link>
            </>
          ) : (
            <>
              <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>테마 투어</Link>
              <Link to="/past-tours" style={{ color: "#fff", textDecoration: "none" }}>내 여행 (이력)</Link>
            </>
          )}

          {user ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#4ecca3" }}>
                {user.name} ({role === "ADMIN" ? "직원" : "고객"})
              </span>
              <button onClick={handleLogout} style={{ padding: "6px 12px", background: "#e94560", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                로그아웃
              </button>
            </div>
          ) : (
            <Link to="/login" style={{ padding: "6px 12px", background: "#0f3460", color: "#fff", textDecoration: "none", borderRadius: "4px" }}>
              로그인
            </Link>
          )}
        </nav>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1, padding: "20px", background: "#f8f9fa" }}>
        <Outlet />
      </main>

      {/* Floating AI Widget (Customer role only) */}
      {role !== "ADMIN" && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", zIndex: 1000 }}>
          {/* Speech Bubble Prompt */}
          <div
            onClick={handleAiClick}
            style={{
              background: "#ffffff",
              border: "2px solid #0f3460",
              borderRadius: "15px",
              padding: "10px 15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              cursor: "pointer",
              maxWidth: "240px",
              fontSize: "13px",
              color: "#1a1a2e",
            }}
          >
            <strong>AI 여행 안내</strong>: 클릭해서 대화를 시작하세요!
          </div>

          {/* Floating Action Button with 3-Dots Speech Bubble SVG */}
          <button
            onClick={handleAiClick}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#0f3460",
              color: "#fff",
              border: "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <circle cx="8" cy="10" r="1" fill="currentColor"></circle>
              <circle cx="12" cy="10" r="1" fill="currentColor"></circle>
              <circle cx="16" cy="10" r="1" fill="currentColor"></circle>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;