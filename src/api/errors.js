// 오류 응답에서 화면에 보여 줄 문장을 꺼낸다.
// - 백엔드: 본문이 글자 그대로 옴 (예: "출발 및 도착 시각이 일치하지 않습니다.")
// - AI 서버: {status, code, message}
export const getErrorMessage = (error, fallback = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.") => {
  const response = error?.response;
  if (!response) {
    if (error?.code === "ECONNABORTED") return "응답이 늦어요. 잠시 후 다시 시도해 주세요.";
    return error?.message && !error?.isAxiosError ? error.message : "서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.";
  }

  const { status, data } = response;
  const url = error.config?.url || "";
  // 로그인하지 않았거나 세션이 끝났을 때 백엔드는 "ID 또는 비밀번호가 잘못되었습니다."를 주므로 로그인 요청에만 그 문장을 쓴다
  if (status === 401 && !url.startsWith("/api/auth/login")) {
    return "로그인이 필요해요. 다시 로그인해 주세요.";
  }

  const message = typeof data === "string" ? data : data?.message;
  // 백엔드 500은 자바 예외 문장이 그대로 와서 고객에게 보여 주지 않는다 (AI 서버의 5xx는 안내 문장이라 그대로 씀)
  if (status >= 500 && typeof data === "string") return fallback;
  return message?.trim() ? message : fallback;
};

// 백엔드는 연락처가 겹치면 DB 제약 오류를 500으로 돌려준다 (회원가입·내 정보 수정)
export const isDuplicatePhoneError = (error) => {
  const data = error?.response?.data;
  return typeof data === "string" && data.includes("phone_number") && /duplicate|unique|중복/i.test(data);
};

// AI 서버 오류 코드 (예: NO_SPEECH, RATE_LIMITED)
export const getErrorCode = (error) => {
  const data = error?.response?.data;
  return data && typeof data === "object" ? data.code : undefined;
};
