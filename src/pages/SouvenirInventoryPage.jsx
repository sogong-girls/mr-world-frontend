// src/pages/SouvenirInventoryPage.jsx (UC-08 Manage Inventory, 직원)
// 재고: GET /api/admin/souvenirs → {id, name, description, stockCount, requiredCount, bookings[]}
// requiredCount는 백엔드가 결제 완료(준비)·출발 전 예약 인원으로 센 "보내야 할 수량". 재고에서 자동으로 빠지지는 않는다.
// +/−: PATCH /api/admin/souvenirs/{id}/stock {amount} (증감값)
import { useEffect, useState } from "react";
import { getSouvenirsApi, updateSouvenirStockApi } from "../api/souvenirs";
import { getToursApi } from "../api/tours";
import { getErrorMessage } from "../api/errors";
import LoadingIndicator from "../components/LoadingIndicator";
import { statusText } from "../constants";
import { toursById } from "../utils/travelHistory";
import { formatDate } from "../utils/format";

const LOW_STOCK = 5;

const SouvenirInventoryPage = () => {
  const [items, setItems] = useState([]);
  const [tourMap, setTourMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getSouvenirsApi(), getToursApi().catch(() => [])])
      .then(([souvenirs, tours]) => {
        if (!active) return;
        setItems(souvenirs || []);
        setTourMap(toursById(tours));
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

  if (loading) return <LoadingIndicator text="창고 재고를 불러오는 중" />;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 창고 기념품 재고 관리</h2>
      <p style={{ color: "#69716c", marginBottom: "20px" }}>
        예상 필요 수량은 결제를 마친 출발 전 예약 인원(1인당 1개)이에요. 입고·출고는 +/− 버튼으로 반영해요.
      </p>

      {loadError && <div role="alert" style={{ color: "#99575b", marginBottom: "12px" }}>{loadError}</div>}
      {actionError && <div role="alert" style={{ color: "#b91c1c", marginBottom: "12px" }}>{actionError}</div>}
      {!loadError && items.length === 0 && <div style={{ color: "#69716c" }}>등록된 기념품이 없어요.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {items.map((item) => {
          const required = Number(item.requiredCount || 0);
          const shortage = Math.max(0, required - item.stockCount);
          const isLowStock = shortage > 0 || item.stockCount <= LOW_STOCK;
          const busy = pendingId === item.id;

          return (
            <div
              key={item.id}
              style={{ background: "#fff", border: isLowStock ? "1.5px solid #ce6f72" : "1px solid #e6e7e1", borderRadius: "10px", padding: "18px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#2c5f4c" }}>기념품 #{item.id}</span>
                {isLowStock && (
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ce6f72" }}>
                    {shortage > 0 ? `${shortage}개 부족` : "재고 부족 주의"}
                  </span>
                )}
              </div>

              <h4 style={{ margin: "8px 0 4px 0", color: "#202522" }}>{item.name}</h4>
              <div style={{ fontSize: "13px", color: "#69716c", marginBottom: "12px" }}>{item.description || "-"}</div>

              <div style={{ fontSize: "12px", color: "#4f5752", background: "#f7f8f4", padding: "10px", borderRadius: "8px", marginBottom: "12px", display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#2c5f4c" }}>
                  <span>예상 필요 수량 (결제 완료·출발 전)</span>
                  <strong>{required} 개</strong>
                </div>
                {(item.bookings || []).map((b) => (
                  <div key={b.bookingId} style={{ display: "flex", justifyContent: "space-between", color: "#69716c" }}>
                    <span>
                      예약 #{b.bookingId} · {tourMap[String(b.tourId)]?.name || `투어 #${b.tourId}`} · {formatDate(b.startAt)} · {statusText(b.status)}
                    </span>
                    <span>{b.quantity}개</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafaf7", padding: "10px", borderRadius: "8px", border: "1px solid #eee" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: isLowStock ? "#ce6f72" : "#202522" }}>
                  창고 재고: {item.stockCount} 개
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    type="button"
                    onClick={() => handleStockChange(item.id, -1)}
                    disabled={busy || item.stockCount <= 0}
                    title="1개 출고"
                    aria-label={`${item.name} 1개 출고`}
                    style={{ width: "30px", height: "30px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", opacity: busy || item.stockCount <= 0 ? 0.5 : 1 }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockChange(item.id, 1)}
                    disabled={busy}
                    title="1개 입고"
                    aria-label={`${item.name} 1개 입고`}
                    style={{ width: "30px", height: "30px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", opacity: busy ? 0.5 : 1 }}
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
