// src/pages/PastTourPages.jsx (UC-03 View Past Tours)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi } from "../api/bookings";
import { getToursApi } from "../api/tours";
import { getErrorMessage } from "../api/errors";
import LoadingIndicator from "../components/LoadingIndicator";
import { BOOKING_STATUS, STYLE_LABELS, minParticipants, statusText } from "../constants";
import { sortByStartDesc, toursById } from "../utils/travelHistory";
import { formatDateTime, formatWon } from "../utils/format";

const PastTourPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [tourMap, setTourMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getMyBookingsApi(), getToursApi()])
      .then(([bookingData, tourList]) => {
        if (!active) return;
        setTourMap(toursById(tourList));
        setBookings(sortByStartDesc(bookingData)); // 최근 출발 먼저
      })
      .catch((err) => {
        if (active) setLoadError(getErrorMessage(err, "여행 이력을 불러오지 못했어요."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingIndicator text="내 여행 이력을 불러오는 중" />;
  return (
    <div style={{ maxWidth: "800px", margin: "24px auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>내 여행 예약 이력</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        신청하신 테마 여행의 진행 상태와 결제 여부를 확인할 수 있습니다. (최근 출발일 순)
      </p>

      {loadError ? (
        <div role="alert" style={{ padding: "20px", background: "#fbefed", border: "1px solid #e7c5c2", borderRadius: "12px", color: "#99575b" }}>
          {loadError}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ padding: "30px", background: "#fff", border: "1px solid #e6e7e1", borderRadius: "12px", textAlign: "center", color: "#69716c" }}>
          예약된 여행 이력이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {bookings.map((booking) => {
            const statusInfo = BOOKING_STATUS[booking.status] || { color: "#333" };
            const tour = tourMap[String(booking.tourId)];
            const tourName = tour?.name || `투어 #${booking.tourId}`;
            const minimum = minParticipants(tour?.tourTheme);

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
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 320px" }}>
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
                    {statusText(booking.status)}
                  </span>
                  {booking.status === "PENDING" && (
                    <div style={{ fontSize: "13px", color: "#92400e", background: "#fef3c7", padding: "6px 10px", borderRadius: "6px", marginBottom: "8px" }}>
                      {booking.participantsCount < minimum ? (
                        <>같은 날짜에 함께 가는 인원이 <strong>{minimum}명 이상</strong> 모이면 자동으로 확정되고, 결제 안내 문자를 보내 드려요.</>
                      ) : (
                        <>같은 날짜 인원이 모여 확정되면 결제 안내 문자를 보내 드려요.</>
                      )}
                    </div>
                  )}
                  <h3 style={{ margin: "0 0 6px 0", color: "#202522" }}>{tourName}</h3>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    기간: <strong>{formatDateTime(booking.startAt)} ~ {formatDateTime(booking.endAt)}</strong>
                  </div>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    등급: <strong>{STYLE_LABELS[booking.tourStyleType] || booking.tourStyleType || "-"}</strong> | 인원: <strong>{booking.participantsCount}명</strong>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2c5f4c", marginTop: "4px" }}>
                    정가: {formatWon(booking.totalPrice)}
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
