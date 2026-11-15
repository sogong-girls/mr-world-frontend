// src/api/auth.js
// 로그인은 쿠키 방식: POST /api/auth/login → 204 + HttpOnly 쿠키. 사용자 정보는 GET /api/users/me로 받는다.
import client, { IS_MOCK } from "./client";
import { mockUsers } from "../mocks/data";
import { mockError, requireMockUser, setMockSession, sleep, toPublicUser } from "../mocks/helpers";

export const loginApi = async (loginId, password) => {
  if (IS_MOCK) {
    await sleep();
    const user = mockUsers.find((u) => u.loginId === loginId && u.password === password);
    if (!user) throw mockError(401, "ID 또는 비밀번호가 잘못되었습니다.", "/api/auth/login");
    setMockSession(user.loginId);
    return;
  }

  await client.post("/api/auth/login", { loginId, password });
};

// 직원 가입은 백엔드에 없어서 고객(USER)으로만 가입한다
export const signupApi = async ({ loginId, password, name, phoneNumber, address }) => {
  if (IS_MOCK) {
    await sleep();
    if (mockUsers.some((u) => u.loginId === loginId)) {
      throw mockError(409, "이미 사용 중인 아이디입니다.");
    }
    const newUser = {
      id: Math.max(...mockUsers.map((u) => u.id)) + 1,
      loginId,
      password,
      role: "USER",
      name,
      phoneNumber,
      address,
      isRegular: false,
    };
    mockUsers.push(newUser);
    return toPublicUser(newUser);
  }

  const response = await client.post("/api/auth/signup", { loginId, password, name, phoneNumber, address });
  return response.data;
};

export const getMeApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return toPublicUser(requireMockUser());
  }

  const response = await client.get("/api/users/me");
  return response.data;
};

export const logoutApi = async () => {
  if (IS_MOCK) {
    await sleep();
    setMockSession(null);
    return;
  }

  await client.post("/api/auth/logout");
};
