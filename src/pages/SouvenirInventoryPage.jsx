// src/pages/SouvenirInventoryPage.jsx (UC-08 Manage Inventory, 직원)
// 화면 구성은 front ef19f22(테마 태그 · 총 재고 → 출고 → 남는 재고 · 재고 부족 표시), 데이터는 백엔드 API:
// - 재고: GET /api/admin/souvenirs → {id, name, description, stockCount, requiredCount, bookings[]}
//   requiredCount = 결제 완료(준비)·출발 전 예약 인원 (1인 1개). 백엔드는 재고를 자동으로 빼지 않는다.
// - 테마: 투어 상세(GET /api/tours/{id})의 souvenir.id로 기념품과 투어를 잇는다
// - 결제 전 예정 수량: GET /api/admin/bookings 중 신청대기·확정(결제 전) 인원 (참고용)
// - +/−: PATCH /api/admin/souvenirs/{id}/stock {amount} (증감값, 서버에 저장됨)
import { useEffect, useState } from "react";
import { getSouvenirsApi, updateSouvenirStockApi } from "../api/souvenirs";
import { getAllBookingsApi } from "../api/bookings";
import { getTourDetailApi, getToursApi } from "../api/tours";
import { getErrorMessage } from "../api/errors";
import LoadingIndicator from "../components/LoadingIndicator";
import { THEME_LABELS, statusText } from "../constants";
import { formatDate } from "../utils/format";

const LOW_STOCK = 5;
const UNPAID_STATUSES = ["PENDING", "CONFIRMED"];

const nowLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 19);
};

// 투어 목록 + 상세 → { 기념품 id: [투어, ...] }
const loadToursBySouvenir = async () => {
  const tours = await getToursApi();
  const details = await Promise.all((tours || []).map((t) => getTourDetailApi(t.id).catch(() => null)));
  const map = {};
  details.forEach((tour) => {
    const souvenirId = tour?.souvenir?.id;
    if (souvenirId == null) return;
    (map[souvenirId] ||= []).push(tour);
  });
  return map;
};

const rowStyle = { display: "flex", justifyContent: "space-between", gap: "8px" };
const stockButtonStyle = (disabled) => ({
  width: "30px",
  height: "30px",
  background: "#2c5f4c",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

const SouvenirInventoryPage = () => {
  const [items, setItems] = useState([]);
  const [toursBySouvenir, setToursBySouvenir] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    // 재고만 꼭 필요하고, 테마·예정 수량은 못 받아도 화면은 보여 준다
    Promise.all([getSouvenirsApi(), loadToursBySouvenir().catch(() => ({})), getAllBookingsApi().catch(() => [])])
      .then(([souvenirs, tourMap, bookingList]) => {
        if (!active) return;
        setItems(souvenirs || []);
        setToursBySouvenir(tourMap);
        setBookings(bookingList || []);
      })
      .catch((err) => {
        if (active) setLoadError(getErrorMessage(err, "창고 재고를 불러오지 못했어요."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStockChange = async (id, amount) => {
    setPendingId(id);
    setActionError("");
    try {
      const updated = await updateSouvenirStockApi(id, amount);
      // 응답(SouvenirResponse)에는 requiredCount·bookings가 없어서 재고만 바꾼다
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, stockCount: updated.stockCount } : item)));
    } catch (err) {
      setActionError(getErrorMessage(err, "재고를 바꾸지 못했어요."));
    } finally {
      setPendingId(null);
    }
  };

  // 이 기념품을 주는 투어의 결제 전(신청대기·확정) 출발 전 예약 인원
  const unpaidCount = (tours) => {
    const tourIds = new Set(tours.map((t) => String(t.id)));
    const now = nowLocal();
    return bookings
      .filter((b) => tourIds.has(String(b.tourId)) && UNPAID_STATUSES.includes(b.status) && (!b.startAt || b.startAt > now))
      .reduce((sum, b) => sum + Number(b.participantsCount || 0), 0);
  };

  if (loading) return <LoadingIndicator text="창고 재고를 불러오는 중" />;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 창고 기념품 및 재고 관리</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        결제를 마친 출발 전 예약 인원만큼(1인 1개) 출고할 수량을 보여 줘요. 실제 입고·출고는 +/− 버튼으로 반영돼요.
      </p>

      {loadError && <div role="alert" style={{ color: "#99575b", marginBottom: "12px" }}>{loadError}</div>}
      {actionError && <div role="alert" style={{ color: "#b91c1c", marginBottom: "12px" }}>{actionError}</div>}
      {!loadError && items.length === 0 && <div style={{ color: "#69716c" }}>등록된 기념품이 없어요.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {items.map((item) => {
          const tours = toursBySouvenir[item.id] || [];
          const themes = [...new Set(tours.map((t) => THEME_LABELS[t.tourTheme] || t.tourTheme))];
          const required = Number(item.requiredCount || 0);
          const reserved = unpaidCount(tours);
          const remaining = item.stockCount - required;
          const shortage = Math.max(0, -remaining);
          const isLowStock = shortage > 0 || remaining <= LOW_STOCK;
          const busy = pendingId === item.id;

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
                  {themes.length > 0 ? themes.join(" · ") : "연결된 투어 없음"}
                </span>
                {isLowStock && (
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ce6f72" }}>
                    {shortage > 0 ? `${shortage}개 부족` : "재고 부족 주의"}
                  </span>
                )}
              </div>

              <h4 style={{ margin: "8px 0 4px 0", color: "#202522" }}>{item.name}</h4>
              <div style={{ fontSize: "13px", color: "#69716c", marginBottom: "12px" }}>
                {item.description || "-"}
                {tours.length > 0 && <div>투어: {tours.map((t) => t.name).join(", ")}</div>}
              </div>

              {/* 예약 연동 상세 내역 */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#4f5752",
                  background: "#f7f8f4",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "grid",
                  gap: "4px",
                }}
              >
                <div style={rowStyle}>
                  <span>창고 재고</span>
                  <strong>{item.stockCount} 개</strong>
                </div>
                <div style={{ ...rowStyle, color: "#2c5f4c" }}>
                  <span>출고할 수량 (결제 완료·출발 전)</span>
                  <strong>{required > 0 ? `-${required}` : 0} 개</strong>
                </div>
                {(item.bookings || []).map((b) => (
                  <div key={b.bookingId} style={{ ...rowStyle, color: "#69716c", paddingLeft: "8px" }}>
                    <span>
                      예약 #{b.bookingId} · {formatDate(b.startAt)} 출발 · {statusText(b.status)}
                    </span>
                    <span>{b.quantity}개</span>
                  </div>
                ))}
                {reserved > 0 && (
                  <div style={{ ...rowStyle, color: "#b45309" }}>
                    <span>결제 전 예약 (신청대기·확정, 예정)</span>
                    <strong>{reserved} 개</strong>
                  </div>
                )}
              </div>

              {/* 남는 재고 & 입고·출고 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fafaf7",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #eee",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: "bold", color: isLowStock ? "#ce6f72" : "#202522" }}>
                  출고 후 남는 재고: {remaining} 개
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    type="button"
                    onClick={() => handleStockChange(item.id, -1)}
                    disabled={busy || item.stockCount <= 0}
                    title="1개 출고"
                    aria-label={`${item.name} 1개 출고`}
                    style={stockButtonStyle(busy || item.stockCount <= 0)}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockChange(item.id, 1)}
                    disabled={busy}
                    title="1개 입고"
                    aria-label={`${item.name} 1개 입고`}
                    style={stockButtonStyle(busy)}
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
