// src/pages/SouvenirInventoryPage.jsx
import { useEffect, useState } from "react";
import { getAllBookingsApi } from "../api/bookings";
import { getToursApi } from "../api/tours";
import LoadingIndicator from "../components/LoadingIndicator";

const INITIAL_INVENTORY = [
  { id: 1, name: "허니문 커플티 세트", category: "HONEYMOON", initialStock: 20, location: "A-1 창고" },
  { id: 2, name: "효도 건강 인삼세트", category: "PARENT", initialStock: 45, location: "B-3 창고" },
  { id: 3, name: "골프 프리미엄 골프 액세서리 세트", category: "GOLF", initialStock: 12, location: "A-2 창고" },
  { id: 4, name: "아웃도어 트레킹 기념 스카프 세트", category: "TREKKING", initialStock: 25, location: "C-1 창고" },
];

// 재고가 확정 차감되는 예약 상태 (PENDING은 모객 대기 중이므로 예정 수량으로만 표시)
const DEDUCTED_STATUSES = ["CONFIRMED", "BOOKED", "DEPARTED", "ARRIVED"];

const SouvenirInventoryPage = () => {
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventorySyncData = async () => {
      try {
        const [bookingList, tourList] = await Promise.all([
          getAllBookingsApi(),
          getToursApi(),
        ]);
        setBookings(bookingList || []);
        setTours(tourList || []);
      } catch (err) {
        console.error("Failed to sync inventory with bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInventorySyncData();
  }, []);

  // 수동 입고/출고 조정 (총 보유량 기준)
  const handleStockChange = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, initialStock: Math.max(0, item.initialStock + delta) } : item
      )
    );
  };

  // 특정 기념품(item)에 해당하는 예약 사용량 및 대기 수량 계산
  const getUsageStats = (item) => {
    let confirmedUsed = 0;
    let pendingReserved = 0;

    bookings.forEach((b) => {
      const matchedTour = tours.find((t) => String(t.id) === String(b.tourId));
      // 투어의 souvenirId가 있으면 우선 매칭, 없으면 테마(category)로 매칭
      const matchesSouvenir = matchedTour?.souvenirId != null
        ? String(matchedTour.souvenirId) === String(item.id)
        : (matchedTour?.tourTheme || matchedTour?.theme) === item.category;

      if (!matchesSouvenir) return;

      const count = Number(b.participantsCount ?? b.headcount ?? 1);
      if (DEDUCTED_STATUSES.includes(b.status)) {
        confirmedUsed += count;
      } else if (b.status === "PENDING") {
        pendingReserved += count;
      }
    });

    return { confirmedUsed, pendingReserved };
  };

  if (loading) return <LoadingIndicator text="창고 재고를 동기화하는 중" />;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 창고 사은품 및 재고 관리</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        확정(CONFIRMED/BOOKED)된 예약 인원수만큼 사은품 재고가 자동으로 차감되며, 수동 입·출고도 함께 반영됩니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {items.map((item) => {
          const { confirmedUsed, pendingReserved } = getUsageStats(item);
          const remainingStock = Math.max(0, item.initialStock - confirmedUsed);
          const isLowStock = remainingStock <= 5;

          return (
            <div
              key={item.id}
              style={{
                background: "#fff",
                border: isLowStock ? "1.5px solid #ce6f72" : "1px solid #e6e7e1",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#2c5f4c" }}>
                  {item.category}
                </span>
                {isLowStock && (
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ce6f72" }}>
                    재고 부족 주의
                  </span>
                )}
              </div>

              <h4 style={{ margin: "8px 0 4px 0", color: "#202522" }}>{item.name}</h4>
              <div style={{ fontSize: "13px", color: "#69716c", marginBottom: "12px" }}>위치: {item.location}</div>

              {/* 예약 연동 상세 내역 */}
              <div style={{ fontSize: "12px", color: "#4f5752", background: "#f7f8f4", padding: "10px", borderRadius: "8px", marginBottom: "12px", display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>창고 총 입고 수량</span>
                  <strong>{item.initialStock} 개</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#2c5f4c" }}>
                  <span>확정 예약 자동 출고</span>
                  <strong>-{confirmedUsed} 개</strong>
                </div>
                {pendingReserved > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309" }}>
                    <span>대기(PENDING) 출고 예정</span>
                    <strong>{pendingReserved} 개</strong>
                  </div>
                )}
              </div>

              {/* 최종 남은 재고 & 수동 조정 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafaf7", padding: "10px", borderRadius: "8px", border: "1px solid #eee" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: isLowStock ? "#ce6f72" : "#202522" }}>
                  현재 잔여 재고: {remainingStock} 개
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    type="button"
                    onClick={() => handleStockChange(item.id, -1)}
                    title="입고 수량 차감"
                    style={{ width: "30px", height: "30px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockChange(item.id, 1)}
                    title="신규 물량 입고"
                    style={{ width: "30px", height: "30px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SouvenirInventoryPage;