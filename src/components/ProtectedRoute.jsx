// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import LoadingIndicator from "./LoadingIndicator";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  // 1. 앱 시작 때 /api/users/me로 로그인 여부를 확인하는 중
  if (loading) {
    return <LoadingIndicator text="로그인 정보를 확인하는 중" />;
  }

  // 2. 로그인 안 함 → 로그인 뒤 이 페이지로 돌아오게 한다
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  // 3. 권한이 다르면 각자의 첫 화면으로
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === "ADMIN" ? "/admin/tours" : "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
