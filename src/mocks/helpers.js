// mock 모드(VITE_USE_MOCK=true) 공통 도구
import { mockUsers } from "./data";

export const sleep = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// mock 로그인 상태 (실제 서버는 HttpOnly 쿠키라 이 값이 필요 없음)
const SESSION_KEY = "mr-world-mock-login-id";

export const setMockSession = (loginId) => {
  try {
    if (loginId) localStorage.setItem(SESSION_KEY, loginId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // 저장소를 못 써도 mock 로그인은 이번 화면에서만 유지됨
  }
};

const readMockSession = () => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

// 백엔드처럼 status와 본문(글자)을 가진 오류
export const mockError = (status, data, url = "") => {
  const error = new Error(typeof data === "string" ? data : data?.message);
  error.response = { status, data };
  error.config = { url };
  return error;
};

export const currentMockUser = () => mockUsers.find((user) => user.loginId === readMockSession()) || null;

export const requireMockUser = () => {
  const user = currentMockUser();
  if (!user) throw mockError(401, "ID 또는 비밀번호가 잘못되었습니다.");
  return user;
};

// 백엔드는 null인 필드를 빼고 보낸다 (Jackson non_null)
export const dropNulls = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value != null));

export const toPublicUser = (user) => {
  const publicUser = { ...user };
  delete publicUser.password;
  return publicUser;
};
