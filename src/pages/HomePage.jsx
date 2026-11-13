import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToursApi } from "../api/tours";
import { getMyBookingsApi } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import LoadingIndicator from "../components/LoadingIndicator";

const THEME_IMAGES = {
  HONEYMOON: "https://images.unsplash.com/photo-1611441085268-7674a97a0905?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=600",
  PARENT: "https://images.unsplash.com/photo-1679054142703-6e6d2fa5934f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=600",
  GOLF: "https://images.unsplash.com/photo-1728037853328-cd6801e15439?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=600",
  TREKKING: "https://images.unsplash.com/photo-1603279312618-5009a6caf08b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=600",
};

const THEME_LABELS = {
  HONEYMOON: "허니문",
  PARENT: "효도",
  GOLF: "골프",
  TREKKING: "트레킹",
};

const THEME_CLASSES = {
  HONEYMOON: "honeymoon",
  PARENT: "healing",
  GOLF: "golf",
  TREKKING: "trekking",
};

const HomePage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;

  const [tours, setTours] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [unpaidBooking, setUnpaidBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const tourData = await getToursApi();
        if (isMounted) setTours(tourData || []);

        if (isAuthenticated) {
          const myBookings = await getMyBookingsApi();
          const pendingPayment = (myBookings || []).find((b) => b.status === "CONFIRMED");
          if (isMounted) setUnpaidBooking(pendingPayment || null);
        }
      } catch (err) {
        console.error("Data load failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const filteredTours = activeTab === "ALL" 
    ? tours 
    : tours.filter((t) => (t.tourTheme || t.theme) === activeTab);

  return (
    <main className="home-page min-h-full bg-[#fafaf7] text-[#202522]">
      {unpaidBooking && (
        <div className="payment-notice">
          <span>
            [{unpaidBooking.tourName || "신청한 투어"}] 예약이 승인되었습니다! 24시간 이내에 결제를 완료해 주세요.
          </span>
          <button type="button" onClick={() => navigate("/payment")} className="button">
            결제하기
          </button>
        </div>
      )}

      <section className="hero shell relative mx-auto w-[min(1180px,calc(100%-48px))] py-[82px] text-center max-[680px]:w-[calc(100%-28px)] max-[680px]:pt-[54px] max-[680px]:pb-[48px]">
        <div className="hero-title" role="heading" aria-level={1}>
          특별한 날, 가장 멋있는 장소에서 사랑하는 사람에게  <br /> 잊지 못할 여행의 감동을 선물하세요.
        </div>
      </section>

      <section className="themes-section shell mx-auto w-[min(1180px,calc(100%-48px))] max-[680px]:w-[calc(100%-28px)]">
        <div className="section-heading">
          <div>
            <div className="section-title" role="heading" aria-level={2}>
              취향에 맞춰 엄선한 여행 패키지
            </div>
            <p>엄선된 숙소와 세심한 혜택, 출발 일정을 한눈에 비교해 보세요.</p>
          </div>
        </div>

        <div className="package-tabs" aria-label="여행 테마">
          <button className={activeTab === "ALL" ? "active" : ""} onClick={() => setActiveTab("ALL")}>전체</button>
          <button className={activeTab === "HONEYMOON" ? "active" : ""} onClick={() => setActiveTab("HONEYMOON")}>허니문</button>
          <button className={activeTab === "PARENT" ? "active" : ""} onClick={() => setActiveTab("PARENT")}>효도</button>
          <button className={activeTab === "GOLF" ? "active" : ""} onClick={() => setActiveTab("GOLF")}>골프</button>
          <button className={activeTab === "TREKKING" ? "active" : ""} onClick={() => setActiveTab("TREKKING")}>트레킹</button>
        </div>

        {loading ? (
          <LoadingIndicator text="테마 투어 목록을 불러오는 중" />
        ) : filteredTours.length === 0 ? (
          <div className="tour-list-message">해당 테마의 등록된 투어 상품이 없습니다.</div>
        ) : (
          <div className="package-rail">
            {filteredTours.map((item) => {
              const themeKey = item.tourTheme || item.theme || "HONEYMOON";
              const themeClass = THEME_CLASSES[themeKey] || themeKey.toLowerCase();
              const price = item.styles?.[0]?.basePrice ?? item.basePrice;
              const formattedPrice = price != null && Number.isFinite(Number(price))
                ? `${Number(price).toLocaleString("ko-KR")}원`
                : "가격 문의";
              const route = item.departure && item.destination
                ? `${item.departure} → ${item.destination}`
                : item.destination || item.name;
              const duration = item.nights != null && item.days != null
                ? `${item.nights}박 ${item.days}일`
                : item.course || route;

              return (
                <button
                  type="button"
                  key={item.id}
                  className={`package-card theme-${themeClass}`}
                  onClick={() => navigate(`/booking?tourId=${item.id}`)}
                  aria-label={`${item.name} 예약하기`}
                >
                  <div className="package-image-wrap">
                    <img
                      className="package-image"
                      src={THEME_IMAGES[themeKey] || THEME_IMAGES.HONEYMOON}
                      alt={`${item.destination || item.name} ${THEME_LABELS[themeKey] || "테마"} 여행`}
                    />
                    <span className="package-theme">{THEME_LABELS[themeKey] || themeKey}</span>
                  </div>
                  <div className="package-body">
                    <div className="package-title" role="heading" aria-level={3}>
                      {item.name}
                    </div>
                    <div className="package-location">{item.description || route}</div>
                    <div className="package-fact">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="6" cy="6" r="2" />
                        <circle cx="18" cy="18" r="2" />
                        <path d="M8 6h3a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7" />
                      </svg>
                      <span>{item.course || duration}</span>
                    </div>
                    <div className="package-price">
                      <strong>{formattedPrice}</strong>
                      <span>1인 기준</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="package-rail-footer">
          <button
            type="button"
            className="button button-primary"
            onClick={() => filteredTours[0] && navigate(`/booking?tourId=${filteredTours[0].id}`)}
            disabled={loading || filteredTours.length === 0}
          >
            패키지 둘러보기
          </button>
          <span>옆으로 넘겨 모든 패키지를 확인하세요 <span aria-hidden="true">→</span></span>
        </div>
      </section>
    </main>
  );
};

export default HomePage;