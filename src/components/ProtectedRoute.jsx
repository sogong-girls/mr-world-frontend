// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // 1. Show loading state while AuthContext checks local token
  if (loading) {
    return <div style={{ padding: "20px" }}>Loading session...</div>;
  }

  // 2. Not logged in -> redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logged in, but role doesn't match -> redirect to correct home page
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === "ADMIN" ? "/admin/tours" : "/"} replace />;
  }

  // 4. Authorized -> show requested page
  return children;
};

export default ProtectedRoute;