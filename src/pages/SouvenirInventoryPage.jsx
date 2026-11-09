import React, { useState } from "react";

const INITIAL_INVENTORY = [
  { id: 1, name: "허니문 커플티 세트", category: "HONEYMOON", stock: 15, location: "A-1 창고" },
  { id: 2, name: "효도 건강 인삼세트", category: "PARENT", stock: 42, location: "B-3 창고" },
  { id: 3, name: "골프 프리미엄 골프 액세서리 세트", category: "GOLF", stock: 8, location: "A-2 창고" },
  { id: 4, name: "아웃도어 트레킹 기념 스카프 세트", category: "TREKKING", stock: 25, location: "C-1 창고" },
];

const SouvenirInventoryPage = () => {
  const [items, setItems] = useState(INITIAL_INVENTORY);

  const handleStockChange = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
      )
    );
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>[직원 전용] 창고 사은품 및 재고 관리</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>테마 투어별 사은품 및 물류 재고 수량을 실시간으로 관리합니다.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "8px", padding: "18px" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", background: "#eef2f7", color: "#0f3460", padding: "2px 6px", borderRadius: "4px" }}>
              {item.category}
            </span>
            <h4 style={{ margin: "10px 0 6px 0", color: "#111" }}>{item.name}</h4>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>위치: {item.location}</div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa", padding: "10px", borderRadius: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold" }}>현재 재고: {item.stock} 개</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  onClick={() => handleStockChange(item.id, -1)}
                  style={{ width: "30px", height: "30px", background: "#4587e9", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                >
                  -
                </button>
                <button
                  onClick={() => handleStockChange(item.id, 1)}
                  style={{ width: "30px", height: "30px", background: "#4587e9", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SouvenirInventoryPage;