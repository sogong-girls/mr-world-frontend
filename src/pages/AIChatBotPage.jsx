// src/pages/AIChatBotPage.jsx (UC-06 Voice Order: 음성 + 텍스트)
// - 글: POST /api/ai/text-commands {text, context}, 음성: POST /api/ai/voice-commands (multipart: audio, context)
// - context = {draft, confirmedFields, pastBookings, lastTranscripts}. 응답의 draft·confirmedFields로 통째로 바꾼다 (AiChatContext)
// - SUBMIT_BOOKING이고 남은 항목이 없으면 예약 페이지로 이동, CHECK_PRICE면 프론트가 금액 API로 금액을 보여 준다
// - 선택지 카드는 응답에 없어서 missingFields 앞 항목을 보고 투어 정보로 만든다. 누르면 그 글자를 다시 보낸다.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useAiChat } from "../context/useAiChat";
import { calculateTourPriceApi, getTourDetailApi, getToursApi } from "../api/tours";
import { AI_TEXT_MAX_LENGTH, AI_VOICE_MAX_BYTES, AI_VOICE_MAX_SECONDS } from "../api/ai";
import { getErrorMessage } from "../api/errors";
import {
  ADDON_LABELS,
  FOOD_TYPE_LABELS,
  FOOD_TYPE_RANK,
  GRAND_ONLY_THEMES,
  HOTEL_GRADE_LABELS,
  HOTEL_GRADE_RANK,
  STYLE_GRADE,
  STYLE_LABELS,
} from "../constants";
import { describeTrip, getPastTrips, getUnpaidBookings, toursById } from "../utils/travelHistory";
import { addDaysYmd, formatDate, formatWon, todayYmd, ymdToKorean } from "../utils/format";

function Icon({ name, size = 20 }) {
  const paths = {
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" /></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// AI가 다 확인받아야 하는 7개 항목 (CHECKLIST)
const DRAFT_ITEMS = [
  { field: "tourId", label: "투어" },
  { field: "participantsCount", label: "인원" },
  { field: "tourStyleId", label: "스타일" },
  { field: "hotelOptionId", label: "호텔" },
  { field: "foodOptionId", label: "식사" },
  { field: "bookingAddons", label: "추가 옵션" },
  { field: "startAt", label: "출발일" },
];
const PRICE_FIELDS = ["tourId", "participantsCount", "tourStyleId", "hotelOptionId", "foodOptionId"];
const DEFAULT_PROMPTS = ["어떤 투어가 있어요?", "지난번이랑 똑같이 예약해줘"];

// AI가 이번에 묻는 항목 (AI 서버 next_questions와 같은 규칙): 남은 항목 앞 2개, 스타일을 물을 땐 호텔·식사는 뒤로
const nextQuestions = (missing) => {
  const asked = missing.slice(0, 2);
  return asked.includes("tourStyleId")
    ? asked.filter((field) => field !== "hotelOptionId" && field !== "foodOptionId")
    : asked;
};

// 마지막 AI 답에 맞는 선택지 카드. {label, text}는 누르면 text를 보내고, {label, action}은 화면 동작.
const buildChoices = (message, draft, tours, tour) => {
  const result = { cards: [], askDate: false };
  if (!message || message.role !== "bot" || message.error || !message.intent) return result;
  const add = (label, text = label) => {
    if (!result.cards.some((card) => card.text === text && !card.action)) result.cards.push({ label, text });
  };
  const { intent, missingFields = [] } = message;

  if (intent === "SEARCH_TOUR") {
    tours.forEach((t) => add(t.name));
    return result;
  }
  if (intent === "VIEW_HISTORY") {
    add("지난번이랑 똑같이 예약해줘");
    return result;
  }
  if (missingFields.length === 0) {
    if (intent === "SUBMIT_BOOKING" && draft?.tourId) {
      result.cards.push({ label: "예약 페이지 열기", action: "openBooking" });
    } else {
      add("네, 예약할게요");
      if (intent !== "CHECK_PRICE") add("금액이 얼마예요?");
    }
    return result;
  }

  const asked =
    intent === "CHECK_PRICE"
      ? nextQuestions(PRICE_FIELDS.filter((field) => draft?.[field] == null))
      : nextQuestions(missingFields);
  const recommendsBoth =
    asked.length === 2 && asked[0] === "hotelOptionId" && asked[1] === "foodOptionId" && draft?.hotelOptionId && draft?.foodOptionId;
  if (recommendsBoth) add("네, 추천대로 할게요", "네");

  for (const field of asked) {
    if (field === "tourId") {
      tours.forEach((t) => add(t.name));
    } else if (field === "participantsCount") {
      [1, 2, 3, 4, 6].forEach((n) => add(`${n}명`));
    } else if (field === "tourStyleId") {
      const styles = tour
        ? [...tour.styles]
            .filter((s) => !(GRAND_ONLY_THEMES.includes(tour.tourTheme) && s.type === "CLASSIC"))
            .sort((a, b) => STYLE_GRADE[a.type] - STYLE_GRADE[b.type])
            .map((s) => s.type)
        : ["CLASSIC", "GRAND", "PREMIUM"];
      styles.forEach((type) => add(STYLE_LABELS[type]));
    } else if (field === "hotelOptionId") {
      if (!recommendsBoth && draft?.hotelOptionId) add("네, 그 호텔로", "네");
      [...(tour?.hotelOptions || [])]
        .sort((a, b) => HOTEL_GRADE_RANK[a.grade] - HOTEL_GRADE_RANK[b.grade])
        .forEach((h) => add(`${HOTEL_GRADE_LABELS[h.grade]} 호텔`));
    } else if (field === "foodOptionId") {
      if (!recommendsBoth && draft?.foodOptionId) add("네, 그 식사로", "네");
      [...(tour?.foodOptions || [])]
        .sort((a, b) => FOOD_TYPE_RANK[a.type] - FOOD_TYPE_RANK[b.type])
        .forEach((f) => add(FOOD_TYPE_LABELS[f.type]));
    } else if (field === "bookingAddons") {
      // addon은 예/아니요 먼저, "예"면 AI가 몇째 날 어느 끼니인지 묻는다
      if (message.text.includes("몇째 날")) {
        add("1일차 저녁에 샴페인");
        add("매일 아침에 커피");
        add("추가 안 할게요", "아니요");
      } else {
        add("네, 추가할래요", "네");
        add("아니요");
      }
    } else if (field === "startAt") {
      result.askDate = true;
    }
  }

  // 스타일까지 정했으면 남은 호텔·식사·추가 옵션을 한 번에 기본값으로 확인
  const restFields = ["hotelOptionId", "foodOptionId", "bookingAddons"];
  if (intent !== "CHECK_PRICE" && draft?.tourStyleId && missingFields.some((field) => restFields.includes(field))) {
    add("나머지는 기본으로");
  }
  return result;
};

const describeDraftValue = (field, draft, tourName, tour) => {
  if (!draft) return "";
  if (field === "tourId") return tourName || (draft.tourId ? `투어 #${draft.tourId}` : "");
  if (field === "participantsCount") return draft.participantsCount ? `${draft.participantsCount}명` : "";
  if (field === "tourStyleId") {
    const style = tour?.styles.find((s) => s.id === draft.tourStyleId);
    return style ? STYLE_LABELS[style.type] : "";
  }
  if (field === "hotelOptionId") return tour?.hotelOptions.find((h) => h.id === draft.hotelOptionId)?.name || "";
  if (field === "foodOptionId") return tour?.foodOptions.find((f) => f.id === draft.foodOptionId)?.name || "";
  if (field === "bookingAddons") {
    const addons = draft.bookingAddons || [];
    if (addons.length === 0) return "없음";
    return (tour?.addonOptions || [])
      .map((option) => {
        const count = addons.filter((a) => a.addonOptionId === option.id).length;
        return count ? `${ADDON_LABELS[option.type]} ${count}번` : "";
      })
      .filter(Boolean)
      .join(", ") || `${addons.length}번`;
  }
  if (field === "startAt") return draft.startAt ? formatDate(draft.startAt) : "";
  return "";
};

const AIChatBotPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { messages, draft, confirmedFields, sending, sendText, sendVoice, addMessage, resetChat, myBookings } = useAiChat();

  const [tours, setTours] = useState([]);
  const [draftTour, setDraftTour] = useState({ id: null, tour: null });
  const [input, setInput] = useState("");
  const [dateChoice, setDateChoice] = useState(() => addDaysYmd(todayYmd(), 14));
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const listRef = useRef(null);
  const voiceRef = useRef({ recorder: null, timer: null, cancelled: false });
  const navigateTimerRef = useRef(null);

  const canRecord =
    typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.MediaRecorder !== "undefined";
  const isCustomer = role === "USER";
  const historyLoading = authLoading || (isCustomer && myBookings.status === "loading" && myBookings.items.length === 0);
  const busy = sending || historyLoading;

  // 투어 목록 (선택지 카드, 이름 표시)
  useEffect(() => {
    let active = true;
    getToursApi()
      .then((list) => {
        if (active) setTours(list || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // draft의 투어 상세 (스타일·호텔·식사 카드, 예약 정보 표시)
  const draftTourId = draft?.tourId ?? null;
  useEffect(() => {
    if (!draftTourId) return undefined;
    let active = true;
    getTourDetailApi(draftTourId)
      .then((tour) => {
        if (active) setDraftTour({ id: draftTourId, tour });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [draftTourId]);
  const tour = draftTour.id === draftTourId ? draftTour.tour : null;

  // 새 메시지가 오면 아래로 스크롤
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, sending]);

  // 페이지를 떠나면 녹음·예약 페이지 이동 예약을 멈춘다
  useEffect(() => {
    const voice = voiceRef.current;
    return () => {
      voice.cancelled = true;
      clearTimeout(voice.timer);
      if (voice.recorder?.state === "recording") voice.recorder.stop();
      clearTimeout(navigateTimerRef.current);
    };
  }, []);

  const tourMap = useMemo(() => toursById(tours), [tours]);
  const unpaid = getUnpaidBookings(myBookings.items);
  const pastTrips = getPastTrips(myBookings.items).slice(0, 3).map((b) => describeTrip(b, tourMap));
  // 금액 메시지는 프론트가 덧붙인 것이라, 선택지는 그 앞의 AI 답으로 만든다
  const lastMessage = messages[messages.length - 1];
  const choiceSource = lastMessage?.kind === "price" ? messages[messages.length - 2] : lastMessage;
  const choices = sending ? { cards: [], askDate: false } : buildChoices(choiceSource, draft, tours, tour);
  const prompts = pastTrips.length > 0 ? DEFAULT_PROMPTS : DEFAULT_PROMPTS.slice(0, 1);
  const hasDraft = DRAFT_ITEMS.some(({ field }) => (field === "bookingAddons" ? confirmedFields.includes(field) : draft?.[field] != null));

  // 응답에 따른 화면 동작
  const handleResult = async (result) => {
    if (!result) return;
    const next = result.draft;
    if (result.intent === "SUBMIT_BOOKING" && result.missingFields.length === 0 && next?.tourId) {
      clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = setTimeout(() => navigate(`/booking?tourId=${next.tourId}`), 1200);
      return;
    }
    if (result.intent === "CHECK_PRICE" && PRICE_FIELDS.every((field) => next?.[field] != null)) {
      try {
        const price = await calculateTourPriceApi(next.tourId, {
          tourStyleId: next.tourStyleId,
          hotelOptionId: next.hotelOptionId,
          foodOptionId: next.foodOptionId,
          participantsCount: next.participantsCount,
          addonOptions: next.bookingAddons || [],
        });
        addMessage({ role: "bot", kind: "price", price, text: "선택하신 조건의 금액이에요." });
      } catch (error) {
        addMessage({ role: "bot", error: true, text: getErrorMessage(error, "금액을 계산하지 못했어요.") });
      }
    }
  };

  const handleSend = async (raw) => {
    const text = (raw ?? input).trim().slice(0, AI_TEXT_MAX_LENGTH);
    if (!text || busy) return;
    if (raw == null) setInput("");
    setVoiceStatus("");
    handleResult(await sendText(text));
  };

  const handleChoice = (card) => {
    if (card.action === "openBooking") {
      navigate(`/booking?tourId=${draft.tourId}`);
      return;
    }
    handleSend(card.text);
  };

  const handleReset = () => {
    if (messages.length > 0 && !window.confirm("대화와 고른 내용을 지우고 처음부터 시작할까요?")) return;
    clearTimeout(navigateTimerRef.current);
    resetChat();
    setVoiceStatus("");
  };

  // ----- 음성: MediaRecorder로 녹음해 AI 서버로 보낸다 (최대 15초, 5MB) -----
  const startRecording = async () => {
    const voice = voiceRef.current;
    setVoiceStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      voice.cancelled = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        clearTimeout(voice.timer);
        stream.getTracks().forEach((track) => track.stop());
        voice.recorder = null;
        if (voice.cancelled) return;
        setRecording(false);
        const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (audio.size === 0) {
          setVoiceStatus("녹음된 소리가 없어요. 마이크를 눌러 다시 말씀해 주세요.");
          return;
        }
        if (audio.size > AI_VOICE_MAX_BYTES) {
          setVoiceStatus("음성이 너무 커요. 짧게 나눠서 말씀해 주세요.");
          return;
        }
        setVoiceStatus("말씀을 알아듣고 있어요...");
        const result = await sendVoice(audio);
        setVoiceStatus("");
        handleResult(result);
      };
      voice.recorder = recorder;
      recorder.start();
      setRecording(true);
      setVoiceStatus(`듣고 있어요. 말씀이 끝나면 마이크를 다시 눌러 주세요. (최대 ${AI_VOICE_MAX_SECONDS}초)`);
      voice.timer = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, AI_VOICE_MAX_SECONDS * 1000);
    } catch (error) {
      setRecording(false);
      setVoiceStatus(
        error?.name === "NotAllowedError"
          ? "마이크 권한을 허용해 주세요."
          : "마이크를 쓸 수 없어요. 글로 입력해 주세요.",
      );
    }
  };

  const handleMic = () => {
    const recorder = voiceRef.current.recorder;
    if (recorder?.state === "recording") recorder.stop();
    else startRecording();
  };

  // ----- 첫 인사: 결제 안내 → 지난 여행 → 기본 문구 -----
  const welcome = (
    <div className="ai-chat-message-row is-bot">
      <span className="ai-chat-message-avatar"><Icon name="mic" size={15} /></span>
      <div className="ai-chat-message is-bot">
        {unpaid.length > 0 && (
          <div className="ai-chat-pay-notice">
            <span>
              확정된 예약이 있어요: [{tourMap[String(unpaid[0].tourId)]?.name || "투어"}] {formatDate(unpaid[0].startAt)} 출발. 24시간 안에 결제해 주세요.
            </span>
            <button type="button" onClick={() => navigate(`/payment?bookingId=${unpaid[0].id}`)}>결제하기</button>
          </div>
        )}
        {pastTrips.length > 0 ? (
          <>
            <p>{user?.name}님, 다시 만나서 반가워요! 지난 여행이에요.</p>
            <div className="previous-trip-card">
              <strong className="previous-trip-title">지난 여행 (최근순)</strong>
              {pastTrips.map((trip) => (
                <div className="previous-trip-row" key={trip.id}>
                  <span>{trip.name}</span>
                  <strong>{trip.period} · {trip.style} · {trip.price}</strong>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "10px" }}>다음 여행은 어디로 가 볼까요? 말하거나 입력해 주세요.</p>
          </>
        ) : (
          <p>
            {user ? `안녕하세요 ${user.name}님! ` : "안녕하세요! "}
            여기서 음성으로 편하게 예약해 보세요. 투어, 인원, 스타일, 호텔, 식사, 추가 옵션, 출발일을 차례로 여쭤볼게요.
          </p>
        )}
        <time>AI 플래너</time>
      </div>
    </div>
  );

  return (
    <div className="ai-chat-page">
      <button onClick={() => navigate(-1)} className="button button-secondary ai-chat-back">
        ← 돌아가기
      </button>

      <div className="ai-chat-intro">
        <h1>AI 여행 플래너</h1>
        <p>말하거나 입력하면 예약 내용을 채워 드려요. 다 정해지면 예약 페이지에서 확인하고 [예약하기]를 눌러 주세요.</p>
      </div>

      <div className="ai-chat-panel">
        <div className="chat-head ai-chat-head">
          <span className="chat-avatar ai-chat-avatar"><Icon name="mic" size={19} /></span>
          <div className="ai-chat-head-copy">
            <strong>Mr. World AI</strong>
            <small>음성 및 텍스트 예약 안내</small>
          </div>
          <button type="button" className="ai-chat-reset" onClick={handleReset} disabled={sending}>
            처음부터
          </button>
        </div>

        {hasDraft && (
          <div className="ai-chat-draft" aria-label="지금까지 고른 예약 내용">
            {DRAFT_ITEMS.map(({ field, label }) => {
              const confirmed = confirmedFields.includes(field);
              const value =
                field === "bookingAddons" && !confirmed && !draft?.bookingAddons?.length
                  ? ""
                  : describeDraftValue(field, draft, tourMap[String(draft?.tourId)]?.name, tour);
              return (
                <span key={field} className={`ai-chat-draft-item${confirmed ? " is-confirmed" : ""}`}>
                  <b>{label}</b>
                  {value || "—"}
                  {confirmed && <i aria-label="확인됨">✓</i>}
                </span>
              );
            })}
          </div>
        )}

        <div ref={listRef} className="chat-content ai-chat-content" aria-live="polite" aria-busy={busy}>
          {historyLoading ? (
            <div className="ai-chat-loading"><span className="ai-chat-spinner" />여행 이력을 확인하고 있어요...</div>
          ) : (
            <>
              {welcome}
              {messages.map((m) => (
                <div key={m.id} className={`ai-chat-message-row ${m.role === "user" ? "is-user" : "is-bot"}`}>
                  {m.role === "bot" && <span className="ai-chat-message-avatar"><Icon name="mic" size={15} /></span>}
                  <div className={`ai-chat-message ${m.role === "bot" ? "is-bot" : "is-user"}${m.error ? " is-error" : ""}`}>
                    <p>{m.text}</p>
                    {m.kind === "price" && m.price && (
                      <div className="ai-chat-price">
                        <div>
                          <span>정가</span>
                          <span className={m.price.discountPrice > 0 ? "is-struck" : ""}>{formatWon(m.price.totalPrice)}</span>
                        </div>
                        {m.price.discountPrice > 0 && (
                          <div className="is-discount">
                            <span>단골 할인</span>
                            <span>-{formatWon(m.price.discountPrice)}</span>
                          </div>
                        )}
                        <div className="is-final">
                          <span>최종 금액</span>
                          <span>{formatWon(m.price.finalPrice)}</span>
                        </div>
                      </div>
                    )}
                    <time>{m.role === "bot" ? "AI 플래너" : m.voice ? "나 (음성)" : "나"}</time>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="ai-chat-message-row is-bot">
                  <span className="ai-chat-message-avatar"><Icon name="mic" size={15} /></span>
                  <div className="ai-chat-message is-bot ai-chat-typing">
                    <span className="ai-chat-spinner" /> 답을 준비하고 있어요...
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="ai-chat-suggestions">
          <div className="ai-chat-suggestions-heading">
            <strong>{choices.cards.length > 0 || choices.askDate ? "이렇게 답할 수 있어요" : "이렇게 물어보세요"}</strong>
            <span>{choices.cards.length > 0 || choices.askDate ? "선택지" : "추천 질문"}</span>
          </div>
          <div className="chat-prompts">
            {choices.cards.length > 0 || choices.askDate ? (
              <>
                {choices.cards.map((card) => (
                  <button key={card.action || card.label} type="button" disabled={busy} onClick={() => handleChoice(card)}>
                    {card.label}
                  </button>
                ))}
                {choices.askDate && (
                  <span className="ai-chat-date-choice">
                    <input
                      type="date"
                      value={dateChoice}
                      min={todayYmd()}
                      onChange={(e) => setDateChoice(e.target.value)}
                      aria-label="출발 날짜"
                    />
                    <button
                      type="button"
                      disabled={busy || !dateChoice || dateChoice < todayYmd()}
                      onClick={() => handleSend(`${ymdToKorean(dateChoice)} 출발`)}
                    >
                      이 날짜로 출발
                    </button>
                  </span>
                )}
              </>
            ) : (
              prompts.map((prompt) => (
                <button key={prompt} type="button" disabled={busy} onClick={() => handleSend(prompt)}>
                  {prompt} <span aria-hidden="true">↗</span>
                </button>
              ))
            )}
          </div>
        </div>

        <form className="chat-input ai-chat-input" onSubmit={(event) => { event.preventDefault(); handleSend(); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={recording ? "듣고 있어요..." : "예: 효도 투어 4명, 12월 3일 출발"}
            aria-label="여행 메시지"
            maxLength={AI_TEXT_MAX_LENGTH}
            disabled={historyLoading || recording}
          />
          <button
            type="button"
            className={`ai-chat-mic-button${recording ? " is-listening" : ""}`}
            onClick={handleMic}
            disabled={(busy && !recording) || !canRecord}
            aria-label={recording ? "녹음 끝내고 보내기" : "마이크로 말하기"}
            title={canRecord ? "눌러서 말하기" : "이 브라우저에서는 녹음을 쓸 수 없어요."}
          >
            <Icon name={recording ? "stop" : "mic"} size={19} />
          </button>
          <button type="submit" className="ai-chat-send-button" disabled={busy || recording || !input.trim()} aria-label="메시지 보내기">
            <Icon name="send" size={17} />
          </button>
        </form>
        <div className="ai-chat-footnote" aria-live="polite">
          {voiceStatus ||
            (input.length > AI_TEXT_MAX_LENGTH - 100
              ? `${input.length} / ${AI_TEXT_MAX_LENGTH}자`
              : "음성은 한 번에 15초까지 말할 수 있어요. 예약된 건의 변경·취소는 AI로 하지 않아요.")}
        </div>
      </div>
    </div>
  );
};

export default AIChatBotPage;
