import { createContext, useContext } from "react";

export const AiChatContext = createContext(null);

// AI 채팅 전역 저장소: 대화 기록, draft, confirmedFields, 내 예약 목록 (AI 채팅 페이지와 예약 페이지가 함께 씀)
export const useAiChat = () => useContext(AiChatContext);
