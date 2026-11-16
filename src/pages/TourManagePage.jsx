// src/pages/TourManagePage.jsx
import { useEffect, useState } from "react";
import { getToursApi, createTourApi } from "../api/tours";
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
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

  const handleAddTour = async (e) => {
    e.preventDefault();
    if (!name.trim() || !destination.trim()) {
      setSubmitError("투어 이름과 목적지를 입력해 주세요.");
      setSubmitMessage("");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    const newTour = {
      id: tours.length + 1,
      name: name.trim(),
      tourTheme,
      departure: departure.trim(),
      destination: destination.trim(),
      course: course.trim() || `${departure.trim()} → ${destination.trim()}`,
      basePrice: Number(basePrice),
      styles: [{ id: Date.now(), type: "CLASSIC", basePrice: Number(basePrice), description: "기본 패키지" }],
      description: description.trim(),
    };

    try {
      const { tour: savedTour, persisted } = await createTourApi(newTour);
      setTours((prev) => [...prev, savedTour]);
      setSelectedTour(savedTour);
      setSubmitMessage(
        persisted
          ? `[${savedTour.name}] 투어가 서버에 등록되었습니다.`
          : `[${savedTour.name}] 서버에 연결할 수 없어 현재 브라우저 세션에만 저장했습니다. 서버 연결 후 다시 등록해 주세요.`
      );
      setName("");
      setDestination("");
      setCourse("");
      setDescription("");
    } catch (err) {
      console.error("Failed to create tour:", err);
      setSubmitError(err.response?.data?.message || "투어 등록에 실패했습니다. 입력값과 서버 상태를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
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
      <div
        style={{
          background: "#fff",
          padding: "26px 28px",
          borderRadius: "14px",
          border: "1px solid #e6e7e1",
          marginBottom: "30px",
          boxShadow: "0 6px 20px rgba(32, 37, 34, 0.04)",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px", color: "#2c5f4c" }}>
          신규 투어 패키지 등록
        </h3>

        <form onSubmit={handleAddTour} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {submitError && (
            <div role="alert" style={{ color: "#b42318", fontSize: "14px" }}>
              {submitError}
            </div>
          )}
          {submitMessage && (
            <div role="status" style={{ color: submitMessage.includes("세션에만") ? "#8a5a00" : "#2c5f4c", fontSize: "14px" }}>
              {submitMessage}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" }}>
              투어 상품명
            </label>
            <input
              type="text"
              placeholder="예: 크루즈 투어"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid #d5d8d0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" }}>
              테마 카테고리
            </label>
            <select
              value={tourTheme}
              onChange={(e) => setTourTheme(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid #d5d8d0",
                fontSize: "14px",
                background: "#fff",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            >
              <option value="HONEYMOON">HONEYMOON (허니문)</option>
              <option value="PARENT">PARENT (효도 힐링)</option>
              <option value="GOLF">GOLF (골프 리조트)</option>
              <option value="TREKKING">TREKKING (아웃도어 트레킹)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" }}>
              출발지 ➔ 도착지
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d5d8d0",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontWeight: "bold", color: "#69716c" }}>➔</span>
              <input
                type="text"
                placeholder="목적지 (예: 스위스)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d5d8d0",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" }}>
              기본 1인 가격 (원)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid #d5d8d0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" }}>
              상세 코스
            </label>
            <input
              type="text"
              placeholder="예: 파리 -> 로마 -> 베네치아"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid #d5d8d0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" }}>
              상품 설명
            </label>
            <textarea
              rows="3"
              placeholder="투어 코스 및 포함 사항 요약 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid #d5d8d0",
                fontSize: "14px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "4px",
              padding: "13px 20px",
              background: submitting ? "#8a9b91" : "#2c5f4c",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "투어 등록 중..." : "+ 신규 투어 상품 추가"}
          </button>
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