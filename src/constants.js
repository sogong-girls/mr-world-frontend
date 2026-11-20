// 도메인 규칙과 화면 표기 (enum 값은 백엔드와 같게)

// 예약 1건 최대 인원 (모든 투어 공통, 차량 정원과 무관)
export const MAXIMUM_N_PEOPLE = 40;

// 같은 투어·같은 출발일 신청 인원이 이만큼 모이면 확정 (허니문 2명, 나머지 3명)
export const minParticipants = (tourTheme) => (tourTheme === "HONEYMOON" ? 2 : 3);
export const minPeopleNotice = (n) =>
  `출발일 2주 전까지 같은 날짜에 함께 가는 인원이 ${n}명 이상 모이지 않으면 예약이 확정되지 않을 수 있어요.`;

export const THEME_LABELS = {
  HONEYMOON: "허니문",
  PARENT: "효도",
  GOLF: "골프",
  TREKKING: "트레킹",
};

// Honeymoon·Parents 테마는 Grand 이상만
export const GRAND_ONLY_THEMES = ["HONEYMOON", "PARENT"];

export const STYLE_TYPES = ["CLASSIC", "GRAND", "PREMIUM"];
export const STYLE_LABELS = { CLASSIC: "클래식", GRAND: "그랜드", PREMIUM: "프리미엄" };
export const STYLE_GRADE = { CLASSIC: 3, GRAND: 4, PREMIUM: 5 };
// 스타일마다 정해진 호텔 등급·식사 종류 (투어 등록 시 백엔드가 같은지 검사)
export const STYLE_HOTEL_GRADE = { CLASSIC: "_3_STAR", GRAND: "_4_STAR", PREMIUM: "_5_STAR" };
export const STYLE_FOOD_TYPE = { CLASSIC: "LUNCHBOX", GRAND: "LOCAL_RESTAURANT", PREMIUM: "PREMIUM_RESTAURANT" };

export const HOTEL_GRADE_LABELS = { _3_STAR: "3성급", _4_STAR: "4성급", _5_STAR: "5성급" };
export const HOTEL_GRADE_RANK = { _3_STAR: 3, _4_STAR: 4, _5_STAR: 5 };
export const FOOD_TYPE_LABELS = { LUNCHBOX: "도시락", LOCAL_RESTAURANT: "현지식", PREMIUM_RESTAURANT: "스테이크" };
export const FOOD_TYPE_RANK = { LUNCHBOX: 3, LOCAL_RESTAURANT: 4, PREMIUM_RESTAURANT: 5 };

export const ADDON_TYPES = ["COFFEE", "CHAMPAGNE"];
export const ADDON_LABELS = { COFFEE: "커피", CHAMPAGNE: "샴페인" };

export const MEALS = ["BREAKFAST", "LUNCH", "DINNER"];
export const MEAL_LABELS = { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" };

export const TRANSPORT_TYPES = ["_2_PEOPLE_CAR", "_10_PEOPLE_CAR", "PREMIUM_CAR"];
export const TRANSPORT_LABELS = {
  _2_PEOPLE_CAR: "2인승 차량",
  _10_PEOPLE_CAR: "10인승 차량",
  PREMIUM_CAR: "프리미엄 차량",
};

// 신청대기 → 확정(결제 대기) → 준비(결제 완료) → 진행 → 완료
export const BOOKING_STATUS = {
  PENDING: { label: "신청대기", hint: "인원 모집 중", color: "#a15f13" },
  CONFIRMED: { label: "확정", hint: "결제 대기", color: "#1e5a44" },
  BOOKED: { label: "준비", hint: "결제 완료", color: "#395fb2" },
  DEPARTED: { label: "진행", hint: "여행 중", color: "#1a1d4c" },
  ARRIVED: { label: "완료", hint: "여행 끝", color: "#151516" },
};

export const statusText = (status) => {
  const info = BOOKING_STATUS[status];
  return info ? `${info.label} (${info.hint})` : status || "-";
};
