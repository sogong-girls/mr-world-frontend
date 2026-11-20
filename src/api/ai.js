// src/api/ai.js — AI 서버 (UC-06 Voice Order)
// 경로는 /api/ai/* (배포: vercel.json, 개발: vite proxy가 AI 서버로 넘김). 로그인 필요 없음.
import axios from "axios";

export const AI_TEXT_MAX_LENGTH = 500; // 글 500자
export const AI_VOICE_MAX_SECONDS = 15; // 음성 15초
export const AI_VOICE_MAX_BYTES = 5 * 1024 * 1024; // 음성 5MB

const aiClient = axios.create({
  baseURL: import.meta.env.VITE_AI_BASE_URL || "",
  timeout: 20000,
});

// context: {draft, confirmedFields, pastBookings, lastTranscripts}
// 응답 CommandResponse: {transcript, intent, draft, changedFields, confirmedFields, missingFields, reply, warnings}
export const sendTextCommandApi = async (text, context) => {
  const response = await aiClient.post("/api/ai/text-commands", { text, context });
  return response.data;
};

// multipart: audio = 녹음 파일, context = JSON 문자열
export const sendVoiceCommandApi = async (audioBlob, context) => {
  const extension = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("audio", audioBlob, `speech.${extension}`);
  form.append("context", JSON.stringify(context));
  const response = await aiClient.post("/api/ai/voice-commands", form);
  return response.data;
};
