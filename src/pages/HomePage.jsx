import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToursApi } from "../api/tours";
import { getMyBookingsApi } from "../api/bookings";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTours = async () => {
      try {
        const tourData = await getToursApi();
        if (isMounted) setTours(tourData || []);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const loadBookings = async () => {
      if (isAuthenticated) {
        try {
          const bookingData = await getMyBookingsApi();
          if (isMounted) setBookings(bookingData || []);
        } catch (err) {
          console.error("Failed to fetch bookings:", err);
        }
      }
    };

    loadTours();
    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const unpaidBooking = bookings.find((b) => b.status === "CONFIRMED");

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      {/* Payment Reminder Banner */}
      {unpaidBooking && (
        <div style={{ background: "#fff3cd", color: "#856404", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ffeeba", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>결제 대기중인 예약이 있습니다!</strong> [{unpaidBooking.tourName}] 24시간 이내에 결제를 완료해 주세요.
          </div>
          <button onClick={() => navigate("/payment")} style={{ padding: "8px 16px", background: "#e94560", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            결제하기
          </button>
        </div>
      )}

      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>미스터 월드 테마 여행 패키지</h2>
      <p style={{ color: "#444", marginBottom: "30px" }}>원하시는 테마를 선택하여 맞춤형 여행을 시작해보세요.</p>

      {loading ? (
        <div style={{ padding: "20px", color: "#333" }}>테마 투어 목록을 불러오는 중...</div>
      ) : tours.length === 0 ? (
        <div style={{ padding: "20px", color: "#666" }}>등록된 투어 상품이 없습니다.</div>
      ) : (
        /* Theme Cards Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {tours.map((tour) => (
            <div key={tour.id} style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "20px", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "12px", background: "#0f3460", color: "#ffffff", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                  {tour.tourTheme}
                </span>
                <h3 style={{ marginTop: "12px", marginBottom: "8px", color: "#111" }}>{tour.name}</h3>
                <p style={{ fontSize: "14px", color: "#444", minHeight: "40px" }}>{tour.description}</p>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
                  {tour.departure} ➔ {tour.destination}
                </div>
              </div>
              <button
                onClick={() => navigate(`/booking?tourId=${tour.id}`)}
                style={{ width: "100%", padding: "10px", background: "#0f3460", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              >
                예약하기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;