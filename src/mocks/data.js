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
    isRegular: true, // VIP discount testing (2+ paid bookings)
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
    transport: "2_PEOPLE_CAR",
    souvenir_id: 1,
    description: "2인 전용 허니문 여행 상품",
    styles: [
      { id: 1, tourId: 1, tourStyle: "GRAND", basePrice: 1500000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 호텔 및 현지식" },
      { id: 2, tourId: 1, tourStyle: "PREMIUM", basePrice: 2500000, regularDiscount: 0.1, hotelOptionId: 3, foodOptionId: 3, description: "5성급 호텔 및 고급 레스토랑" }
    ],
    hotelOptions: [
      { id: 1, tourId: 1, name: "3성급 기본 호텔", location: "파리", option: "3_STAR", price: 0, description: "기본 숙소" },
      { id: 2, tourId: 1, name: "파리 그랜드 호텔", location: "파리", option: "4_STAR", price: 200000, description: "4성급 호텔" },
      { id: 3, tourId: 1, name: "리츠 파리", location: "파리", option: "5_STAR", price: 500000, description: "5성급 럭셔리 호텔" }
    ],
    foodOptions: [
      { id: 1, tourId: 1, name: "기본 도시락", option: "LUNCHBOX", price: 0, description: "간단 도시락" },
      { id: 2, tourId: 1, name: "유럽 현지식", option: "LOCAL_RESTAURANT", price: 50000, description: "현지식 레스토랑" },
      { id: 3, tourId: 1, name: "미슐랭 스테이크 코스", option: "PREMIUM_RESTAURANT", price: 150000, description: "파인 다이닝 스테이크 & 샴페인" }
    ],
    addonOptions: [
      { id: 1, tourId: 1, option: "COFFEE", price: 10000, description: "식사 시 커피 추가" },
      { id: 2, tourId: 1, option: "CHAMPAGNE", price: 50000, description: "식사 시 샴페인 추가" }
    ]
  },
  {
    id: 2,
    name: "효도 힐링 투어",
    departure: "서울",
    destination: "제주",
    tourTheme: "PARENT",
    transport: "10_PEOPLE_CAR",
    souvenir_id: 2,
    description: "부모님을 위한 힐링 여행",
    styles: [
      { id: 3, tourId: 2, tourStyle: "GRAND", basePrice: 1200000, regularDiscount: 0.1, hotelOptionId: 2, foodOptionId: 2, description: "4성급 호텔 및 현지식" }
    ],
    hotelOptions: [
      { id: 2, tourId: 2, name: "제주 그랜드 호텔", location: "제주", option: "4_STAR", price: 150000, description: "4성급 호텔" }
    ],
    foodOptions: [
      { id: 2, tourId: 2, name: "제주 향토 음식", option: "LOCAL_RESTAURANT", price: 40000, description: "현지식 레스토랑" }
    ],
    addonOptions: [
      { id: 1, tourId: 2, option: "COFFEE", price: 5000, description: "식사 시 커피 추가" }
    ]
  }
];

export const mockBookings = [
  {
    id: 101,
    tourId: 1,
    userId: 1,
    tourName: "허니문 낭만 투어",
    tourStyle: "GRAND",
    totalPrice: 1500000,
    discountPrice: 150000,
    participantsCount: 2,
    startAt: "2026-11-20T09:00:00+09:00",
    endAt: "2026-11-23T18:00:00+09:00",
    status: "CONFIRMED", // Test payment pending speech bubble
    createdAt: "2026-10-01T14:30:00+09:00",
    tourStyleId: 1,
    hotelOptionId: 2,
    foodOptionId: 2,
    nNights: 3,
    nDays: 4,
    addons: [{ id: 1, addonOptionId: 1, day: 1 }]
  }
];