// src/api/tours.js
import client, { IS_MOCK } from "./client";
import { mockSouvenirs, mockTours } from "../mocks/data";
import { currentMockUser, dropNulls, mockError, sleep } from "../mocks/helpers";
import { FOOD_TYPE_RANK, HOTEL_GRADE_RANK, STYLE_GRADE } from "../constants";

// 투어 정보는 여러 화면이 함께 쓰므로 한 번 받은 것을 다시 쓴다 (투어 등록 뒤에는 비움)
let listCache = null;
const detailCache = new Map();

const remember = (promise, onFail) => promise.catch((error) => {
  onFail();
  throw error;
});

export const clearTourCache = () => {
  listCache = null;
  detailCache.clear();
};

// GET /api/tours → TourListResponse[] (옵션 없음)
// lowestPrice = 스타일 기본가 중 최저가, souvenir = {id, name, description, stockCount}. 없으면 필드가 빠진다.
export const getToursApi = () => {
  if (!listCache) {
    listCache = remember(fetchTours(), () => {
      listCache = null;
    });
  }
  return listCache;
};

const fetchTours = async () => {
  if (IS_MOCK) {
    await sleep();
    return mockTours.map(({ id, name, departure, destination, tourTheme, nights, days, styles, souvenirId }) => {
      const basePrices = styles.map((s) => s.basePrice);
      const souvenir = mockSouvenirs.find((item) => item.id === souvenirId);
      return dropNulls({
        id, name, departure, destination, tourTheme, nights, days,
        lowestPrice: basePrices.length > 0 ? Math.min(...basePrices) : null,
        souvenir: souvenir ? { ...souvenir } : null,
      });
    });
  }
  const response = await client.get("/api/tours");
  return response.data;
};

// GET /api/tours/{id} → TourDetailResponse (styles, hotelOptions, foodOptions, addonOptions)
export const getTourDetailApi = (id) => {
  const key = String(id);
  if (!detailCache.has(key)) {
    detailCache.set(key, remember(fetchTourDetail(key), () => detailCache.delete(key)));
  }
  return detailCache.get(key);
};

const fetchTourDetail = async (id) => {
  if (IS_MOCK) {
    await sleep();
    const tour = mockTours.find((t) => String(t.id) === id);
    if (!tour) throw mockError(404, "대상을 찾을 수 없습니다.");
    // 백엔드처럼 souvenirId 대신 기념품 정보(souvenir)를 넣는다
    const { souvenirId, ...rest } = structuredClone(tour);
    const souvenir = mockSouvenirs.find((item) => item.id === souvenirId);
    return dropNulls({ ...rest, souvenir: souvenir ? { ...souvenir } : null });
  }
  const response = await client.get(`/api/tours/${id}`);
  return response.data;
};

// POST /api/tours/{id}/price
// body: {tourStyleId, hotelOptionId, foodOptionId, participantsCount, addonOptions: [{addonOptionId, nthDay, meal}]}
// → {totalPrice, discountPrice, finalPrice}. 금액은 프론트가 계산하지 않고 이 값을 그대로 보여 준다.
// 로그인 쿠키가 실리면 백엔드가 단골 할인(스타일의 regularDiscount)을 적용해 discountPrice를 채운다.
export const calculateTourPriceApi = async (id, payload) => {
  if (IS_MOCK) {
    await sleep(150);
    return mockCalculatePrice(id, payload);
  }
  const response = await client.post(`/api/tours/${id}/price`, payload);
  return response.data;
};

// POST /api/admin/tours (TourCreateRequest) → TourResponse
export const createTourApi = async (payload) => {
  if (IS_MOCK) {
    await sleep();
    return mockCreateTour(payload);
  }
  const response = await client.post("/api/admin/tours", payload);
  clearTourCache();
  return response.data;
};

// ----- mock: 백엔드 TourService.calculatePrice / AdminTourService.createTour와 같은 규칙 -----

const mockCalculatePrice = (id, { tourStyleId, hotelOptionId, foodOptionId, participantsCount, addonOptions = [] }) => {
  const tour = mockTours.find((t) => String(t.id) === String(id));
  const style = tour?.styles.find((s) => s.id === tourStyleId);
  const hotel = tour?.hotelOptions.find((h) => h.id === hotelOptionId);
  const food = tour?.foodOptions.find((f) => f.id === foodOptionId);
  if (!tour || !style || !hotel || !food) throw mockError(400, "해당 투어에 존재하지 않는 옵션입니다.");
  const grade = STYLE_GRADE[style.type];
  let perPerson = style.basePrice;
  if (HOTEL_GRADE_RANK[hotel.grade] > grade) perPerson += hotel.price;
  if (FOOD_TYPE_RANK[food.type] > grade) perPerson += food.price;
  for (const item of addonOptions) {
    const addon = tour.addonOptions.find((a) => a.id === item.addonOptionId);
    if (!addon) throw mockError(400, "해당 투어에 존재하지 않는 추가 옵션입니다.");
    perPerson += addon.price;
  }
  const totalPrice = perPerson * participantsCount;
  const rate = style.regularDiscount || 0;
  if (!currentMockUser()?.isRegular || rate <= 0) return { totalPrice, discountPrice: 0, finalPrice: totalPrice };
  const finalPrice = Math.round(totalPrice * (1 - rate));
  return { totalPrice, discountPrice: totalPrice - finalPrice, finalPrice };
};

const nextId = (items) => Math.max(0, ...items.map((item) => item.id)) + 1;

const mockCreateTour = (request) => {
  const allStyles = mockTours.flatMap((t) => t.styles);
  const allHotels = mockTours.flatMap((t) => t.hotelOptions);
  const allFoods = mockTours.flatMap((t) => t.foodOptions);
  const allAddons = mockTours.flatMap((t) => t.addonOptions);
  const tourId = nextId(mockTours);
  const tour = {
    id: tourId,
    name: request.name,
    departure: request.departure,
    destination: request.destination,
    tourTheme: request.tourTheme,
    transportType: request.transportType,
    souvenirId: request.souvenirId ?? null,
    nights: request.nights,
    days: request.days,
    departureTime: request.departureTime,
    arrivalTime: request.arrivalTime,
    course: request.course,
    description: request.description,
    styles: [],
    hotelOptions: [],
    foodOptions: [],
    addonOptions: [],
  };
  (request.tourStyles || []).forEach((styleRequest, index) => {
    const hotel = { id: nextId(allHotels) + index, tourId, ...styleRequest.hotelOption };
    const food = { id: nextId(allFoods) + index, tourId, ...styleRequest.foodOption };
    tour.hotelOptions.push(hotel);
    tour.foodOptions.push(food);
    tour.styles.push({
      id: nextId(allStyles) + index,
      tourId,
      type: styleRequest.type,
      basePrice: styleRequest.basePrice,
      regularDiscount: styleRequest.regularDiscount,
      hotelOptionId: hotel.id,
      foodOptionId: food.id,
      description: styleRequest.description,
    });
  });
  (request.addonOptions || []).forEach((addon, index) => {
    tour.addonOptions.push({ id: nextId(allAddons) + index, tourId, ...addon });
  });
  mockTours.push(tour);
  clearTourCache();
  const { id, name, departure, destination, tourTheme, nights, days } = tour;
  return { id, name, departure, destination, tourTheme, nights, days };
};
