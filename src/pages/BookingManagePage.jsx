// src/pages/BookingManagePage.jsx
import { useEffect, useState } from "react";
import { getAllBookingsApi, updateAdminBookingStatusApi } from "../api/bookings";
import { getToursApi } from "../api/tours";
import LoadingIndicator from "../components/LoadingIndicator";

const BookingManagePage = () => {
  const [bookings, setBookings] = useState([]);
  const [toursMap, setToursMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingList, tourList] = await Promise.all([
          getAllBookingsApi(),
          getToursApi(),
        ]);
        const map = {};
        (tourList || []).forEach((t) => {
          map[String(t.id)] = t;
        });
        setToursMap(map);
        setBookings(bookingList || []);
      } catch (err) {
        console.error("Failed to load admin bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApprove = async (bookingId) => {
    try {
      await updateAdminBookingStatusApi(bookingId, "CONFIRMED");
      setBookings((prev) =>
        prev.map((b) => (String(b.id) === String(bookingId) ? { ...b, status: "CONFIRMED" } : b))
      );
      alert(`예약 [${bookingId}] 번 건이 'CONFIRMED (확정 완료)' 상태로 승인되었습니다.`);
    } catch (err) {
      console.error("Failed to approve booking:", err);
      alert("예약 상태 변경 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <LoadingIndicator text="예약 현황을 불러오는 중" />;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 고객 예약 신청 및 승인 현황</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        고객이 신청한 PENDING 상태의 예약을 검토하고 CONFIRMED 승인 처리를 진행합니다.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e6e7e1" }}>
        <thead>
          <tr style={{ background: "#202522", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>예약ID</th>
            <th style={{ padding: "10px" }}>고객명</th>
            <th style={{ padding: "10px" }}>투어 상품명</th>
            <th style={{ padding: "10px" }}>등급/인원</th>
            <th style={{ padding: "10px" }}>총 금액</th>
            <th style={{ padding: "10px" }}>현재 상태</th>
            <th style={{ padding: "10px" }}>승인 처리</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const tourName = b.tourName || toursMap[String(b.tourId)]?.name || `투어 #${b.tourId}`;
            const styleLabel = b.tourStyleType || b.style || "-";
            const headcount = b.participantsCount ?? b.headcount ?? 1;

            return (
              <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>{b.id}</td>
                <td style={{ padding: "10px" }}>{b.userName || `회원 #${b.userId}`}</td>
                <td style={{ padding: "10px" }}>{tourName}</td>
                <td style={{ padding: "10px" }}>{styleLabel} ({headcount}명)</td>
                <td style={{ padding: "10px", fontWeight: "bold", color: "#2c5f4c" }}>
                  {Number(b.totalPrice || 0).toLocaleString()}원
                </td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#fff",
                      background:
                        b.status === "PENDING" ? "#d97706" : b.status === "CONFIRMED" ? "#2c5f4c" : "#2563eb",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>
                  {b.status === "PENDING" ? (
                    <button
                      onClick={() => handleApprove(b.id)}
                      style={{ padding: "6px 12px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      승인하기
                    </button>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#888" }}>완료됨</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BookingManagePage;