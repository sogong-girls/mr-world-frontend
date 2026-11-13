// src/pages/TourManagePage.jsx
import { useEffect, useState } from "react";
import { getToursApi } from "../api/tours";
import LoadingIndicator from "../components/LoadingIndicator";

const THEME_TABS = [
  { code: "ALL", label: "전체" },
  { code: "HONEYMOON", label: "HONEYMOON (허니문)" },
  { code: "PARENT", label: "PARENT (효도)" },
  { code: "GOLF", label: "GOLF (골프)" },
  { code: "TREKKING", label: "TREKKING (트레킹)" },
];

const TourManagePage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemeFilter, setSelectedThemeFilter] = useState("ALL");
  const [selectedTour, setSelectedTour] = useState(null);

  // 신규 등록 폼 상태
  const [name, setName] = useState("");
  const [tourTheme, setTourTheme] = useState("HONEYMOON");
  const [departure, setDeparture] = useState("서울");
  const [destination, setDestination] = useState("");
  const [basePrice, setBasePrice] = useState(2500000);
  const [course, setCourse] = useState("");
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
      id: tours.length + 1,
      name,
      tourTheme,
      departure,
      destination,
      course: course || `${departure} → ${destination}`,
      basePrice: Number(basePrice),
      styles: [{ id: Date.now(), type: "CLASSIC", basePrice: Number(basePrice), description: "기본 패키지" }],
      description,
    };

    setTours((prev) => [...prev, newTour]);
    setSelectedTour(newTour);
    alert(`[${name}] 신규 투어 상품이 등록되었습니다.`);

    setName("");
    setDestination("");
    setCourse("");
    setDescription("");
  };

  const filteredTours =
    selectedThemeFilter === "ALL"
      ? tours
      : tours.filter((t) => (t.tourTheme || t.theme) === selectedThemeFilter);

  if (loading) return <LoadingIndicator text="투어 목록을 불러오는 중" />;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 테마 투어 상품 관리</h2>

      {/* 신규 투어 등록 폼 */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e7e1", marginBottom: "30px" }}>
        <h3 style={{ marginTop: 0, color: "#2c5f4c" }}>신규 투어 패키지 등록</h3>
        <form onSubmit={handleAddTour} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>투어 상품명</label>
            <input
              type="text"
              placeholder="예: 크루즈 투어"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>테마 카테고리</label>
            <select
              value={tourTheme}
              onChange={(e) => setTourTheme(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="HONEYMOON">HONEYMOON (허니문)</option>
              <option value="PARENT">PARENT (효도 힐링)</option>
              <option value="GOLF">GOLF (골프 리조트)</option>
              <option value="TREKKING">TREKKING (아웃도어 트레킹)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>출발지 ➔ 도착지</label>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <input
                type="text"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                style={{ width: "45%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <span>➔</span>
              <input
                type="text"
                placeholder="목적지 (예: 스위스)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: "45%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>기본 1인 가격 (원)</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>상세 코스</label>
            <input
              type="text"
              placeholder="예: 파리 -> 로마 -> 베네치아"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" }}>상품 설명</label>
            <textarea
              rows="2"
              placeholder="투어 코스 및 포함 사항 요약 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <button type="submit" style={{ padding: "10px 20px", background: "#2c5f4c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
              + 신규 투어 상품 추가
            </button>
          </div>
        </form>
      </div>

      {/* 등록된 투어 목록 및 테마 필터 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
        <h3 style={{ color: "#202522", margin: 0 }}>
          현재 등록된 투어 목록 ({filteredTours.length}개)
        </h3>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {THEME_TABS.map((tab) => {
            const active = selectedThemeFilter === tab.code;
            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => setSelectedThemeFilter(tab.code)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: active ? "1px solid #2c5f4c" : "1px solid #d5d8d0",
                  background: active ? "#2c5f4c" : "#fff",
                  color: active ? "#fff" : "#4f5752",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#69716c", margin: "0 0 10px 0" }}>
        * 아래 목록에서 <strong>투어 상품명</strong>을 클릭하면 상세 구성(코스, 등급별 가격, 숙소·식사 옵션)을 확인할 수 있습니다.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e6e7e1" }}>
        <thead>
          <tr style={{ background: "#202522", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>테마</th>
            <th style={{ padding: "10px" }}>상품명 (클릭하여 상세 보기)</th>
            <th style={{ padding: "10px" }}>노선</th>
            <th style={{ padding: "10px" }}>기본가</th>
          </tr>
        </thead>
        <tbody>
          {filteredTours.map((t) => {
            const displayPrice = t.styles?.[0]?.basePrice ?? t.basePrice ?? 0;
            const themeName = t.tourTheme || t.theme;
            const isSelected = String(selectedTour?.id) === String(t.id);

            return (
              <tr
                key={t.id}
                onClick={() => setSelectedTour(isSelected ? null : t)}
                style={{
                  borderBottom: "1px solid #eee",
                  background: isSelected ? "#eef5f1" : "#fff",
                  cursor: "pointer",
                }}
              >
 <td style={{ padding: "10px" }}>{t.id}</td>
                <td style={{ padding: "10px" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedThemeFilter((prev) => (prev === themeName ? "ALL" : themeName));
                    }}
                    title="해당 테마만 필터링"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#2c5f4c",
                      fontSize: "13px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {themeName}
                  </button>
                </td>
                <td style={{ padding: "10px", fontWeight: "bold", color: "#2c5f4c", textDecoration: "underline" }}>
                  {t.name}
                </td>
                <td style={{ padding: "10px" }}>{t.departure} ➔ {t.destination}</td>
                <td style={{ padding: "10px" }}>{Number(displayPrice).toLocaleString()}원</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 선택한 투어 상품 상세 보기 패널 */}
      {selectedTour && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#fff",
            border: "1.5px solid #2c5f4c",
            borderRadius: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#2c5f4c", background: "#eef5f1", padding: "3px 8px", borderRadius: "6px" }}>
                {selectedTour.tourTheme || selectedTour.theme}
              </span>
              <h3 style={{ margin: "8px 0 4px 0", color: "#202522" }}>{selectedTour.name}</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#69716c" }}>{selectedTour.description || "등록된 설명이 없습니다."}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTour(null)}
              style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
            >
              닫기 ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "13px", background: "#fafaf7", padding: "14px", borderRadius: "8px" }}>
            <div>
              <strong>노선:</strong> {selectedTour.departure} ➔ {selectedTour.destination}
            </div>
            <div>
              <strong>코스:</strong> {selectedTour.course || "-"}
            </div>
            <div>
              <strong>일정:</strong>{" "}
              {selectedTour.nights != null && selectedTour.days != null
                ? `${selectedTour.nights}박 ${selectedTour.days}일`
                : "상세 일정 문의"}
            </div>
            <div>
              <strong>기본가 (1인):</strong>{" "}
              {Number(selectedTour.styles?.[0]?.basePrice ?? selectedTour.basePrice ?? 0).toLocaleString()}원
            </div>
          </div>

          {Array.isArray(selectedTour.styles) && selectedTour.styles.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <strong style={{ fontSize: "13px", color: "#202522" }}>등급별 요금 구성</strong>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px", fontSize: "13px", color: "#4f5752" }}>
                {selectedTour.styles.map((s) => (
                  <li key={s.id}>
                    <strong>{s.type}</strong>: {Number(s.basePrice).toLocaleString()}원 {s.description ? `(${s.description})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(selectedTour.hotelOptions) && selectedTour.hotelOptions.length > 0 && (
            <div style={{ marginTop: "12px", fontSize: "13px", color: "#4f5752" }}>
              <strong>숙소 옵션:</strong>{" "}
              {selectedTour.hotelOptions.map((h) => `${h.name} (+${Number(h.price || 0).toLocaleString()}원)`).join(" / ")}
            </div>
          )}

          {Array.isArray(selectedTour.foodOptions) && selectedTour.foodOptions.length > 0 && (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "#4f5752" }}>
              <strong>식사 옵션:</strong>{" "}
              {selectedTour.foodOptions.map((f) => `${f.name} (+${Number(f.price || 0).toLocaleString()}원)`).join(" / ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TourManagePage;