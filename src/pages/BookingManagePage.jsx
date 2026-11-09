import React, { useState } from "react";

// 초기 직원용 전체 고객 예약 목록 Mock 데이터
const INITIAL_ADMIN_BOOKINGS = [
  { id: "B101", userName: "김철수", tourName: "허니문 낭만 투어", style: "PREMIUM", headcount: 2, totalPrice: 3240000, status: "PENDING", date: "2026-11-05" },
  { id: "B102", userName: "이영희", tourName: "효도 힐링 투어", style: "GRAND", headcount: 4, totalPrice: 4000000, status: "CONFIRMED", date: "2026-11-04" },
  { id: "B103", userName: "박민수", tourName: "골프 리조트 투어", style: "CLASSIC", headcount: 3, totalPrice: 4500000, status: "BOOKED", date: "2026-11-01" },
];

const BookingManagePage = () => {
  const [bookings, setBookings] = useState(INITIAL_ADMIN_BOOKINGS);

  const handleApprove = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED" } : b))
    );
    alert(`예약 [${bookingId}] 번 건이 'CONFIRMED (승인 완료/결제 대기)' 상태로 승인되었습니다.`);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>[직원 전용] 고객 예약 신청 및 승인 현황</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>고객이 신청한 PENDING 상태의 예약을 검토하고 CONFIRMED 승인 처리를 진행합니다.</p>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ background: "#1a1a2e", color: "#fff", textAlign: "left" }}>
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
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>{b.id}</td>
              <td style={{ padding: "10px" }}>{b.userName}</td>
              <td style={{ padding: "10px" }}>{b.tourName}</td>
              <td style={{ padding: "10px" }}>{b.style} ({b.headcount}명)</td>
              <td style={{ padding: "10px", fontWeight: "bold", color: "#0f3460" }}>{b.totalPrice.toLocaleString()}원</td>
              <td style={{ padding: "10px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#fff",
                    background:
                      b.status === "PENDING" ? "#f39c12" : b.status === "CONFIRMED" ? "#27ae60" : "#2980b9",
                  }}
                >
                  {b.status}
                </span>
              </td>
              <td style={{ padding: "10px" }}>
                {b.status === "PENDING" ? (
                  <button
                    onClick={() => handleApprove(b.id)}
                    style={{ padding: "6px 12px", background: "#4587e9", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    승인하기
                  </button>
                ) : (
                  <span style={{ fontSize: "12px", color: "#888" }}>완료됨</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingManagePage;