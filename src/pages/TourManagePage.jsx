import React, { useEffect, useState } from "react";
import { getToursApi } from "../api/tours";

const TourManagePage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // 신규 등록 폼 상태
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("HONEYMOON");
  const [departure, setDeparture] = useState("유럽");
  const [destination, setDestination] = useState("");
  const [basePrice, setBasePrice] = useState(25000000);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await getToursApi();
        setTours(data || []);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  const handleAddTour = (e) => {
    e.preventDefault();
    if (!name || !destination) {
      alert("투어 이름과 목적지를 입력해 주세요.");
      return;
    }

    const newTour = {
      id: String(tours.length + 1),
      name,
      theme,
      departure,
      destination,
      basePrice: Number(basePrice),
      description,
    };

    setTours([...tours, newTour]);
    alert(`[${name}] 신규 투어 상품이 등록되었습니다.`);
    
    // 폼 초기화
    setName("");
    setDestination("");
    setDescription("");
  };

  if (loading) return <div style={{ padding: 20 }}>투어 목록을 불러오는 중...</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>[직원 전용] 테마 투어 상품 관리</h2>
      
      {/* 신규 투어 등록 폼 */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "30px" }}>
        <h3 style={{ marginTop: 0, color: "#0f3460" }}>신규 투어 패키지 등록</h3>
        <form onSubmit={handleAddTour} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>투어 상품명</label>
            <input
              type="text"
              placeholder="예: 크루즈 투어"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>테마 카테고리</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="HONEYMOON">HONEYMOON (허니문)</option>
              <option value="PARENT">PARENT (효도 힐링)</option>
              <option value="GOLF">GOLF (골프 리조트)</option>
              <option value="TREKKING">TREKKING (아웃도어 트레킹)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>출발지 ➔ 도착지</label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                style={{ width: "45%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <span style={{ lineHeight: "35px" }}>➔</span>
              <input
                type="text"
                placeholder="목적지 (예: 스위스)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: "45%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>기본 1인 가격 (원)</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>상품 설명</label>
            <textarea
              rows="2"
              placeholder="투어 코스 및 포함 사항 요약 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <button type="submit" style={{ padding: "10px 20px", background: "#0f3460", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
              + 신규 투어 상품 추가
            </button>
          </div>
        </form>
      </div>

      {/* 등록된 투어 목록 */}
      <h3 style={{ color: "#1a1a2e" }}>현재 등록된 투어 목록 ({tours.length}개)</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ background: "#1a1a2e", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>테마</th>
            <th style={{ padding: "10px" }}>상품명</th>
            <th style={{ padding: "10px" }}>노선</th>
            <th style={{ padding: "10px" }}>기본가</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px" }}>{t.id}</td>
              <td style={{ padding: "10px", fontWeight: "bold", color: "#0f3460" }}>{t.theme}</td>
              <td style={{ padding: "10px" }}>{t.name}</td>
              <td style={{ padding: "10px" }}>{t.departure} ➔ {t.destination}</td>
              <td style={{ padding: "10px" }}>{t.basePrice?.toLocaleString()}원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TourManagePage;