import axios from "axios";
import { mockBookings, mockUsers } from "../mocks/data";

const API_BASE = "http://localhost:8080/api";
const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// GET /api/users/me/bookings
export const getMyBookingsApi = async () => {
  if (IS_MOCK) {
    const role = localStorage.getItem("role");
    const user = mockUsers.find((mockUser) => mockUser.role === role);
    if (!user) return [];
    return mockBookings.filter((booking) => String(booking.userId) === String(user.id));
  }

  const response = await axios.get(`${API_BASE}/users/me/bookings`, { withCredentials: true });
  return response.data;
};

// POST /api/bookings
export const createBookingApi = async (bookingPayload) => {
  /*
    bookingPayload: {
      tourId, tourStyleId, hotelOptionId, foodOptionId,
      participantsCount, startAt, endAt, bookingAddons
    }
  */
  const response = await axios.post(`${API_BASE}/bookings`, bookingPayload, { withCredentials: true });
  return response.data;
};

// POST /api/bookings/{id}/payments
export const payBookingApi = async (bookingId) => {
  const response = await axios.post(`${API_BASE}/bookings/${bookingId}/payments`, {}, { withCredentials: true });
  return response.data;
};

// PATCH /api/admin/bookings/{id}/status (Admin Only)
export const updateAdminBookingStatusApi = async (bookingId, status) => {
  const response = await axios.patch(
    `${API_BASE}/admin/bookings/${bookingId}/status`,
    { status },
    { withCredentials: true }
  );
  return response.data;
};