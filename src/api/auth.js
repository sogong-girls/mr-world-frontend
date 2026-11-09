// src/api/auth.js
import client from "./client";
import { mockUsers } from "../mocks/data";

const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const sleep = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const toPublicUser = (user) => {
  const publicUser = { ...user };
  delete publicUser.password;
  return publicUser;
};

export const loginApi = async (loginId, password) => {
  if (IS_MOCK) {
    await sleep();
    const user = mockUsers.find(
      (u) => u.loginId === loginId.trim() && u.password === password
    );
    if (!user) {
      const error = new Error("Invalid ID or password.");
      error.response = { status: 401, data: { message: "Invalid ID or password." } };
      throw error;
    }
    return {
      accessToken: `mock-jwt-${user.role.toLowerCase()}-token`,
      tokenType: "Bearer",
      user: toPublicUser(user),
    };
  }

  const response = await client.post("/api/auth/login", { loginId, password });
  return response.data;
};

export const signupApi = async (signUpData) => {
  if (IS_MOCK) {
    await sleep();
    // Check duplicate ID
    const exists = mockUsers.some((u) => u.loginId === signUpData.loginId);
    if (exists) {
      const error = new Error("Duplicate ID");
      error.response = { status: 409, data: { message: "이미 사용 중인 아이디입니다." } };
      throw error;
    }

    // Determine role (Staff code check)
    let role = "USER";
    if (signUpData.isStaff) {
      if (signUpData.staffCode !== "ADMIN123") {
        const error = new Error("Invalid staff code");
        error.response = { status: 400, data: { message: "직원 인증 코드가 올바르지 않습니다." } };
        throw error;
      }
      role = "ADMIN";
    }

    const newUser = {
      id: mockUsers.length + 1,
      loginId: signUpData.loginId,
      password: signUpData.password,
      role: role,
      name: signUpData.name,
      phoneNumber: signUpData.phoneNumber,
      address: signUpData.address,
      isRegular: false,
    };
    mockUsers.push(newUser);
    return newUser;
  }

  // Real backend call (matching OpenAPI spec)
  const response = await client.post("/api/auth/signup", {
    loginId: signUpData.loginId,
    password: signUpData.password,
    name: signUpData.name,
    phoneNumber: signUpData.phoneNumber,
    address: signUpData.address,
  });
  return response.data;
};

export const getMeApi = async () => {
  if (IS_MOCK) {
    await sleep();
    const token = localStorage.getItem("token");
    const role = token?.match(/^mock-jwt-(user|admin)-token$/)?.[1]?.toUpperCase();
    const user = mockUsers.find((mockUser) => mockUser.role === role);
    return user ? toPublicUser(user) : null;
  }

  const response = await client.get("/api/users/me");
  return response.data;
};

export const logoutApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return { message: "Logged out successfully" };
  }

  const response = await client.post("/api/auth/logout");
  return response.data;
};