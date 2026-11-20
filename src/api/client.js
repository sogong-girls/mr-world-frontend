import axios from "axios";

// mock 데이터는 VITE_USE_MOCK=true일 때만 쓴다 (실패했다고 몰래 mock으로 넘어가지 않음)
export const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// 백엔드 주소. 비워 두면 같은 출처(/api/...)로 보낸다:
// 배포는 vercel.json rewrites, 개발은 vite.config.js proxy가 백엔드로 넘겨 준다.
const client = axios.create({
<<<<<<< Updated upstream
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true, // 로그인은 HttpOnly 쿠키(access_token, refresh_token)
  headers: {
    "Content-Type": "application/json",
  },
});
=======
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})
>>>>>>> Stashed changes

// 액세스 토큰(30분)이 만료되면 401 → refresh를 한 번 부르고 원래 요청을 다시 보낸다.
let refreshing = null;

<<<<<<< Updated upstream
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = config?.url?.startsWith("/api/auth/");
    if (response?.status !== 401 || !config || config._retried || isAuthCall) {
      throw error;
    }

    config._retried = true;
    refreshing ??= client.post("/api/auth/refresh").finally(() => {
      refreshing = null;
    });
    try {
      await refreshing;
    } catch {
      throw error; // refresh도 실패하면 원래 401을 그대로 던진다 (로그인 필요)
    }
    return client(config);
  },
);

export default client;
=======
export default client
>>>>>>> Stashed changes
