import client from "./client";
import { mockBookings, mockTours, mockUsers } from "../mocks/data";

const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const sleep = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const getCurrentMockUser = () => {
  const role = localStorage.getItem("role");
  return mockUsers.find((u) => u.role === role) || mockUsers[0];
};

// GET /api/users/me/bookings
export const getMyBookingsApi = async () => {
  if (IS_MOCK) {
    await sleep();
    const user = getCurrentMockUser();
    if (!user) return [];
    return mockBookings.filter((b) => String(b.userId) === String(user.id));
  }

  const response = await client.get("/api/users/me/bookings");
  return response.data;
};

// GET /api/admin/bookings (Admin Only - falls back to mockBookings if endpoint differs)
export const getAllBookingsApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return [...mockBookings];
  }

  try {
    const response = await client.get("/api/admin/bookings");
    return response.data;
  } catch (err) {
    console.warn("Admin bookings endpoint unavailable, using mockBookings:", err);
    return [...mockBookings];
  }
};

// POST /api/bookings
export const createBookingApi = async (bookingPayload) => {
  /*
    bookingPayload: {
      tourId, tourStyleId, hotelOptionId, foodOptionId,
      participantsCount, startAt, endAt, bookingAddons
    }
  */
  if (IS_MOCK) {
    await sleep();
    const user = getCurrentMockUser();
    const tour = mockTours.find((t) => String(t.id) === String(bookingPayload.tourId));
    const style = tour?.styles?.find((s) => String(s.id) === String(bookingPayload.tourStyleId));
    const hotel = tour?.hotelOptions?.find((h) => String(h.id) === String(bookingPayload.hotelOptionId));
    const food = tour?.foodOptions?.find((f) => String(f.id) === String(bookingPayload.foodOptionId));

    const participants = Number(bookingPayload.participantsCount) || 1;
    // Backend rule: < 3 participants starts as PENDING until consolidated to 3+
    const initialStatus = participants < 3 ? "PENDING" : "CONFIRMED";

    const newBooking = {
      id: Date.now(),
      tourId: Number(bookingPayload.tourId),
      tourName: tour?.name || "맞춤 테마 투어",
      userId: user.id,
      userName: user.name,
      tourStyleId: bookingPayload.tourStyleId,
      tourStyleType: style?.type || "CLASSIC",
      hotelOptionId: bookingPayload.hotelOptionId,
      hotelOption: hotel?.name || null,
      foodOptionId: bookingPayload.foodOptionId,
      mealOption: food?.name || null,
      bookingAddons: bookingPayload.bookingAddons || [],
      totalPrice: bookingPayload.totalPrice || 0,
      participantsCount: participants,
      startAt: bookingPayload.startAt,
      endAt: bookingPayload.endAt,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    mockBookings.unshift(newBooking);
    return newBooking;
  }

  const response = await client.post("/api/bookings", bookingPayload);
  return response.data;
};

// POST /api/bookings/{id}/payments
export const payBookingApi = async (bookingId) => {
  if (IS_MOCK) {
    await sleep();
    const target = mockBookings.find((b) => String(b.id) === String(bookingId));
    if (target) {
      target.status = "BOOKED";
    }
    return target;
  }

  const response = await client.post(`/api/bookings/${bookingId}/payments`, {});
  return response.data;
};

// PATCH /api/admin/bookings/{id}/status (Admin Only)
export const updateAdminBookingStatusApi = async (bookingId, status) => {
  if (IS_MOCK) {
    await sleep();
    const target = mockBookings.find((b) => String(b.id) === String(bookingId));
    if (target) {
      target.status = status;
    }
    return target;
  }

  const response = await client.patch(`/api/admin/bookings/${bookingId}/status`, { status });
  return response.data;
};