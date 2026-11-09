// src/pages/AIChatBotPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi } from "../api/bookings";
import { getTourByIdApi } from "../api/tours";
import { useAuth } from "../context/AuthContext";
import { getLatestCompletedTrip, getTripDetails, needsTourDetails } from "../utils/travelHistory";

function Icon({ name, size = 20 }) {
  const paths = {
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const AIChatBotPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [travelHistory, setTravelHistory] = useState({ userKey: null, lastTrip: null });
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const speechRecognitionRef = useRef(null);

  const userName = user?.name || "고객";
  const userKey = user?.id || user?.loginId || userName;
  const SpeechRecognition = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const historyLoading = authLoading || (isAuthenticated && travelHistory.userKey !== userKey);
  const standardWelcome = isAuthenticated
    ? `안녕하세요 ${userName}님! 미스터 월드 AI 여행 플래너입니다. 누구와 떠나는 어떤 여행을 원하시나요?`
    : "안녕하세요! 미스터 월드 AI 여행 플래너입니다. 누구와 함께 떠나는지, 어떤 테마 여행을 찾으시는지 알려주세요.";
  const welcomeMessage = isAuthenticated && travelHistory.lastTrip
    ? `반갑습니다, ${userName}님! 지난번에 다녀오신 [${travelHistory.lastTrip?.tourName || travelHistory.lastTrip?.tour?.name || "지난 여행"}] 여행은 즐거우셨나요? 🌿 이번에도 취향에 맞는 새로운 여행지를 추천해 드릴까요?`
    : standardWelcome;
  const previousTripDetails = isAuthenticated && travelHistory.lastTrip
    ? getTripDetails(travelHistory.lastTrip)
    : null;
  const visibleMessages = messages.length > 0
    ? messages
    : [{ sender: "bot", text: welcomeMessage }];

  useEffect(() => () => {
    speechRecognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (authLoading || !isAuthenticated) return undefined;

    const fetchTravelHistory = async () => {
      try {
        const bookings = await getMyBookingsApi();
        let lastTrip = getLatestCompletedTrip(bookings);
        if (needsTourDetails(lastTrip)) {
          try {
            const tour = await getTourByIdApi(lastTrip.tourId);
            if (tour && isMounted) lastTrip = { ...lastTrip, tour };
          } catch (error) {
            console.warn("Tour details could not be loaded for travel history:", error);
          }
        }

        if (isMounted) setTravelHistory({ userKey, lastTrip: lastTrip || null });
      } catch (error) {
        console.warn("Travel history could not be loaded:", error);
        if (isMounted) setTravelHistory({ userKey, lastTrip: null });
      }
    };

    fetchTravelHistory();
    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, userKey]);

  const handleSend = (textToSend) => {
    if (historyLoading) return;
    const query = textToSend || input;
    if (!query.trim()) return;

    const baseMessages = messages.length > 0
      ? messages
      : [{ sender: "bot", text: welcomeMessage }];
    const newMessages = [...baseMessages, { sender: "user", text: query }];
    setMessages(newMessages);
    if (!textToSend) setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `[AI 추천]: '${query}'에 맞는 맞춤형 여행 패키지를 찾았습니다! '허니문 낭만 투어'나 '효도 힐링 투어'를 추천해 드려요. 예약 페이지로 이동하시겠어요?`
        }
      ]);
    }, 800);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    if (!SpeechRecognition) {
      setVoiceStatus("이 브라우저에서는 음성 입력을 지원하지 않습니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setVoiceStatus("음성을 인식해 전송했습니다.");
        handleSend(transcript);
      }
    };
    recognition.onerror = (event) => {
      setVoiceStatus(event.error === "not-allowed"
        ? "마이크 권한을 허용해 주세요."
        : event.error === "no-speech"
          ? "음성이 감지되지 않았어요. 다시 눌러 말씀해 주세요."
          : "음성 인식에 실패했습니다. 다시 시도해 주세요.");
      setIsListening(false);
      speechRecognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
    };

    try {
      speechRecognitionRef.current = recognition;
      setVoiceStatus("말씀해 주세요. 음성이 인식되면 자동으로 전송됩니다.");
      setIsListening(true);
      recognition.start();
    } catch (error) {
      speechRecognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus("마이크를 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      console.warn("Voice input could not be started:", error);
    }
  };

  return (
    <div className="ai-chat-page">
      <button onClick={() => navigate(-1)} className="button button-secondary ai-chat-back">
        ← 돌아가기
      </button>

      <div className="ai-chat-intro">
        <span className="ai-chat-eyebrow">YOUR TRAVEL, REIMAGINED</span>
        <h1>AI 여행 플래너</h1>
        <p>지난 여행을 돌아보고, 다음 여정을 함께 계획해 보세요.</p>
      </div>

      <div className="ai-chat-panel">
        {/* Header */}
        <div className="chat-head ai-chat-head">
          <span className="chat-avatar ai-chat-avatar"><Icon name="mic" size={19} /></span>
          <div className="ai-chat-head-copy">
            <strong>Mr. World AI</strong>
            <small>음성 및 텍스트 맞춤 안내 서비스</small>
          </div>
          <span className="ai-chat-status"><i /> 여행 상담 중</span>
        </div>

        {/* Messages Container */}
        <div className="chat-content ai-chat-content" aria-live="polite" aria-busy={historyLoading}>
          {historyLoading ? (
            <div className="ai-chat-loading"><span className="ai-chat-spinner" />여행 이력을 확인하고 있어요...</div>
          ) : visibleMessages.map((m, idx) => (
            <div
              key={idx}
              className={`ai-chat-message-row ${m.sender === "user" ? "is-user" : "is-bot"}`}
            >
              {m.sender === "bot" && <span className="ai-chat-message-avatar"><Icon name="mic" size={15} /></span>}
              <div
                className={`ai-chat-message ${m.sender === "bot" ? "is-bot" : "is-user"}`}
              >
                <p>{m.text}</p>
                {idx === 0 && m.sender === "bot" && previousTripDetails && (
                  <div className="previous-trip-card">
                    <strong className="previous-trip-title">지난 여행 기록</strong>
                    <div className="previous-trip-row">
                      <span>여행</span>
                      <strong>{previousTripDetails.name}</strong>
                    </div>
                    <div className="previous-trip-row">
                      <span>여행일</span>
                      <strong>{previousTripDetails.dates}</strong>
                    </div>
                    <div className="previous-trip-row">
                      <span>인원</span>
                      <strong>{previousTripDetails.travelers}</strong>
                    </div>
                    <div className="previous-trip-row">
                      <span>등급</span>
                      <strong>{previousTripDetails.style}</strong>
                    </div>
                    <div className="previous-trip-row previous-trip-options">
                      <span>선택 옵션</span>
                      <strong>{previousTripDetails.options.join(", ")}</strong>
                    </div>
                  </div>
                )}
                <time>{m.sender === "bot" ? "AI 플래너" : "나"}</time>
              </div>
            </div>
          ))}
        </div>

        {/* Prompt Suggestions */}
        <div className="ai-chat-suggestions">
          <div className="ai-chat-suggestions-heading">
            <strong>이렇게 물어보세요</strong>
            <span>추천 질문</span>
          </div>
          <div className="chat-prompts">
            <button disabled={historyLoading} onClick={() => handleSend("지난 여행과 비슷한 코스 추천해줘")}>
              지난 여행과 비슷한 코스 추천해줘 <span aria-hidden="true">↗</span>
            </button>
            <button disabled={historyLoading} onClick={() => handleSend("새로운 테마 여행 추천해줘")}>
              새로운 테마 여행 추천해줘 <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        {/* Input */}
        <form className="chat-input ai-chat-input" onSubmit={(event) => { event.preventDefault(); handleSend(); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="어떤 여행을 꿈꾸고 계신가요?"
            aria-label="여행 메시지"
            disabled={historyLoading}
          />
          <button
            type="button"
            className={`ai-chat-mic-button${isListening ? " is-listening" : ""}`}
            onClick={handleVoiceInput}
            disabled={historyLoading || !SpeechRecognition}
            aria-label={isListening ? "음성 인식 중지" : "마이크로 음성 입력"}
            title={SpeechRecognition ? "눌러서 말하기" : "이 브라우저에서는 음성 입력을 지원하지 않습니다."}
          >
            <Icon name="mic" size={19} />
          </button>
          <button type="submit" className="ai-chat-send-button" disabled={historyLoading || !input.trim()} aria-label="메시지 보내기"><Icon name="send" size={17} /></button>
        </form>
        <div className="ai-chat-footnote" aria-live="polite">
          {voiceStatus || "여행의 취향과 조건을 편하게 말씀해 주세요."}
        </div>
      </div>
    </div>
  );
};

export default AIChatBotPage;