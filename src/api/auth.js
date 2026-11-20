// src/api/auth.js
// 로그인은 쿠키 방식: POST /api/auth/login → 204 + HttpOnly 쿠키. 사용자 정보는 GET /api/users/me로 받는다.
import client, { IS_MOCK } from "./client";
import { mockUsers } from "../mocks/data";
import { mockError, requireMockUser, setMockSession, sleep, toPublicUser } from "../mocks/helpers";

const USER_DIRECTORY_KEY = "mr_world_registered_users";

const rememberUser = (user) => {
  if (!user || user.id == null) return;
  try {
    const saved = JSON.parse(localStorage.getItem(USER_DIRECTORY_KEY) || "[]");
    const loginId = user.loginId || user.username || "";
    const name = user.name || "";
    const next = saved.filter((u) => String(u.id) !== String(user.id));
    next.push({ id: user.id, loginId, name });
    localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
};

export const loginApi = async (loginId, password) => {
  if (IS_MOCK) {
    await sleep();
    const user = mockUsers.find((u) => u.loginId === loginId && u.password === password);
    if (!user) throw mockError(401, "아이디 또는 비밀번호가 올바르지 않습니다.", "/api/auth/login");
    setMockSession(user.loginId);
    rememberUser(user);
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
    const publicUser = toPublicUser(newUser);
    rememberUser(publicUser);
    return publicUser;
  }

  const response = await client.post("/api/auth/signup", { loginId, password, name, phoneNumber, address });
  rememberUser(response.data);
  return response.data;
};

export const getMeApi = async () => {
  if (IS_MOCK) {
    await sleep();
    const user = toPublicUser(requireMockUser());
    rememberUser(user);
    return user;
  }

  const response = await client.get("/api/users/me");
  rememberUser(response.data);
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