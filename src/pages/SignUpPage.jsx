// src/pages/SignUpPage.jsx
// 직원 가입은 백엔드에 없어서 고객 가입만 둔다. 연락처는 문자 발송에 쓰므로 숫자만 받는다.
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupApi } from "../api/auth";
import { getErrorMessage, isDuplicatePhoneError } from "../api/errors";

const PHONE_PATTERN = /^01[0-9]{8,9}$/;

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    confirmPassword: "",
    name: "",
    phoneNumber: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "phoneNumber" ? value.replace(/\D/g, "").slice(0, 11) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!PHONE_PATTERN.test(formData.phoneNumber)) {
      setError("연락처는 숫자만 입력해 주세요. (예: 01012345678)");
      return;
    }

    setLoading(true);
    try {
      await signupApi({
        loginId: formData.loginId.trim(),
        password: formData.password,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber,
        address: formData.address.trim(),
      });
      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      setError(
        isDuplicatePhoneError(err)
          ? "이미 가입된 연락처예요. 다른 번호를 입력해 주세요."
          : getErrorMessage(err, "회원가입 처리 중 오류가 발생했습니다."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#0f3460" }}>회원가입(Sign Up)</h2>

      {error && <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input name="loginId" placeholder="아이디" value={formData.loginId} onChange={handleChange} autoComplete="username" required />
        <input name="password" type="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
        <input name="confirmPassword" type="password" placeholder="비밀번호 확인" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
        <input name="name" placeholder="성명" value={formData.name} onChange={handleChange} required />
        <input
          name="phoneNumber"
          type="tel"
          inputMode="numeric"
          placeholder="연락처 (숫자만, 예: 01012345678)"
          value={formData.phoneNumber}
          onChange={handleChange}
          autoComplete="tel"
          required
        />
        <input name="address" placeholder="주소" value={formData.address} onChange={handleChange} autoComplete="street-address" required />

        <button type="submit" disabled={loading} style={{ padding: "10px", background: "#0f3460", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
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
