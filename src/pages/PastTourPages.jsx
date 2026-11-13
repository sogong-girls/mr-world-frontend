// src/pages/PastTourPages.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi } from "../api/bookings";
import { getToursApi } from "../api/tours";
import LoadingIndicator from "../components/LoadingIndicator";

const STATUS_LABELS = {
  PENDING: { label: "PENDING (모객 대기 중)", color: "#d97706" },
  CONFIRMED: { label: "CONFIRMED (확정 완료 · 결제 대기)", color: "#2c5f4c" },
  BOOKED: { label: "BOOKED (결제 완료 · 예약 확정)", color: "#2563eb" },
  DEPARTED: { label: "DEPARTED (여행 중)", color: "#7c3aed" },
  ARRIVED: { label: "ARRIVED (여행 완료)", color: "#6b7280" },
};

const PastTourPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [toursMap, setToursMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const [bookingData, tourList] = await Promise.all([
          getMyBookingsApi(),
          getToursApi(),
        ]);
        const map = {};
        (tourList || []).forEach((t) => {
          map[String(t.id)] = t;
        });
        setToursMap(map);
        setBookings(bookingData || []);
      } catch (err) {
        console.error("Failed to fetch past tours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <LoadingIndicator text="내 여행 이력을 불러오는 중" />;
  return (
    <div style={{ maxWidth: "800px", margin: "24px auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>내 여행 예약 이력</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        신청하신 테마 여행의 진행 상태 및 결제 여부를 확인할 수 있습니다.
      </p>

      {bookings.length === 0 ? (
        <div style={{ padding: "30px", background: "#fff", border: "1px solid #e6e7e1", borderRadius: "12px", textAlign: "center", color: "#69716c" }}>
          예약된 여행 이력이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {bookings.map((booking) => {
            const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: "#333" };
            const tourName =
              booking.tourName ||
              booking.tour?.name ||
              toursMap[String(booking.tourId)]?.name ||
              `투어 #${booking.tourId}`;
            const styleLabel = booking.tourStyleType || booking.style || "CLASSIC";
            const peopleCount = booking.participantsCount ?? booking.headcount ?? 1;

            return (
              <div
                key={booking.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e6e7e1",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
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
                      padding: "4px 9px",
                      borderRadius: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  {booking.status === "PENDING" && (
                    <div style={{ fontSize: "13px", color: "#92400e", background: "#fef3c7", padding: "6px 10px", borderRadius: "6px", marginBottom: "8px" }}>
                      3명 미만 예약으로 현재 대기 중입니다. 다른 대기 예약과 합산되어 <strong>3명 이상</strong>이 되면 자동으로 확정(CONFIRMED)됩니다.
                    </div>
                  )}
                  <h3 style={{ margin: "0 0 6px 0", color: "#202522" }}>{tourName}</h3>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    등급: <strong>{styleLabel}</strong> | 인원: <strong>{peopleCount}명</strong>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2c5f4c", marginTop: "4px" }}>
                    결제 금액: {Number(booking.totalPrice || 0).toLocaleString()} 원
                  </div>
                </div>

                {booking.status === "CONFIRMED" && (
                  <button
                    onClick={() => navigate(`/payment?bookingId=${booking.id}`)}
                    style={{
                      padding: "10px 18px",
                      background: "#ce6f72",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
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