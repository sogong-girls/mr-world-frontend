// src/mocks/data.js

export const mockUsers = [
  {
    id: 1,
    loginId: "user123",
    password: "password123!",
    role: "USER",
    name: "홍길동",
    phoneNumber: "010-1234-5678",
    address: "서울특별시 강남구",
    isRegular: true,
  },
  {
    id: 2,
    loginId: "admin",
    password: "admin123!",
    role: "ADMIN",
    name: "관리자",
    phoneNumber: "010-9999-9999",
    address: "서울특별시 중구",
    isRegular: false,
  },
];

export const mockTours = [
  {
    id: 1,
    name: "허니문 낭만 투어",
    departure: "서울",
    destination: "유럽",
    tourTheme: "HONEYMOON",
    transportType: "_2_PEOPLE_CAR",
    souvenirId: 1,
    nights: 6,
    days: 7,
    departureTime: "09:00",
    arrivalTime: "18:00",
    course: "파리 -> 로마 -> 베네치아",
    description: "로맨틱 스페셜 룸 데코레이션, 커플 기념 티, 2인 전용 고급 차량 제공",
    styles: [
      { id: 1, tourId: 1, type: "GRAND", basePrice: 2180000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 호텔 및 현지식 레스토랑" },
      { id: 2, tourId: 1, type: "PREMIUM", basePrice: 2940000, regularDiscount: 0.1, hotelOptionId: 3, foodOptionId: 3, description: "5성급 호텔 및 스테이크 전문 고급 레스토랑" }
    ],
    hotelOptions: [
      { id: 1, tourId: 1, name: "3성급 부티크 호텔", location: "파리", grade: "_3_STAR", price: 0, description: "클래식 선택 시 이용 가능한 기본 호텔" },
      { id: 2, tourId: 1, name: "4성급 프리미엄 호텔", location: "파리", grade: "_4_STAR", price: 200000, description: "그랜드 기본 호텔" },
      { id: 3, tourId: 1, name: "5성급 로맨틱 호텔", location: "파리", grade: "_5_STAR", price: 350000, description: "프리미엄 기본 호텔" }
    ],
    foodOptions: [
      { id: 1, tourId: 1, name: "도시락", type: "LUNCHBOX", price: 0, description: "클래식 기본 식사" },
      { id: 2, tourId: 1, name: "현지식 레스토랑", type: "LOCAL_RESTAURANT", price: 50000, description: "그랜드 기본 식사" },
      { id: 3, tourId: 1, name: "스테이크 전문 고급 레스토랑", type: "PREMIUM_RESTAURANT", price: 180000, description: "프리미엄 기본 식사, 스테이크와 샴페인 제공" }
    ],
    addonOptions: [
      { id: 1, tourId: 1, type: "COFFEE", price: 10000, description: "원하는 식사 때 커피 추가" },
      { id: 2, tourId: 1, type: "CHAMPAGNE", price: 50000, description: "원하는 식사 때 샴페인 추가" }
    ]
  },
  {
    id: 2,
    name: "효도 힐링 투어",
    departure: "서울",
    destination: "일본 온천 지역",
    tourTheme: "PARENT",
    transportType: "_10_PEOPLE_CAR",
    souvenirId: 2,
    nights: 3,
    days: 4,
    departureTime: "10:00",
    arrivalTime: "16:00",
    course: "온천 마을 -> 교토 -> 오사카",
    description: "고품격 안마·지압 서비스, 건강 인삼 기념품, 10인승 고급 승합차 제공",
    styles: [
      { id: 3, tourId: 2, type: "GRAND", basePrice: 1940000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 료칸 및 현지식 레스토랑" },
      { id: 6, tourId: 2, type: "PREMIUM", basePrice: 2580000, regularDiscount: 0.1, hotelOptionId: 3, foodOptionId: 3, description: "5성급 료칸 및 스테이크 전문 고급 레스토랑" }
    ],
    hotelOptions: [
      { id: 1, tourId: 2, name: "3성급 온천 호텔", location: "일본 온천 지역", grade: "_3_STAR", price: 0, description: "클래식 선택 시 이용 가능한 기본 호텔" },
      { id: 2, tourId: 2, name: "4성급 온천 료칸", location: "일본 온천 지역", grade: "_4_STAR", price: 150000, description: "그랜드 기본 료칸" },
      { id: 3, tourId: 2, name: "5성급 프리미엄 료칸", location: "일본 온천 지역", grade: "_5_STAR", price: 300000, description: "프리미엄 기본 료칸" }
    ],
    foodOptions: [
      { id: 1, tourId: 2, name: "도시락", type: "LUNCHBOX", price: 0, description: "클래식 기본 식사" },
      { id: 2, tourId: 2, name: "가이세키 정식", type: "LOCAL_RESTAURANT", price: 40000, description: "그랜드 기본 현지식" },
      { id: 3, tourId: 2, name: "스테이크 전문 고급 레스토랑", type: "PREMIUM_RESTAURANT", price: 150000, description: "프리미엄 기본 식사, 스테이크와 샴페인 제공" }
    ],
    addonOptions: [
      { id: 1, tourId: 2, type: "COFFEE", price: 5000, description: "원하는 식사 때 커피 추가" },
      { id: 2, tourId: 2, type: "CHAMPAGNE", price: 45000, description: "원하는 식사 때 샴페인 추가" }
    ]
  },
  {
    id: 3,
    name: "골프 챌린지 투어",
    departure: "서울",
    destination: "제주도",
    tourTheme: "GOLF",
    transportType: "_10_PEOPLE_CAR",
    souvenirId: 3,
    nights: 2,
    days: 3,
    departureTime: "08:00",
    arrivalTime: "19:00",
    course: "제주 명문 골프장 36홀",
    description: "유명 골프 리조트 테마 연출, 골프 액세서리와 골프공 제공, 10인승 고급 승합차 이용",
    styles: [
      { id: 4, tourId: 3, type: "CLASSIC", basePrice: 990000, regularDiscount: 0.1, hotelOptionId: 1, foodOptionId: 1, description: "3성급 리조트 및 도시락" },
      { id: 7, tourId: 3, type: "GRAND", basePrice: 1390000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 리조트 및 현지식 레스토랑" },
      { id: 8, tourId: 3, type: "PREMIUM", basePrice: 1890000, regularDiscount: 0.1, hotelOptionId: 3, foodOptionId: 3, description: "5성급 리조트 및 스테이크 전문 고급 레스토랑" }
    ],
    hotelOptions: [
      { id: 1, tourId: 3, name: "3성급 제주 골프 리조트", location: "제주도", grade: "_3_STAR", price: 0, description: "클래식 기본 리조트" },
      { id: 2, tourId: 3, name: "4성급 제주 골프 리조트", location: "제주도", grade: "_4_STAR", price: 180000, description: "그랜드 리조트" },
      { id: 3, tourId: 3, name: "5성급 제주 골프 리조트", location: "제주도", grade: "_5_STAR", price: 420000, description: "프리미엄 리조트" }
    ],
    foodOptions: [
      { id: 1, tourId: 3, name: "도시락", type: "LUNCHBOX", price: 0, description: "클래식 기본 식사" },
      { id: 2, tourId: 3, name: "클럽하우스 현지식", type: "LOCAL_RESTAURANT", price: 70000, description: "그랜드 기본 식사" },
      { id: 3, tourId: 3, name: "스테이크 전문 고급 레스토랑", type: "PREMIUM_RESTAURANT", price: 160000, description: "프리미엄 기본 식사, 스테이크와 샴페인 제공" }
    ],
    addonOptions: [
      { id: 1, tourId: 3, type: "COFFEE", price: 10000, description: "원하는 식사 때 커피 추가" },
      { id: 2, tourId: 3, type: "CHAMPAGNE", price: 50000, description: "원하는 식사 때 샴페인 추가" }
    ]
  },
  {
    id: 4,
    name: "아웃도어 트레킹 투어",
    departure: "서울",
    destination: "설악산",
    tourTheme: "TREKKING",
    transportType: "_10_PEOPLE_CAR",
    souvenirId: 4,
    nights: 1,
    days: 2,
    departureTime: "07:00",
    arrivalTime: "17:00",
    course: "설악산 비선대 -> 대청봉 코스",
    description: "전문 가이드와 함께하는 아웃도어 트레킹, 산악 테마 연출과 기념 스카프 제공, 10인승 고급 승합차 이용",
    styles: [
      { id: 5, tourId: 4, type: "CLASSIC", basePrice: 390000, regularDiscount: 0.1, hotelOptionId: 1, foodOptionId: 1, description: "3성급 산악 숙소 및 도시락" },
      { id: 9, tourId: 4, type: "GRAND", basePrice: 590000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 숙소 및 현지식 레스토랑" },
      { id: 10, tourId: 4, type: "PREMIUM", basePrice: 890000, regularDiscount: 0.1, hotelOptionId: 3, foodOptionId: 3, description: "5성급 숙소 및 스테이크 전문 고급 레스토랑" }
    ],
    hotelOptions: [
      { id: 1, tourId: 4, name: "3성급 산악 숙소", location: "설악산", grade: "_3_STAR", price: 0, description: "클래식 기본 숙소" },
      { id: 2, tourId: 4, name: "4성급 산악 호텔", location: "설악산", grade: "_4_STAR", price: 100000, description: "그랜드 숙소" },
      { id: 3, tourId: 4, name: "5성급 산악 리조트", location: "설악산 인근", grade: "_5_STAR", price: 250000, description: "프리미엄 숙소" }
    ],
    foodOptions: [
      { id: 1, tourId: 4, name: "도시락", type: "LUNCHBOX", price: 0, description: "클래식 기본 식사" },
      { id: 2, tourId: 4, name: "산채 정식", type: "LOCAL_RESTAURANT", price: 35000, description: "그랜드 기본 지역 식사" },
      { id: 3, tourId: 4, name: "스테이크 전문 고급 레스토랑", type: "PREMIUM_RESTAURANT", price: 90000, description: "프리미엄 기본 식사, 스테이크와 샴페인 제공" }
    ],
    addonOptions: [
      { id: 1, tourId: 4, type: "COFFEE", price: 5000, description: "원하는 식사 때 커피 추가" },
      { id: 2, tourId: 4, type: "CHAMPAGNE", price: 40000, description: "원하는 식사 때 샴페인 추가" }
    ]
  }
];

export const mockBookings = [
  {
    id: 100,
    tourId: 1,
    tourName: "허니문 낭만 투어",
    userId: 1,
    tourStyleType: "GRAND",
    hotelOption: "5성급 로맨틱 호텔",
    mealOption: "스테이크 전문 고급 레스토랑",
    bookingAddons: ["커피 (2일차 저녁)", "샴페인 (4일차 저녁)"],
    totalPrice: 5540000,
    participantsCount: 2,
    startAt: "2026-08-03T09:00:00+09:00",
    endAt: "2026-08-10T18:00:00+09:00",
    status: "ARRIVED",
    createdAt: "2026-06-01T14:30:00+09:00"
  },
  {
    id: 101,
    tourId: 4,
    userId: 1,
    tourStyleType: "CLASSIC",
    totalPrice: 780000,
    participantsCount: 2,
    startAt: "2027-03-10T07:00:00+09:00",
    endAt: "2027-03-11T17:00:00+09:00",
    status: "PENDING",
    createdAt: "2026-11-01T14:30:00+09:00"
  }
];

