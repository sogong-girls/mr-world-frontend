import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi } from "../api/bookings";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [targetBooking, setTargetBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const bookings = await getMyBookingsApi();
        // CONFIRMED 상태인 첫 번째 예약을 결제 대상으로 선택
        const confirmed = bookings.find((b) => b.status === "CONFIRMED");
        setTargetBooking(confirmed || null);
      } catch (err) {
        console.error("Failed to fetch payment booking:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTarget();
  }, []);

  if (loading) return <div style={{ padding: 20, color: "#333" }}>결제 정보를 불러오는 중...</div>;

  if (!targetBooking) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center" }}>
        <h3>현재 결제 대기 중인 예약이 없습니다.</h3>
        <button onClick={() => navigate("/")} style={{ marginTop: "15px", padding: "10px 20px", background: "#0f3460", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          홈으로 이동
        </button>
      </div>
    );
  }

  const handlePayment = (e) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      alert(`[${targetBooking.tourName}] 결제가 성공적으로 완료되었습니다!\n(예약 상태가 'BOOKED'로 변경되었습니다.)`);
      setProcessing(false);
      navigate("/past-tours");
    }, 1000);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>여행 상품 결제</h2>

      <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #eee" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#0f3460" }}>{targetBooking.tourName}</h4>
        <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>등급: {targetBooking.style}</div>
        <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>인원: {targetBooking.headcount}명</div>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#e94560", marginTop: "10px" }}>
          최종 결제 금액: {targetBooking.totalPrice?.toLocaleString()} 원
        </div>
      </div>

      <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>결제 수단 선택</label>
          <div style={{ display: "flex", gap: "10px" }}>
            {["CARD", "BANK_TRANSFER", "EASY_PAY"].map((method) => (
              <label
                key={method}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: paymentMethod === method ? "2px solid #0f3460" : "1px solid #ccc",
                  borderRadius: "6px",
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: "13px",
                  background: paymentMethod === method ? "#eef2f7" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ display: "none" }}
                />
                {method === "CARD" && "신용/체크카드"}
                {method === "BANK_TRANSFER" && "계좌이체"}
                {method === "EASY_PAY" && "간편결제"}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          style={{ width: "100%", padding: "14px", background: "#104aa2", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}
        >
          {processing ? "결제 처리 중..." : `${targetBooking.totalPrice?.toLocaleString()}원 결제하기`}
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;