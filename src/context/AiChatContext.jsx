// src/context/AiChatContext.jsx
// 대화 기록·draft·confirmedFields를 전역에 두고 예약 페이지와 공유한다 (UC-06).
// AI 응답의 draft·confirmedFields는 받은 값으로 통째로 바꾼다. 새로고침해도 이어지도록 탭 저장소(sessionStorage)에 둔다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { AiChatContext } from "./useAiChat";
import { getMyBookingsApi } from "../api/bookings";
import { sendTextCommandApi, sendVoiceCommandApi } from "../api/ai";
import { getErrorCode, getErrorMessage } from "../api/errors";
import { getPastTrips, sortByStartDesc } from "../utils/travelHistory";

const STORAGE_PREFIX = "mr-world-ai-chat:";
const MAX_SAVED_MESSAGES = 60;
const EMPTY_SESSION = { messages: [], draft: null, confirmedFields: [], lastTranscripts: [] };

let messageSeq = 0;
const newMessageId = () => `${Date.now()}-${messageSeq++}`;

const loadSession = (key) => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + key) || "null");
    return saved ? { ...EMPTY_SESSION, ...saved } : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
};

export const AiChatProvider = ({ children }) => {
  const { user } = useAuth();
  const sessionKey = user ? `user-${user.id}` : "guest";
  const isCustomer = user?.role === "USER";

  // ----- 대화 세션 (사용자마다 따로) -----
  const [state, setState] = useState({ key: null, ...EMPTY_SESSION });
  const session = useMemo(
    () => (state.key === sessionKey ? state : { key: sessionKey, ...loadSession(sessionKey) }),
    [state, sessionKey],
  );

  const update = useCallback(
    (change) =>
      setState((prev) => {
        const base = prev.key === sessionKey ? prev : { key: sessionKey, ...loadSession(sessionKey) };
        return { ...base, ...change(base), key: sessionKey };
      }),
    [sessionKey],
  );

  useEffect(() => {
    if (!state.key) return;
    try {
      const { messages, draft, confirmedFields, lastTranscripts } = state;
      sessionStorage.setItem(
        STORAGE_PREFIX + state.key,
        JSON.stringify({ messages: messages.slice(-MAX_SAVED_MESSAGES), draft, confirmedFields, lastTranscripts }),
      );
    } catch {
      // 저장소를 못 써도 이번 화면에서는 대화가 이어짐
    }
  }, [state]);

  // ----- 내 예약 목록 (말풍선, 채팅 첫 인사, AI context의 pastBookings) -----
  const [bookingsState, setBookingsState] = useState({ key: null, status: "idle", items: [] });
  const [bookingsVersion, setBookingsVersion] = useState(0);
  const bookingsKey = isCustomer ? `${sessionKey}#${bookingsVersion}` : null;

  useEffect(() => {
    if (!bookingsKey) return undefined;
    let active = true;
    getMyBookingsApi()
      .then((items) => {
        if (active) setBookingsState({ key: bookingsKey, status: "ready", items: sortByStartDesc(items) });
      })
      .catch((error) => {
        if (active) {
          setBookingsState({ key: bookingsKey, status: "error", items: [], error: getErrorMessage(error) });
        }
      });
    return () => {
      active = false;
    };
  }, [bookingsKey]);

  const myBookings = useMemo(() => {
    if (!isCustomer) return { status: "none", items: [] };
    if (bookingsState.key === bookingsKey) return bookingsState;
    // 다시 받는 동안에는 이전 목록을 그대로 보여 준다
    const sameUser = bookingsState.key?.startsWith(`${sessionKey}#`);
    return { status: "loading", items: sameUser ? bookingsState.items : [] };
  }, [isCustomer, bookingsState, bookingsKey, sessionKey]);

  const reloadMyBookings = useCallback(() => setBookingsVersion((v) => v + 1), []);

  // ----- AI 서버에 보내기 -----
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const send = useCallback(
    async ({ text, audio }) => {
      if (sendingRef.current) return null;
      sendingRef.current = true;
      setSending(true);

      const context = {
        draft: session.draft,
        confirmedFields: session.confirmedFields,
        // 지난 여행 = 완료(ARRIVED)된 예약만, 최근순. 출발 전 예약까지 넘기면 "지난번이랑 똑같이"가 앞으로 갈 예약을 고른다.
        pastBookings: getPastTrips(myBookings.items),
        lastTranscripts: session.lastTranscripts,
      };
      if (text) update((s) => ({ messages: [...s.messages, { id: newMessageId(), role: "user", text }] }));

      try {
        const result = audio ? await sendVoiceCommandApi(audio, context) : await sendTextCommandApi(text, context);
        update((s) => ({
          messages: [
            ...s.messages,
            ...(audio ? [{ id: newMessageId(), role: "user", text: result.transcript, voice: true }] : []),
            {
              id: newMessageId(),
              role: "bot",
              text: result.reply,
              intent: result.intent,
              missingFields: result.missingFields,
            },
          ],
          draft: result.draft,
          confirmedFields: result.confirmedFields,
          lastTranscripts: [...s.lastTranscripts, result.transcript].slice(-3),
        }));
        return result;
      } catch (error) {
        const message =
          getErrorCode(error) === "NO_SPEECH"
            ? "잘 들리지 않았어요. 다시 말씀해 주세요."
            : getErrorMessage(error, "AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
        update((s) => ({ messages: [...s.messages, { id: newMessageId(), role: "bot", text: message, error: true }] }));
        return null;
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [session, myBookings.items, update],
  );

  const addMessage = useCallback(
    (message) => update((s) => ({ messages: [...s.messages, { id: newMessageId(), ...message }] })),
    [update],
  );

  const resetChat = useCallback(() => update(() => EMPTY_SESSION), [update]);

  // 예약 페이지에서 고친 값을 draft에 반영 (AI가 고른 투어와 같은 투어일 때만). 고객이 직접 고른 항목은 확인된 것으로 본다.
  const syncDraftFromForm = useCallback(
    (draft, touchedFields = []) =>
      update((s) => {
        if (!s.draft || s.draft.tourId !== draft.tourId) return {};
        return { draft, confirmedFields: [...new Set([...s.confirmedFields, ...touchedFields])] };
      }),
    [update],
  );

  const value = useMemo(
    () => ({
      messages: session.messages,
      draft: session.draft,
      confirmedFields: session.confirmedFields,
      sending,
      sendText: (text) => send({ text }),
      sendVoice: (audio) => send({ audio }),
      addMessage,
      resetChat,
      syncDraftFromForm,
      myBookings,
      reloadMyBookings,
    }),
    [session, sending, send, addMessage, resetChat, syncDraftFromForm, myBookings, reloadMyBookings],
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
};
