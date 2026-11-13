// src/pages/PaymentPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyBookingsApi, payBookingApi } from "../api/bookings";
import { getToursApi } from "../api/tours";
import LoadingIndicator from "../components/LoadingIndicator";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get("bookingId");

  const [targetBooking, setTargetBooking] = useState(null);
  const [tourName, setTourName] = useState("");
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const [bookings, tours] = await Promise.all([
          getMyBookingsApi(),
          getToursApi(),
        ]);

        const confirmedList = (bookings || []).filter((b) => b.status === "CONFIRMED");
        const selected = bookingIdParam
          ? confirmedList.find((b) => String(b.id) === String(bookingIdParam)) || confirmedList[0]
          : confirmedList[0];

        setHasPendingBooking((bookings || []).some((b) => b.status === "PENDING"));
        setTargetBooking(selected || null);

        if (selected) {
          const matchedTour = (tours || []).find((t) => String(t.id) === String(selected.tourId));
          setTourName(selected.tourName || selected.tour?.name || matchedTour?.name || `투어 #${selected.tourId}`);
        }
      } catch (err) {
        console.error("Failed to fetch payment booking:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTarget();
  }, [bookingIdParam]);

  if (loading) return <LoadingIndicator text="결제 정보를 불러오는 중" />;

  if (!targetBooking) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "#fff", border: "1px solid #e6e7e1", borderRadius: "12px", textAlign: "center" }}>
        <h3>
          {hasPendingBooking
            ? "현재 PENDING 예약은 3명 이상 모객될 때까지 대기 중입니다. 확정(CONFIRMED) 후 결제가 가능합니다."
            : "현재 결제 대기 중인 확정(CONFIRMED) 예약이 없습니다."}
        </h3>
        <button
          onClick={() => navigate("/past-tours")}
          style={{ marginTop: "15px", padding: "10px 20px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          내 여행 이력 보기
        </button>
      </div>
    );
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await payBookingApi(targetBooking.id);
      alert(`[${tourName}] 결제가 성공적으로 완료되었습니다!\n(예약 상태가 'BOOKED'로 변경되었습니다.)`);
      navigate("/past-tours");
    } catch (err) {
      console.error("Payment failed:", err);
      alert(err.response?.data?.message || "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const styleLabel = targetBooking.tourStyleType || targetBooking.style || "CLASSIC";
  const peopleCount = targetBooking.participantsCount ?? targetBooking.headcount ?? 1;

  return (
    <div style={{ maxWidth: "600px", margin: "24px auto", padding: "24px", background: "#fff", border: "1px solid #e6e7e1", borderRadius: "12px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>여행 상품 결제</h2>

      <div style={{ background: "#f7f8f4", padding: "16px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e6e7e1" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#2c5f4c" }}>{tourName}</h4>
        <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>등급: {styleLabel}</div>
        <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>인원: {peopleCount}명</div>
        <div style={{ fontSize: "17px", fontWeight: "bold", color: "#ce6f72", marginTop: "10px" }}>
          최종 결제 금액: {Number(targetBooking.totalPrice || 0).toLocaleString()} 원
        </div>
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
          {processing ? "결제 처리 중..." : `${Number(targetBooking.totalPrice || 0).toLocaleString()}원 결제하기`}
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;