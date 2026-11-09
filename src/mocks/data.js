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
    nights: 8,
    days: 10,
    departureTime: "09:00",
    arrivalTime: "18:00",
    course: "파리 -> 로마 -> 베네치아",
    description: "2인 전용 프라이빗 허니문 여행 패키지",
    styles: [
      { id: 1, tourId: 1, type: "GRAND", basePrice: 2180000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 호텔 및 현지식" },
      { id: 2, tourId: 1, type: "PREMIUM", basePrice: 2940000, regularDiscount: 0.1, hotelOptionId: 3, foodOptionId: 3, description: "5성급 호텔 및 고급 파인다이닝" }
    ],
    hotelOptions: [
      { id: 1, tourId: 1, name: "3성급 부티크 호텔", location: "파리", grade: "_3_STAR", price: 0, description: "기본 호텔" },
      { id: 2, tourId: 1, name: "4성급 프리미엄 호텔", location: "파리", grade: "_4_STAR", price: 200000, description: "4성급 호텔" }
    ],
    foodOptions: [
      { id: 1, tourId: 1, name: "기본 조식", type: "LUNCHBOX", price: 0, description: "조식 제공" },
      { id: 2, tourId: 1, name: "현지식 레스토랑", type: "LOCAL_RESTAURANT", price: 50000, description: "조식 및 석식" }
    ],
    addonOptions: [
      { id: 1, tourId: 1, type: "COFFEE", price: 10000, description: "식사 시 커피 추가" },
      { id: 2, tourId: 1, type: "CHAMPAGNE", price: 50000, description: "웰컴 샴페인 추가" }
    ]
  },
  {
    id: 2,
    name: "오사카 효도 힐링 투어",
    departure: "서울",
    destination: "오사카",
    tourTheme: "PARENT",
    transportType: "_10_PEOPLE_CAR",
    souvenirId: 2,
    nights: 4,
    days: 5,
    departureTime: "10:00",
    arrivalTime: "16:00",
    course: "오사카 -> 교토 -> 온천 마을",
    description: "부모님을 위한 쉼과 회복의 온천 여행 패키지",
    styles: [
      { id: 3, tourId: 2, type: "GRAND", basePrice: 1940000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 료칸 숙박" }
    ],
    hotelOptions: [
      { id: 2, tourId: 2, name: "오사카 료칸 호텔", location: "오사카", grade: "_4_STAR", price: 150000, description: "온천 료칸" }
    ],
    foodOptions: [
      { id: 2, tourId: 2, name: "가이세키 정식", type: "LOCAL_RESTAURANT", price: 40000, description: "료칸 식사" }
    ],
    addonOptions: [
      { id: 1, tourId: 2, type: "COFFEE", price: 5000, description: "다도 세트 추가" }
    ]
  },
  {
    id: 3,
    name: "제주 명문 골프 리조트 투어",
    departure: "서울",
    destination: "제주",
    tourTheme: "GOLF",
    transportType: "PREMIUM_CAR",
    souvenirId: 3,
    nights: 3,
    days: 4,
    departureTime: "08:00",
    arrivalTime: "19:00",
    course: "제주 명문 골프장 36홀",
    description: "새로운 곳에서의 라운딩과 휴식",
    styles: [
      { id: 4, tourId: 3, type: "CLASSIC", basePrice: 1690000, regularDiscount: 0.1, hotelOptionId: 1, foodOptionId: 1, description: "3성급 리조트 숙박" }
    ],
    hotelOptions: [
      { id: 1, tourId: 3, name: "제주 골프 리조트", location: "제주", grade: "_3_STAR", price: 0, description: "리조트 룸" }
    ],
    foodOptions: [
      { id: 1, tourId: 3, name: "클럽하우스 식사", type: "LOCAL_RESTAURANT", price: 0, description: "클럽하우스 뷔페" }
    ],
    addonOptions: [
      { id: 1, tourId: 3, type: "COFFEE", price: 10000, description: "커피 및 음료 제공" }
    ]
  },
  {
    id: 4,
    name: "설악산 아웃도어 트레킹 투어",
    departure: "서울",
    destination: "설악산",
    tourTheme: "TREKKING",
    transportType: "PREMIUM_CAR",
    souvenirId: 4,
    nights: 2,
    days: 3,
    departureTime: "07:00",
    arrivalTime: "17:00",
    course: "설악산 비선대 -> 대청봉 코스",
    description: "전문 가이드와 함께하는 아웃도어 트레킹",
    styles: [
      { id: 5, tourId: 4, type: "CLASSIC", basePrice: 690000, regularDiscount: 0.1, hotelOptionId: 1, foodOptionId: 1, description: "산장 호텔 숙박" }
    ],
    hotelOptions: [
      { id: 1, tourId: 4, name: "설악 산악 호텔", location: "설악산", grade: "_3_STAR", price: 0, description: "산악 호텔" }
    ],
    foodOptions: [
      { id: 1, tourId: 4, name: "산채 정식", type: "LOCAL_RESTAURANT", price: 0, description: "지역 특산 식사" }
    ],
    addonOptions: [
      { id: 1, tourId: 4, type: "COFFEE", price: 5000, description: "보온병 음료 추가" }
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
    hotelOption: "4성급 프리미엄 호텔",
    mealOption: "현지식 레스토랑",
    bookingAddons: ["웰컴 샴페인"],
    totalPrice: 4360000,
    participantsCount: 2,
    startAt: "2026-08-03T09:00:00+09:00",
    endAt: "2026-08-10T18:00:00+09:00",
    status: "ARRIVED",
    createdAt: "2026-06-01T14:30:00+09:00"
  },
  {
    id: 101,
    tourId: 1,
    userId: 1,
    tourStyleType: "GRAND",
    totalPrice: 1500000,
    participantsCount: 2,
    startAt: "2026-11-20T09:00:00+09:00",
    endAt: "2026-11-23T18:00:00+09:00",
    status: "CONFIRMED",
    createdAt: "2026-10-01T14:30:00+09:00"
  }
];