// src/pages/BookingManagePage.jsx
import { useEffect, useState } from "react";
import { getAllBookingsApi } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { STYLE_LABELS, statusText, BOOKING_STATUS } from "../constants";
import { sortByStartDesc } from "../utils/travelHistory";
import { formatDate } from "../utils/format";
import { getToursApi } from "../api/tours";
import LoadingIndicator from "../components/LoadingIndicator";

const BookingManagePage = () => {
  const [bookings, setBookings] = useState([]);
  const [toursMap, setToursMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
        setBookings(sortByStartDesc(bookingList));
      } catch (err) {
        setLoadError(getErrorMessage(err, "예약 현황을 불러오지 못했어요."));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingIndicator text="예약 현황을 불러오는 중" />;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 고객 예약 현황</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        같은 투어·같은 출발일 인원이 모이면 자동으로 확정되고 확정 문자가 나갑니다. (최근 출발일 순)
      </p>

      {loadError && <div role="alert" style={{ color: "#99575b", marginBottom: "12px" }}>{loadError}</div>}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e6e7e1" }}>
        <thead>
          <tr style={{ background: "#202522", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>예약ID</th>
            <th style={{ padding: "10px" }}>고객명</th>
            <th style={{ padding: "10px" }}>투어 상품명</th>
            <th style={{ padding: "10px" }}>출발일</th>
            <th style={{ padding: "10px" }}>등급/인원</th>
            <th style={{ padding: "10px" }}>총 금액</th>
            <th style={{ padding: "10px" }}>현재 상태</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const tourName = toursMap[String(b.tourId)]?.name || `투어 #${b.tourId}`;
            const styleLabel = STYLE_LABELS[b.tourStyleType] || b.tourStyleType || "-";
            const headcount = b.participantsCount;

            return (
              <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>{b.id}</td>
                <td style={{ padding: "10px" }}>회원 #{b.userId}</td>
                <td style={{ padding: "10px" }}>{tourName}</td>
                <td style={{ padding: "10px" }}>{formatDate(b.startAt)}</td>
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
                      background: BOOKING_STATUS[b.status]?.color || "#333",
                    }}
                  >
                    {statusText(b.status)}
                  </span>
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
