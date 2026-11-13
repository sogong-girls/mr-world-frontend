import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import PastTourPage from "./pages/PastTourPages";
import PaymentPage from "./pages/PaymentPage";
import AIChatBotPage from "./pages/AIChatBotPage";
import TourManagePage from "./pages/TourManagePage";
import BookingManagePage from "./pages/BookingManagePage";
import SouvenirInventoryPage from "./pages/SouvenirInventoryPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Customer & Shared Routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/past-tours"
            element={
              <ProtectedRoute requiredRole="USER">
                <PastTourPage />
              </ProtectedRoute>
            }
          />
          <Route path="/booking" element={<BookingPage />} />
          <Route
            path="/payment"
            element={
              <ProtectedRoute requiredRole="USER">
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route path="/ai-chat" element={<AIChatBotPage />} />

          {/* Staff Only Routes */}
          <Route
            path="/admin/tours"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <TourManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <BookingManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <SouvenirInventoryPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;