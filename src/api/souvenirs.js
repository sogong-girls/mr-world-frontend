// src/api/souvenirs.js (직원 전용 기념품 창고, UC-08 Manage Inventory)
import client, { IS_MOCK } from "./client";
import { mockBookingRecords, mockSouvenirs, mockTours } from "../mocks/data";
import { mockError, sleep } from "../mocks/helpers";

// GET /api/admin/souvenirs → SouvenirStockResponse[]
// {id, name, description, stockCount, requiredCount, bookings: [{bookingId, tourId, startAt, status, quantity}]}
// requiredCount = 결제 완료(BOOKED)·출발 전 예약 인원 합 (1인당 1개)
export const getSouvenirsApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return mockSouvenirs.map((item) => {
      const bookings = mockBookingRecords
        .filter((b) => b.status === "BOOKED" && mockTours.find((t) => t.id === b.tourId)?.souvenirId === item.id)
        .map((b) => ({ bookingId: b.id, tourId: b.tourId, startAt: b.startAt, status: b.status, quantity: b.participantsCount }));
      return {
        ...item,
        requiredCount: bookings.reduce((sum, b) => sum + b.quantity, 0),
        bookings,
      };
    });
  }
  const response = await client.get("/api/admin/souvenirs");
  return response.data;
};

// PATCH /api/admin/souvenirs/{id}/stock  body {amount} (증감값: +1 입고, -1 출고) → SouvenirResponse {id, name, description, stockCount}
export const updateSouvenirStockApi = async (id, amount) => {
  if (IS_MOCK) {
    await sleep(150);
    const item = mockSouvenirs.find((s) => s.id === id);
    if (!item) throw mockError(404, "대상을 찾을 수 없습니다.");
    if (item.stockCount + amount < 0) throw mockError(400, "잘못된 요청입니다.");
    item.stockCount += amount;
    return { ...item };
  }
  const response = await client.patch(`/api/admin/souvenirs/${id}/stock`, { amount });
  return response.data;
};
