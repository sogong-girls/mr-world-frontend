// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(loginId, password);
      // Customer -> Home, Staff -> Tour Management
      if (user.role === "ADMIN") {
        navigate("/admin/tours");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "아이디 또는 비밀번호가 맞지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "380px", margin: "60px auto", padding: "24px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff" }}>
      <h2>로그인 (Login)</h2>

      {error && <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>아이디</label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="user123 또는 admin"
            required
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123! 또는 admin123!"
            required
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px", background: "#0f3460", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px" }}>
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </div>
    </div>
  );
};

export default LoginPage;