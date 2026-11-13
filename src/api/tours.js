import axios from "axios";
import { mockTours } from "../mocks/data"; // 백엔드가 꺼져있을 때 Fallback용 Mock 데이터

const API_BASE = "http://localhost:8080/api";

// 전체 투어 목록 조회
export const getToursApi = async () => {
  try {
    const response = await axios.get(`${API_BASE}/tours`, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.warn("Backend API not reachable, falling back to mockTours");
    return mockTours;
  }
};

// 단일 투어 상세 조회 (getTourDetailApi & getTourByIdApi 지원)
export const getTourDetailApi = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/tours/${id}`, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.warn(`Backend API not reachable for tour ${id}, falling back to mockTours`);
    return mockTours.find((t) => String(t.id) === String(id));
  }
};

// BookingPage.jsx 호환성을 위한 alias export
export const getTourByIdApi = getTourDetailApi;

// 실시간 가격 계산 (POST /api/tours/{id}/price)
export const calculateTourPriceApi = async (id, priceCalculatePayload) => {
  const response = await axios.post(`${API_BASE}/tours/${id}/price`, priceCalculatePayload, {
    withCredentials: true,
  });
  return response.data;
};