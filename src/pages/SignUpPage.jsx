// src/pages/SignUpPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupApi } from "../api/auth";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [isStaff, setIsStaff] = useState(false);
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    confirmPassword: "",
    name: "",
    phoneNumber: "",
    address: "",
    staffCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await signupApi({ ...formData, isStaff });
      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "회원가입 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>회원가입 (Sign Up)</h2>

      {/* Account Type Selector Tabs */}
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setIsStaff(false)}
          style={{ flex: 1, padding: "10px", background: !isStaff ? "#0f3460" : "#eee", color: !isStaff ? "#fff" : "#333", border: "none", cursor: "pointer" }}
        >
          고객 가입
        </button>
        <button
          type="button"
          onClick={() => setIsStaff(true)}
          style={{ flex: 1, padding: "10px", background: isStaff ? "#0f3460" : "#eee", color: isStaff ? "#fff" : "#333", border: "none", cursor: "pointer" }}
        >
          직원 가입
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input name="loginId" placeholder="아이디" value={formData.loginId} onChange={handleChange} required />
        <input name="password" type="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} required />
        <input name="confirmPassword" type="password" placeholder="비밀번호 확인" value={formData.confirmPassword} onChange={handleChange} required />
        <input name="name" placeholder="성명" value={formData.name} onChange={handleChange} required />
        <input name="phoneNumber" placeholder="연락처 (예: 010-1234-5678)" value={formData.phoneNumber} onChange={handleChange} required />
        <input name="address" placeholder="주소" value={formData.address} onChange={handleChange} required />

        {isStaff && (
          <input name="staffCode" placeholder="직원 인증 코드 (Mock: ADMIN123)" value={formData.staffCode} onChange={handleChange} required />
        )}

        <button type="submit" disabled={loading} style={{ padding: "10px", background: "#4ecca3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <div style={{ marginTop: "15px", textAlign: "center", fontSize: "14px" }}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </div>
    </div>
  );
};

export default SignUpPage;