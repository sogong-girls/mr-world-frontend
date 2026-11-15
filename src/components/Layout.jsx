// src/components/Layout.jsx
// AI 버튼 말풍선 (로그인한 고객): 결제 안내(확정·결제 전) → 지난 여행(완료) 최근순 목록 + 다음 여행 질문 → 없으면 기본 문구
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { getToursApi } from "../api/tours";
import { useAuth } from "../context/useAuth";
import { useAiChat } from "../context/useAiChat";
import { describeTrip, getPastTrips, getUnpaidBookings, toursById } from "../utils/travelHistory";
import { formatDate } from "../utils/format";

const Layout = () => {
  const { user, role, logout } = useAuth();
  const { myBookings, resetChat } = useAiChat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [tourMap, setTourMap] = useState({});
  const [isWidgetPromptOpen, setIsWidgetPromptOpen] = useState(true);
  // 화면이 넓지 않으면 투어 카드를 가리지 않도록 한 줄 요약으로 시작하고, 누르면 펼친다
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(min-width: 1500px)").matches,
  );

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
  const unpaid = getUnpaidBookings(myBookings.items);
  const pastTrips = getPastTrips(myBookings.items).slice(0, 3).map((b) => describeTrip(b, tourMap));

  const handleLogout = async () => {
    resetChat();
    await logout();
    navigate("/login");
  };

  const handleAiClick = () => navigate("/ai-chat");

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
        <div className="ai-widget">
          {isCustomer && isWidgetPromptOpen && (
            <div className="ai-widget-prompt-wrap">
              <button
                type="button"
                className="ai-widget-close"
                onClick={() => setIsWidgetPromptOpen(false)}
                aria-label="AI 안내 말풍선 닫기"
                title="닫기"
              >
                ✕
              </button>

              <div className="ai-widget-prompt" style={{ cursor: "default" }}>
                <strong>AI 여행 안내</strong>
                {myBookings.status === "loading" && myBookings.items.length === 0 ? (
                  <span>여행 기록을 확인하고 있어요...</span>
                ) : !isWidgetExpanded ? (
                  <button
                    type="button"
                    className="ai-widget-summary"
                    onClick={() => setIsWidgetExpanded(true)}
                    aria-expanded="false"
                  >
                    {unpaid.length > 0
                      ? `결제할 확정 예약이 ${unpaid.length}건 있어요`
                      : pastTrips.length > 0
                        ? `지난 여행 ${pastTrips.length}건 · 다음 여행을 계획해 볼까요?`
                        : "여기서 음성으로 편하게 예약해 보세요"}
                    <span aria-hidden="true"> ▾</span>
                  </button>
                ) : (
                  <span className="ai-widget-trip-details">
                    {unpaid.length > 0 && (
                      <button
                        type="button"
                        className="ai-widget-history-cta"
                        style={{ border: 0, background: "#fbefed", color: "#99575b", borderRadius: "8px", padding: "6px 8px", textAlign: "left", cursor: "pointer" }}
                        onClick={() => navigate(`/payment?bookingId=${unpaid[0].id}`)}
                      >
                        확정된 예약({tourMap[String(unpaid[0].tourId)]?.name || "투어"}, {formatDate(unpaid[0].startAt)} 출발)이 있어요. 24시간 안에 결제해 주세요 →
                      </button>
                    )}
                    {pastTrips.length > 0 ? (
                      <>
                        <span className="ai-widget-history-greeting">{user?.name}님의 지난 여행</span>
                        {pastTrips.map((trip) => (
                          <span key={trip.id} style={{ display: "block" }}>
                            <span className="ai-widget-history-name">{trip.name}</span>
                            <br />
                            {trip.period} · {trip.style} · {trip.price}
                          </span>
                        ))}
                        <button type="button" className="ai-widget-history-cta" style={{ border: 0, background: "none", textAlign: "left", cursor: "pointer" }} onClick={handleAiClick}>
                          다음 여행은 어디로 가 볼까요? 음성으로 편하게 예약해 보세요 →
                        </button>
                      </>
                    ) : (
                      <button type="button" className="ai-widget-history-cta" style={{ border: 0, background: "none", textAlign: "left", cursor: "pointer" }} onClick={handleAiClick}>
                        여기서 음성으로 편하게 예약해 보세요 →
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          <button className="ai-widget-button" onClick={handleAiClick} aria-label="AI 여행 안내 열기">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <circle cx="8" cy="10" r="1" fill="currentColor"></circle>
              <circle cx="12" cy="10" r="1" fill="currentColor"></circle>
              <circle cx="16" cy="10" r="1" fill="currentColor"></circle>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
