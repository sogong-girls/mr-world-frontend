// src/components/Layout.jsx
// AI 버튼 말풍선: 카드 모양은 front ef19f22(인사 → 투어명 → 일정·인원·등급·옵션 → "눌러서 여행 플래너와 이야기하기"),
// 내용은 요구사항대로 — 확정·결제 전 예약이 있으면 결제 안내를 맨 위에, 지난 여행(완료)은 최근순 목록(상품·기간·등급·가격).
// 가장 최근 여행은 카드로 자세히(옵션은 GET /api/bookings/{id} 상세), 그 전 여행은 아래에 한 줄씩.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { getToursApi } from "../api/tours";
import { getBookingDetailApi } from "../api/bookings";
import { useAuth } from "../context/useAuth";
import { useAiChat } from "../context/useAiChat";
import { ADDON_LABELS, MEALS, MEAL_LABELS } from "../constants";
import { describeTrip, getPastTrips, getUnpaidBookings, toursById } from "../utils/travelHistory";
import { formatDate } from "../utils/format";

const MAX_PAST_TRIPS = 3;

// 예약 상세 → "5성급 파리 호텔, 스테이크 레스토랑, 2일차 저녁 커피"
const describeOptions = (detail) => {
  if (!detail) return null;
  const addons = [...(detail.bookingAddons || [])]
    .sort((a, b) => a.nthDay - b.nthDay || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal))
    .map((a) => `${a.nthDay}일차 ${MEAL_LABELS[a.meal] || a.meal} ${ADDON_LABELS[a.addonOption?.type] || ""}`.trim());
  return [detail.hotelOption?.name, detail.foodOption?.name, ...addons].filter(Boolean).join(", ") || "기본 옵션";
};

const plainButton = { border: 0, background: "none", padding: 0, font: "inherit", textAlign: "left", cursor: "pointer" };

const Layout = () => {
  const { user, role, logout } = useAuth();
  const { myBookings, resetChat } = useAiChat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [tourMap, setTourMap] = useState({});
  const [isWidgetPromptOpen, setIsWidgetPromptOpen] = useState(true);
  const [latestDetail, setLatestDetail] = useState({ id: null, detail: null });

  useEffect(() => {
    let active = true;
    getToursApi()
      .then((tours) => {
        if (active) setTourMap(toursById(tours));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const isCustomer = role === "USER";
  const unpaid = isCustomer ? getUnpaidBookings(myBookings.items) : [];
  const pastBookings = isCustomer ? getPastTrips(myBookings.items).slice(0, MAX_PAST_TRIPS) : [];
  const pastTrips = pastBookings.map((b) => describeTrip(b, tourMap));
  const latestId = pastBookings[0]?.id ?? null;

  // 가장 최근 여행의 호텔·식사·추가 옵션 (목록 응답에는 없어서 상세를 받는다)
  useEffect(() => {
    if (latestId == null) return undefined;
    let active = true;
    getBookingDetailApi(latestId)
      .then((detail) => {
        if (active) setLatestDetail({ id: latestId, detail });
      })
      .catch(() => {
        if (active) setLatestDetail({ id: latestId, detail: null });
      });
    return () => {
      active = false;
    };
  }, [latestId]);

  const latestOptions =
    latestDetail.id === latestId ? describeOptions(latestDetail.detail) || "예약 상세에서 확인해 주세요" : "불러오는 중...";

  const handleLogout = async () => {
    resetChat();
    await logout();
    navigate("/login");
  };

  const handleAiClick = () => navigate("/ai-chat");

  const renderPromptBody = () => {
    if (!isCustomer) return <span>클릭해서 대화를 시작하세요!</span>;
    if (myBookings.status === "loading" && myBookings.items.length === 0) {
      return <span>지난 여행 기록을 확인하고 있어요...</span>;
    }
    if (myBookings.status === "error") {
      return <span>여행 기록을 불러오지 못했어요. 눌러서 AI 플래너와 이야기해 보세요.</span>;
    }
    if (pastTrips.length === 0) {
      return (
        <span className="ai-widget-trip-details">
          <span className="ai-widget-history-greeting">{user?.name}님, 어떤 여행을 계획해 볼까요?</span>
          <span className="ai-widget-history-cta">여기서 음성으로 편하게 예약해 보세요</span>
        </span>
      );
    }

    const [latest, ...older] = pastTrips;
    return (
      <span className="ai-widget-trip-details">
        <span className="ai-widget-history-greeting">{user?.name}님, 지난 여행 이력이 있어요</span>
        <span className="ai-widget-history-name">{latest.name}</span>
        <span><b>일정</b>{latest.period}</span>
        <span><b>인원</b>{latest.people || "-"}</span>
        <span><b>등급</b>{latest.style}</span>
        <span><b>가격</b>{latest.price}</span>
        <span><b>옵션</b>{latestOptions}</span>
        {older.length > 0 && (
          // 버튼 안이라 div 대신 span. 직계 span은 CSS가 "칸 이름 | 값" 두 칸으로 만들어서 한 칸으로 되돌린다.
          <span style={{ marginTop: "4px", paddingTop: "6px", borderTop: "1px solid #e6e7e1", display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
            <b style={{ color: "#202522" }}>그 전 여행</b>
            {older.map((trip) => (
              <span key={trip.id} style={{ display: "block" }}>
                <span style={{ color: "#202522", fontWeight: 600 }}>{trip.name}</span>
                <br />
                {trip.period} · {trip.style} · {trip.price}
              </span>
            ))}
          </span>
        )}
        <span className="ai-widget-history-cta">다음 여행은 어디로 갈까요? 눌러서 여행 플래너와 이야기하기</span>
      </span>
    );
  };

  return (
    <div className="app min-h-screen flex flex-col">
      <header className="site-header">
        <div className="header-inner">
          <Link className="header-brand" to={role === "ADMIN" ? "/admin/tours" : "/"}>
            Mr. World (미스터 월드)
          </Link>
          <nav className="header-nav" aria-label="주요 메뉴">
            {role === "ADMIN" ? (
              <>
                <Link to="/">테마 투어</Link>
                <Link to="/admin/tours">투어 관리</Link>
                <Link to="/admin/bookings">예약 현황</Link>
                <Link to="/admin/inventory">창고 재고</Link>
              </>
            ) : (
              <>
                <Link to="/">테마 투어</Link>
                <Link to="/past-tours">내 여행 (이력)</Link>
              </>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span className="header-user">
                  {user.name} ({role === "ADMIN" ? "직원" : "고객"})
                </span>
                <button className="button button-logout" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <Link className="button button-secondary" to="/login">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="layout-content flex-1 min-w-0 bg-[#fafaf7]" style={{ paddingBottom: "96px" }}>
        <Outlet />
      </div>

      {role !== "ADMIN" && pathname !== "/ai-chat" && (
        <div className="ai-widget" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {isWidgetPromptOpen && (
            <div
              className="ai-widget-prompt-wrap"
              style={{ width: "340px", maxWidth: "calc(100vw - 32px)", position: "relative" }}
            >
              <button
                type="button"
                className="ai-widget-close"
                onClick={() => setIsWidgetPromptOpen(false)}
                aria-label="AI 안내 팝업 닫기"
                title="닫기"
              >
                ✕
              </button>

              {unpaid.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate(`/payment?bookingId=${unpaid[0].id}`)}
                  style={{
                    ...plainButton,
                    width: "100%",
                    marginBottom: "6px",
                    padding: "9px 32px 9px 13px",
                    border: "1px solid #f0d6d3",
                    borderRadius: "13px",
                    background: "#fbefed",
                    color: "#99575b",
                    fontSize: "12px",
                    fontWeight: 700,
                    boxShadow: "0 8px 24px rgba(24, 35, 29, 0.10)",
                  }}
                >
                  확정된 예약({tourMap[String(unpaid[0].tourId)]?.name || "투어"}, {formatDate(unpaid[0].startAt)} 출발)이 있어요.
                  24시간 안에 결제해 주세요 →
                </button>
              )}

              <button
                type="button"
                className="ai-widget-prompt"
                onClick={handleAiClick}
                style={{ width: "100%", maxWidth: "none", padding: "24px 24px", borderRadius: "18px" }}
              >
                <strong>AI 여행 안내</strong>
                {renderPromptBody()}
              </button>
            </div>
          )}

          <button className="ai-widget-button" onClick={handleAiClick} aria-label="AI 여행 안내 열기">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4.5" />
              <circle cx="12" cy="3.5" r="1" fill="currentColor" />
              <rect width="18" height="13" x="3" y="8" rx="4.5" />
              <path d="M1.5 14.5H3" />
              <path d="M21 14.5h1.5" />
              <circle cx="8.5" cy="13.5" r="1.3" fill="currentColor" />
              <circle cx="15.5" cy="13.5" r="1.3" fill="currentColor" />
              <path d="M9 17c.9.8 1.9 1.1 3 1.1s2.1-.3 3-1.1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
