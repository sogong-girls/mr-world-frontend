// src/pages/SouvenirInventoryPage.jsx (UC-08 Manage Inventory, 직원)
import { useEffect, useState } from "react";
import { getSouvenirsApi, updateSouvenirStockApi } from "../api/souvenirs";
import { getAllBookingsApi } from "../api/bookings";
import { getToursApi } from "../api/tours";
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

// 투어 목록(각 투어의 souvenir 포함) → { 기념품 id: [투어, ...] }
const loadToursBySouvenir = async () => {
  const tours = await getToursApi();
  const map = {};
  (tours || []).forEach((tour) => {
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
  fontSize: "13px",
  fontWeight: "bold",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

const createEmptyBatchRow = (defaultSouvenirId = "") => ({
  rowId: `${Date.now()}-${Math.random()}`,
  souvenirId: defaultSouvenirId ? String(defaultSouvenirId) : "",
  amount: 10,
});

const SouvenirInventoryPage = () => {
  const [items, setItems] = useState([]);
  const [toursBySouvenir, setToursBySouvenir] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // 일괄 입고 상태
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchRows, setBatchRows] = useState([createEmptyBatchRow()]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getSouvenirsApi(), loadToursBySouvenir().catch(() => ({})), getAllBookingsApi().catch(() => [])])
      .then(([souvenirs, tourMap, bookingList]) => {
        if (!active) return;
        const list = souvenirs || [];
        setItems(list);
        setToursBySouvenir(tourMap);
        setBookings(bookingList || []);
        if (list.length > 0) {
          setBatchRows([createEmptyBatchRow(list[0].id)]);
        }
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
    setActionMessage("");
    try {
      const updated = await updateSouvenirStockApi(id, amount);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, stockCount: updated.stockCount } : item)));
    } catch (err) {
      setActionError(getErrorMessage(err, "재고를 바꾸지 못했어요."));
    } finally {
      setPendingId(null);
    }
  };

  // 일괄 입고 행 조작
  const handleAddBatchRow = () => {
    const usedIds = new Set(batchRows.map((r) => r.souvenirId));
    const nextItem = items.find((it) => !usedIds.has(String(it.id))) || items[0];
    setBatchRows((prev) => [...prev, createEmptyBatchRow(nextItem?.id ?? "")]);
  };

  const handleRemoveBatchRow = (rowId) => {
    setBatchRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  const handleBatchRowChange = (rowId, field, value) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)),
    );
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    // 같은 기념품을 여러 행에 선택했을 경우 수량 합산
    const totalsById = {};
    batchRows.forEach((row) => {
      const qty = Number(row.amount);
      if (!row.souvenirId || !Number.isFinite(qty) || qty <= 0) return;
      totalsById[row.souvenirId] = (totalsById[row.souvenirId] || 0) + Math.floor(qty);
    });

    const entries = Object.entries(totalsById);
    if (entries.length === 0) {
      setActionError("입고할 기념품과 1개 이상의 수량을 입력해 주세요.");
      return;
    }

    setBatchSubmitting(true);
    try {
      const results = await Promise.all(
        entries.map(async ([souvenirId, amount]) => {
          const updated = await updateSouvenirStockApi(Number(souvenirId), amount);
          return { id: Number(souvenirId), stockCount: updated.stockCount };
        }),
      );

      const updatedMap = Object.fromEntries(results.map((r) => [r.id, r.stockCount]));
      setItems((prev) =>
        prev.map((item) =>
          updatedMap[item.id] != null ? { ...item, stockCount: updatedMap[item.id] } : item,
        ),
      );
      setBatchRows([createEmptyBatchRow(items[0]?.id ?? "")]);
      setIsBatchOpen(false);
      setActionMessage(`${entries.length}개 품목의 입고 재고가 반영되었어요.`);
    } catch (err) {
      setActionError(getErrorMessage(err, "일괄 입고 처리 중 오류가 발생했어요."));
    } finally {
      setBatchSubmitting(false);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div>
          <h2 style={{ color: "#202522", marginTop: 0, marginBottom: "6px" }}>[직원 전용] 창고 기념품 및 재고 관리</h2>
          <p style={{ color: "#69716c", margin: 0 }}>
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsBatchOpen((prev) => !prev);
              setActionError("");
            }}
            style={{
              padding: "10px 16px",
              background: isBatchOpen ? "#69716c" : "#2c5f4c",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isBatchOpen ? "일괄 입고 닫기" : "+ 여러 품목 한 번에 입고"}
          </button>
        )}
      </div>

      {/* 여러 품목 일괄 입고 패널 */}
      {isBatchOpen && (
        <form
          onSubmit={handleBatchSubmit}
          style={{
            background: "#fff",
            border: "1.5px solid #2c5f4c",
            borderRadius: "10px",
            padding: "18px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: "bold", color: "#202522", marginBottom: "4px" }}>기념품 일괄 입고</div>
          <div style={{ fontSize: "13px", color: "#69716c", marginBottom: "12px" }}>
          </div>

          <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
            {batchRows.map((row, idx) => (
              <div
                key={row.rowId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 36px",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <select
                  aria-label={`입고 품목 ${idx + 1}`}
                  value={row.souvenirId}
                  onChange={(e) => handleBatchRowChange(row.rowId, "souvenirId", e.target.value)}
                  disabled={batchSubmitting}
                  style={{
                    padding: "9px 10px",
                    border: "1px solid #d5d7cf",
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#202522",
                  }}
                >
                  <option value="">기념품 선택</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (현재 {it.stockCount}개)
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    aria-label={`입고 수량 ${idx + 1}`}
                    value={row.amount}
                    onChange={(e) => handleBatchRowChange(row.rowId, "amount", e.target.value)}
                    disabled={batchSubmitting}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      border: "1px solid #d5d7cf",
                      borderRadius: "8px",
                      textAlign: "right",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#4f5752" }}>개</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBatchRow(row.rowId)}
                  disabled={batchSubmitting || batchRows.length === 1}
                  title="행 삭제"
                  aria-label="행 삭제"
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "1px solid #e6e7e1",
                    borderRadius: "8px",
                    background: "#fafaf7",
                    color: "#69716c",
                    cursor: batchRows.length === 1 ? "default" : "pointer",
                    opacity: batchRows.length === 1 ? 0.4 : 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleAddBatchRow}
              disabled={batchSubmitting}
              style={{
                padding: "8px 14px",
                border: "1px dashed #2c5f4c",
                borderRadius: "8px",
                background: "#f4f8f6",
                color: "#2c5f4c",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              + 품목 줄 추가
            </button>

            <button
              type="submit"
              disabled={batchSubmitting}
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#2c5f4c",
                color: "#fff",
                fontWeight: "bold",
                cursor: batchSubmitting ? "default" : "pointer",
                opacity: batchSubmitting ? 0.6 : 1,
              }}
            >
              {batchSubmitting ? "입고 반영 중..." : `선택한 ${batchRows.length}개 항목 일괄 입고`}
            </button>
          </div>
        </form>
      )}

      {loadError && <div role="alert" style={{ color: "#99575b", marginBottom: "12px" }}>{loadError}</div>}
      {actionError && <div role="alert" style={{ color: "#b91c1c", marginBottom: "12px" }}>{actionError}</div>}
      {actionMessage && <div role="status" style={{ color: "#2c5f4c", fontWeight: "bold", marginBottom: "12px" }}>{actionMessage}</div>}
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