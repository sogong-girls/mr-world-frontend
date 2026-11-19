// 예약 목록(BookingResponse: id, tourId, userId, tourStyleType, totalPrice, participantsCount, startAt, endAt, status)
// 에서 화면에 필요한 것만 고른다. 백엔드에 없는 필드는 쓰지 않는다.
import { STYLE_LABELS } from "../constants";
import { formatPeriod, formatWon } from "./format";

// startAt 내림차순 (최근 여행 먼저). 날짜 글자가 ISO 형식이라 글자 비교로 충분하다.
export const sortByStartDesc = (bookings) =>
  [...(bookings || [])].sort((a, b) => (b.startAt || "").localeCompare(a.startAt || ""));

// 지난 여행 = 완료(ARRIVED)된 예약
export const getPastTrips = (bookings) => sortByStartDesc(bookings).filter((b) => b.status === "ARRIVED");

// 확정됐는데 결제 전인 예약 (출발이 가까운 것 먼저)
export const getUnpaidBookings = (bookings) =>
  sortByStartDesc(bookings).filter((b) => b.status === "CONFIRMED").reverse();

export const toursById = (tours) => Object.fromEntries((tours || []).map((tour) => [String(tour.id), tour]));

// 말풍선·채팅에 보여 줄 한 줄: 상품, 기간, 등급, 가격
export const describeTrip = (booking, tourMap) => ({
  id: booking.id,
  name: tourMap?.[String(booking.tourId)]?.name || `투어 #${booking.tourId}`,
  period: formatPeriod(booking.startAt, booking.endAt),
  style: STYLE_LABELS[booking.tourStyleType] || booking.tourStyleType || "-",
  people: booking.participantsCount != null ? `${booking.participantsCount}명` : "",
  price: formatWon(booking.totalPrice),
});
