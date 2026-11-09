import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { getMyBookingsApi } from "../api/bookings";
import { getTourByIdApi } from "../api/tours";
import { useAuth } from "../context/AuthContext";
import { getLatestCompletedTrip, getTripDetails, needsTourDetails } from "../utils/travelHistory";

const Layout = () => {
  const { user, role, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [travelHistory, setTravelHistory] = useState({ userKey: null, status: "idle", lastTrip: null });
  const userKey = user?.id || user?.loginId || user?.name;
  const showTravelHistory = isAuthenticated && role !== "ADMIN";
  const historyLoading = showTravelHistory && (authLoading || travelHistory.userKey !== userKey);
  const previousTripDetails = showTravelHistory
    && travelHistory.userKey === userKey
    && travelHistory.lastTrip
    ? getTripDetails(travelHistory.lastTrip)
    : null;

  useEffect(() => {
    let isMounted = true;

    if (authLoading || !showTravelHistory || !userKey) return undefined;

    const fetchTravelHistory = async () => {
      try {
        const bookings = await getMyBookingsApi();
        let lastTrip = getLatestCompletedTrip(bookings);

        if (needsTourDetails(lastTrip)) {
          try {
            const tour = await getTourByIdApi(lastTrip.tourId);
            if (tour && isMounted) lastTrip = { ...lastTrip, tour };
          } catch (error) {
            console.warn("Tour details could not be loaded for the AI widget:", error);
          }
        }

        if (isMounted) setTravelHistory({ userKey, status: "ready", lastTrip });
      } catch (error) {
        console.warn("Travel history could not be loaded for the AI widget:", error);
        if (isMounted) setTravelHistory({ userKey, status: "error", lastTrip: null });
      }
    };

    fetchTravelHistory();
    return () => {
      isMounted = false;
    };
  }, [authLoading, showTravelHistory, userKey]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAiClick = () => {
    navigate("/ai-chat");
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

      <div className="layout-content flex-1 min-w-0 bg-[#fafaf7]">
        <Outlet />
      </div>

      {role !== "ADMIN" && pathname !== "/ai-chat" && (
        <div className="ai-widget">
          <button type="button" className="ai-widget-prompt" onClick={handleAiClick}>
            <strong>AI 여행 안내</strong>
            {showTravelHistory ? (
              historyLoading ? (
                <span>지난 여행 기록을 확인하고 있어요...</span>
              ) : previousTripDetails ? (
                <span className="ai-widget-trip-details">
                  <span className="ai-widget-history-greeting">{user?.name || "고객"}님, 지난 여행 이력이 있어요</span>
                  <span className="ai-widget-history-name">{previousTripDetails.name}</span>
                  <span><b>일정</b>{previousTripDetails.dates}</span>
                  <span><b>인원</b>{previousTripDetails.travelers}</span>
                  <span><b>등급</b>{previousTripDetails.style}</span>
                  <span><b>옵션</b>{previousTripDetails.options.join(", ")}</span>
                  <span className="ai-widget-history-cta">눌러서 여행 플래너와 이야기하기</span>
                </span>
              ) : travelHistory.status === "error" ? (
                <span>여행 기록을 불러오지 못했어요. 눌러서 AI 플래너와 이야기해 보세요.</span>
              ) : (
                <span>{user?.name || "고객"}님, 어떤 여행을 계획해 볼까요?</span>
              )
            ) : (
              "클릭해서 대화를 시작하세요!"
            )}
          </button>

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