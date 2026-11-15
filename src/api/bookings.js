// src/api/bookings.js
import client, { IS_MOCK } from "./client";
import { mockBookingRecords, mockTours, mockUsers } from "../mocks/data";
import { dropNulls, mockError, requireMockUser, sleep } from "../mocks/helpers";
import { GRAND_ONLY_THEMES, minParticipants } from "../constants";
import { calculateTourPriceApi } from "./tours";

// GET /api/users/me/bookings → BookingResponse[]
// {id, tourId, userId, tourStyleType, totalPrice, participantsCount, startAt, endAt, status} (호텔·식사·addon 없음)
export const getMyBookingsApi = async () => {
  if (IS_MOCK) {
    await sleep();
    const user = requireMockUser();
    return mockBookingRecords.filter((b) => b.userId === user.id).map(toBookingResponse);
  }

  const response = await client.get("/api/users/me/bookings");
  return response.data;
};

// GET /api/bookings/{id} → BookingDetailResponse (tour, hotelOption, foodOption, bookingAddons, paymentDueAt 포함)
export const getBookingDetailApi = async (bookingId) => {
  if (IS_MOCK) {
    await sleep();
    const user = requireMockUser();
    const record = mockBookingRecords.find((b) => String(b.id) === String(bookingId));
    if (!record) throw mockError(404, "대상을 찾을 수 없습니다.");
    if (record.userId !== user.id) throw mockError(401, "ID 또는 비밀번호가 잘못되었습니다.");
    return toBookingDetail(record);
  }

  const response = await client.get(`/api/bookings/${bookingId}`);
  return response.data;
};

// GET /api/admin/bookings → BookingResponse[] (직원)
export const getAllBookingsApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return mockBookingRecords.map(toBookingResponse);
  }

  const response = await client.get("/api/admin/bookings");
  return response.data;
};

// POST /api/bookings → 201 BookingDetailResponse
// body: {tourId, tourStyleId, hotelOptionId, foodOptionId, participantsCount, startAt, endAt, bookingAddons: [{addonOptionId, nthDay, meal}]}
// startAt/endAt은 시간대 없는 KST (예: "2026-11-27T09:00:00"). totalPrice는 보내지 않는다 (백엔드가 계산).
export const createBookingApi = async (payload) => {
  if (IS_MOCK) {
    await sleep();
    return mockCreateBooking(payload);
  }

  const response = await client.post("/api/bookings", payload);
  return response.data;
};

// POST /api/bookings/{id}/payments → BookingResponse (status BOOKED)
export const payBookingApi = async (bookingId) => {
  if (IS_MOCK) {
    await sleep();
    const user = requireMockUser();
    const record = mockBookingRecords.find((b) => String(b.id) === String(bookingId));
    if (!record || record.userId !== user.id) throw mockError(404, "대상을 찾을 수 없습니다.");
    if (record.paidAt || record.status !== "CONFIRMED") throw mockError(409, "이미 결제된 예약입니다.");
    // 이번 결제 포함 결제 완료 2건 이상이면 단골로 전환 (백엔드 BookingService와 같음)
    const paidCount = mockBookingRecords.filter(
      (b) => b.userId === user.id && ["BOOKED", "DEPARTED", "ARRIVED"].includes(b.status),
    ).length + 1;
    if (paidCount >= 2) mockUsers.find((u) => u.id === user.id).isRegular = true;
    record.paidAt = new Date().toISOString().slice(0, 19);
    record.status = "BOOKED";
    return toBookingResponse(record);
  }

  const response = await client.post(`/api/bookings/${bookingId}/payments`, {});
  return response.data;
};

// ----- mock: 레코드 → 응답 모양 -----

const toBookingResponse = (r) =>
  dropNulls({
    id: r.id,
    tourId: r.tourId,
    userId: r.userId,
    tourStyleType: r.tourStyleType,
    totalPrice: r.totalPrice,
    participantsCount: r.participantsCount,
    startAt: r.startAt,
    endAt: r.endAt,
    status: r.status,
  });

const toBookingDetail = (r) => {
  const tour = mockTours.find((t) => t.id === r.tourId);
  const tourInfo = { ...tour };
  ["styles", "hotelOptions", "foodOptions", "addonOptions"].forEach((key) => delete tourInfo[key]);
  return dropNulls({
    id: r.id,
    tour: tourInfo,
    userId: r.userId,
    tourStyleId: r.tourStyleId,
    tourStyleType: r.tourStyleType,
    hotelOption: tour.hotelOptions.find((h) => h.id === r.hotelOptionId),
    foodOption: tour.foodOptions.find((f) => f.id === r.foodOptionId),
    bookingAddons: r.bookingAddons.map((a) => ({
      id: a.id,
      bookingId: r.id,
      addonOption: tour.addonOptions.find((option) => option.id === a.addonOptionId),
      nthDay: a.nthDay,
      meal: a.meal,
    })),
    totalPrice: r.totalPrice,
    discountPrice: r.discountPrice,
    paymentDueAt: r.paymentDueAt,
    paidAt: r.paidAt,
    participantsCount: r.participantsCount,
    startAt: r.startAt,
    endAt: r.endAt,
    nights: tour.nights,
    days: tour.days,
    status: r.status,
    createdAt: r.createdAt,
  });
};

const localNow = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 19);
};

const plusOneDay = (dateTime) => {
  const date = new Date(`${dateTime}Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 19);
};

const mockCreateBooking = async (request) => {
  const user = requireMockUser();
  const tour = mockTours.find((t) => t.id === request.tourId);
  if (!tour) throw mockError(404, "대상을 찾을 수 없습니다.");
  if (request.startAt.slice(11) !== tour.departureTime || request.endAt.slice(11) !== tour.arrivalTime) {
    throw mockError(400, "출발 및 도착 시각이 일치하지 않습니다.");
  }
  const nights = Math.round(
    (Date.parse(request.endAt.slice(0, 10)) - Date.parse(request.startAt.slice(0, 10))) / 86400000,
  );
  if (nights !== tour.nights || nights + 1 !== tour.days) throw mockError(400, "투어 일수가 일치하지 않습니다.");
  const style = tour.styles.find((s) => s.id === request.tourStyleId);
  if (GRAND_ONLY_THEMES.includes(tour.tourTheme) && style?.type === "CLASSIC") {
    throw mockError(400, "허니문, 효도 여행은 Classic 스타일을 선택할 수 없습니다.");
  }
  const addons = request.bookingAddons || [];
  const price = await calculateTourPriceApi(tour.id, { ...request, addonOptions: addons });

  // 같은 투어·같은 일정의 신청대기 예약과 합쳐 최소 인원이 되면 함께 확정
  const minimum = minParticipants(tour.tourTheme);
  let status = "PENDING";
  const waiting = mockBookingRecords.filter(
    (b) => b.tourId === tour.id && b.startAt === request.startAt && b.endAt === request.endAt && b.status === "PENDING",
  );
  const total = request.participantsCount + waiting.reduce((sum, b) => sum + b.participantsCount, 0);
  const createdAt = localNow();
  if (total >= minimum) {
    status = "CONFIRMED";
    waiting.forEach((b) => {
      b.status = "CONFIRMED";
      b.paymentDueAt = plusOneDay(createdAt);
    });
  }

  const record = {
    id: Math.max(...mockBookingRecords.map((b) => b.id)) + 1,
    tourId: tour.id,
    userId: user.id,
    tourStyleId: style.id,
    tourStyleType: style.type,
    hotelOptionId: request.hotelOptionId,
    foodOptionId: request.foodOptionId,
    bookingAddons: addons.map((a, index) => ({ id: Date.now() + index, ...a })),
    totalPrice: price.totalPrice,
    discountPrice: price.discountPrice,
    participantsCount: request.participantsCount,
    startAt: request.startAt,
    endAt: request.endAt,
    status,
    paymentDueAt: status === "CONFIRMED" ? plusOneDay(createdAt) : null,
    createdAt,
  };
  mockBookingRecords.push(record);
  return toBookingDetail(record);
};
