import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi } from "../api/bookings";

const STATUS_LABELS = {
  PENDING: { label: "직원 승인 대기", color: "#f39c12" },
  CONFIRMED: { label: "승인 완료 (결제 대기)", color: "#27ae60" },
  BOOKED: { label: "결제 완료 (예약 확정)", color: "#2980b9" },
  DEPARTED: { label: "여행 중", color: "#8e44ad" },
  ARRIVED: { label: "여행 완료", color: "#7f8c8d" },
};

const PastTourPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getMyBookingsApi();
        setBookings(data || []);
      } catch (err) {
        console.error("Failed to fetch past tours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div style={{ padding: 20, color: "#333" }}>내 여행 이력을 불러오는 중...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>내 여행 예약 이력</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>신청하신 테마 여행의 진행 상태를 확인할 수 있습니다.</p>

      {bookings.length === 0 ? (
        <div style={{ padding: "30px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", color: "#666" }}>
          예약된 여행 이력이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {bookings.map((booking) => {
            const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: "#333" };
            return (
              <div
                key={booking.id}
                style={{
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#fff",
                      background: statusInfo.color,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      marginBottom: "8px",
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  <h3 style={{ margin: "0 0 6px 0", color: "#111" }}>{booking.tourName}</h3>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    등급: {booking.style} | 인원: {booking.headcount}명
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#0f3460", marginTop: "4px" }}>
                    결제 금액: {booking.totalPrice?.toLocaleString()} 원
                  </div>
                </div>

                {booking.status === "CONFIRMED" && (
                  <button
                    onClick={() => navigate("/payment")}
                    style={{
                      padding: "10px 18px",
                      background: "#e94560",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    결제하기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PastTourPage;