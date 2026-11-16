// src/api/tours.js
import axios from "axios";
import { mockTours } from "../mocks/data"; // 백엔드가 꺼져있을 때 Fallback용 Mock 데이터

const API_BASE = "http://localhost:8080/api";
const ADDED_TOURS_KEY = "mr_world_added_tours";

const getAddedTours = () => {
  try {
    const saved = sessionStorage.getItem(ADDED_TOURS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// 전체 투어 목록 조회
export const getToursApi = async () => {
  try {
    const response = await axios.get(`${API_BASE}/tours`, { withCredentials: true });
    return [...(response.data || []), ...getAddedTours()];
  } catch {
    console.warn("Backend API not reachable, falling back to mockTours");
    return [...mockTours, ...getAddedTours()];
  }
};

// 단일 투어 상세 조회 (getTourDetailApi & getTourByIdApi 지원)
export const getTourDetailApi = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/tours/${id}`, { withCredentials: true });
    return response.data;
  } catch {
    console.warn(`Backend API not reachable for tour ${id}, falling back to mockTours`);
    const allTours = [...mockTours, ...getAddedTours()];
    return allTours.find((t) => String(t.id) === String(id));
  }
};

// BookingPage.jsx 호환성을 위한 alias export
export const getTourByIdApi = getTourDetailApi;

// 신규 투어 등록 (백엔드 POST 시도 후 실패 시 sessionStorage에 추가)
export const createTourApi = async (newTour) => {
  try {
    const response = await axios.post(`${API_BASE}/tours`, newTour, { withCredentials: true });
    return { tour: response.data, persisted: true };
  } catch (err) {
    if (err.response) {
      throw err;
    }

    console.warn("Backend API not reachable for creating tour, saving to sessionStorage:", err);
    const added = getAddedTours();
    const localTour = { ...newTour, id: newTour.id ?? Date.now() };
    sessionStorage.setItem(ADDED_TOURS_KEY, JSON.stringify([...added, localTour]));
    return { tour: localTour, persisted: false };
  }
};

// 실시간 가격 계산 (POST /api/tours/{id}/price)
export const calculateTourPriceApi = async (id, priceCalculatePayload) => {
  const response = await axios.post(`${API_BASE}/tours/${id}/price`, priceCalculatePayload, {
    withCredentials: true,
  });
  return response.data;
};