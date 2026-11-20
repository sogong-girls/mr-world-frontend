// 날짜·금액 표기. 백엔드 시각은 시간대 없는 KST(LocalDateTime, 예: "2026-11-27T09:00:00")라
// Date로 바꾸지 않고 글자로 다룬다. toISOString()은 UTC라 오전 9시 전에는 날짜가 하루 어긋나서 쓰지 않는다.

const pad = (n) => String(n).padStart(2, "0");

export const toYmd = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayYmd = () => toYmd(new Date());

export const addDaysYmd = (ymd, days) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return toYmd(new Date(y, m - 1, d + days));
};

// "09:00" → "09:00:00" (LocalTime은 "09:00:00"으로 옴)
export const toLocalTime = (time) => {
  if (!time) return "00:00:00";
  return time.length === 5 ? `${time}:00` : time.slice(0, 8);
};

// 출발일 + 투어 일정 → 예약 요청의 startAt / endAt
export const tourStartAt = (ymd, tour) => `${ymd}T${toLocalTime(tour.departureTime)}`;
export const tourEndAt = (ymd, tour) =>
  `${addDaysYmd(ymd, Math.max(0, Number(tour.days || 1) - 1))}T${toLocalTime(tour.arrivalTime)}`;

// "2026-11-27T09:00:00" → "2026.11.27"
export const formatDate = (dateTime) => (dateTime ? dateTime.slice(0, 10).replaceAll("-", ".") : "");

// "2026-11-27T09:00:00" → "2026.11.27 09:00"
export const formatDateTime = (dateTime) =>
  dateTime ? `${formatDate(dateTime)} ${dateTime.slice(11, 16)}`.trim() : "";

export const formatPeriod = (startAt, endAt) => {
  if (!startAt && !endAt) return "일정 정보 없음";
  if (!endAt) return formatDate(startAt);
  return `${formatDate(startAt)} ~ ${formatDate(endAt)}`;
};

// "2026-12-03" → "2026년 12월 3일"
export const ymdToKorean = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
};

export const formatWon = (amount) => `${Number(amount || 0).toLocaleString("ko-KR")}원`;
