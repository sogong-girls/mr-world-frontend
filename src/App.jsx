// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import PastTourPage from "./pages/PastTourPage";
import PaymentPage from "./pages/PaymentPage";

// Temporary placeholders for remaining pages to prevent routing crashes
const AIChatBotPage = () => <div style={{ padding: 20 }}>AIChatBot Page Placeholder</div>;
const TourManagePage = () => <div style={{ padding: 20 }}>Tour Manage Page (Staff)</div>;
const BookingManagePage = () => <div style={{ padding: 20 }}>Booking Manage Page (Staff)</div>;
const SouvenirInventoryPage = () => <div style={{ padding: 20 }}>Souvenir Inventory Page (Staff)</div>;

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
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute requiredRole="USER">
                <AIChatBotPage />
              </ProtectedRoute>
            }
          />

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