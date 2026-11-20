// src/pages/PaymentPage.jsx
// 목록 응답에는 호텔·식사·addon·결제 기한이 없어서 GET /api/bookings/{id} 상세를 받아 보여 준다.
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBookingDetailApi, getMyBookingsApi, payBookingApi } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useAiChat } from "../context/useAiChat";
import LoadingIndicator from "../components/LoadingIndicator";
import { ADDON_LABELS, BOOKING_STATUS, MEAL_LABELS, STYLE_LABELS, statusText } from "../constants";
import { getUnpaidBookings } from "../utils/travelHistory";
import { formatDateTime, formatWon } from "../utils/format";

const rowStyle = { display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px", color: "#555", padding: "4px 0" };

const nowLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 19);
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get("bookingId");
  const { reloadMyBookings } = useAiChat();

  const [booking, setBooking] = useState(null);
  const [emptyReason, setEmptyReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchTarget = async () => {
      try {
        let bookingId = bookingIdParam;
        if (!bookingId) {
          // bookingId 없이 들어오면 결제할 확정 예약 중 출발이 가장 가까운 것
          const bookings = await getMyBookingsApi();
          const unpaid = getUnpaidBookings(bookings);
          if (unpaid.length === 0) {
            if (active) {
              setEmptyReason(
                bookings.some((b) => b.status === "PENDING")
                  ? `${BOOKING_STATUS.PENDING.label} 예약은 같은 날짜 인원이 모여 확정된 뒤에 결제할 수 있어요.`
                  : "지금 결제할 확정 예약이 없어요.",
              );
            }
            return;
          }
          bookingId = unpaid[0].id;
        }
        const detail = await getBookingDetailApi(bookingId);
        if (active) setBooking(detail);
      } catch (err) {
        if (active) setEmptyReason(getErrorMessage(err, "결제 정보를 불러오지 못했어요."));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTarget();
    return () => {
      active = false;
    };
  }, [bookingIdParam]);

  if (loading) return <LoadingIndicator text="결제 정보를 불러오는 중" />;

  const notPayable = !booking
    ? emptyReason
    : booking.status === "PENDING"
      ? `아직 ${BOOKING_STATUS.PENDING.label} 예약이에요. 같은 날짜 인원이 모여 확정되면 결제할 수 있어요.`
      : booking.status !== "CONFIRMED"
        ? `이미 결제된 예약이에요. (현재 상태: ${statusText(booking.status)})`
        : "";

  if (notPayable) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "#fff", border: "1px solid #e6e7e1", borderRadius: "12px", textAlign: "center" }}>
        <h3 style={{ fontSize: "16px", lineHeight: 1.5 }}>{notPayable}</h3>
        <button
          onClick={() => navigate("/past-tours")}
          style={{ marginTop: "15px", padding: "10px 20px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          내 여행 이력 보기
        </button>
      </div>
    );
  }

  const tourName = booking.tour?.name || "신청한 투어";
  const discount = Number(booking.discountPrice || 0);
  const finalPrice = Number(booking.totalPrice || 0) - discount;
  const overdue = booking.paymentDueAt && booking.paymentDueAt < nowLocal();

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError("");
    try {
      await payBookingApi(booking.id);
      reloadMyBookings();
      alert(`[${tourName}] 결제가 완료되었습니다!\n(예약 상태: ${statusText("BOOKED")})`);
      navigate("/past-tours");
    } catch (err) {
      setError(getErrorMessage(err, "결제 처리 중 오류가 발생했습니다."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "24px auto", padding: "24px", background: "#fff", border: "1px solid #e6e7e1", borderRadius: "12px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>여행 상품 결제</h2>

      <div style={{ background: "#f7f8f4", padding: "16px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e6e7e1" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#2c5f4c" }}>{tourName}</h4>
        <div style={rowStyle}><span>기간</span><strong>{formatDateTime(booking.startAt)} ~ {formatDateTime(booking.endAt)}</strong></div>
        <div style={rowStyle}><span>인원</span><strong>{booking.participantsCount}명</strong></div>
        <div style={rowStyle}><span>스타일</span><strong>{STYLE_LABELS[booking.tourStyleType] || booking.tourStyleType}</strong></div>
        <div style={rowStyle}><span>호텔</span><strong>{booking.hotelOption?.name || "-"}</strong></div>
        <div style={rowStyle}><span>식사</span><strong>{booking.foodOption?.name || "-"}</strong></div>
        <div style={rowStyle}>
          <span>추가 옵션</span>
          <strong style={{ textAlign: "right" }}>
            {(booking.bookingAddons || []).length > 0
              ? [...booking.bookingAddons]
                  .sort((a, b) => a.nthDay - b.nthDay)
                  .map((a) => `${a.nthDay}일차 ${MEAL_LABELS[a.meal] || a.meal} ${ADDON_LABELS[a.addonOption?.type] || ""}`)
                  .join(", ")
              : "없음"}
          </strong>
        </div>
        <hr style={{ margin: "10px 0", border: 0, borderTop: "1px solid #e6e7e1" }} />
        {discount > 0 && (
          <>
            <div style={rowStyle}><span>정가</span><span style={{ textDecoration: "line-through" }}>{formatWon(booking.totalPrice)}</span></div>
            <div style={{ ...rowStyle, color: "#ce6f72" }}><span>단골 할인</span><span>-{formatWon(discount)}</span></div>
          </>
        )}
        <div style={{ ...rowStyle, fontSize: "17px", fontWeight: "bold", color: "#ce6f72" }}>
          <span>최종 결제 금액</span><span>{formatWon(finalPrice)}</span>
        </div>
        {booking.paymentDueAt && (
          <div style={{ ...rowStyle, color: overdue ? "#b91c1c" : "#92400e", fontWeight: 700 }}>
            <span>결제 기한</span>
            <span>{formatDateTime(booking.paymentDueAt)}{overdue ? " (지남)" : "까지"}</span>
          </div>
        )}
      </div>

      <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#202522" }}>결제 수단 선택</label>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { id: "CARD", label: "신용/체크카드" },
              { id: "BANK_TRANSFER", label: "계좌이체" },
              { id: "EASY_PAY", label: "간편결제" },
            ].map((method) => (
              <label
                key={method.id}
                style={{
                  flex: 1,
                  padding: "11px",
                  border: paymentMethod === method.id ? "2px solid #2c5f4c" : "1px solid #ccc",
                  borderRadius: "8px",
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: paymentMethod === method.id ? "bold" : "normal",
                  background: paymentMethod === method.id ? "#eef5f1" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ display: "none" }}
                />
                {method.label}
              </label>
            ))}
          </div>
        </div>

        {error && <div role="alert" style={{ color: "#b91c1c", fontSize: "14px" }}>{error}</div>}

        <button
          type="submit"
          disabled={processing}
          style={{
            width: "100%",
            padding: "14px",
            background: "#2c5f4c",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          {processing ? "결제 처리 중..." : `${formatWon(finalPrice)} 결제하기`}
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;
