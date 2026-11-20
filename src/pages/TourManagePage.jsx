// src/pages/TourManagePage.jsx (UC-07 Plan & Register, 직원)
// 등록: POST /api/admin/tours (TourCreateRequest). 스타일마다 호텔·식사가 하나씩 딸리고(등급은 스타일과 같아야 함), addon은 따로.
// 목록: GET /api/tours (가격 없음). 기본가와 상세 구성은 클릭할 때 GET /api/tours/{id}로 받는다.
import { useEffect, useState } from "react";
import { createTourApi, getTourDetailApi, getToursApi } from "../api/tours";
import { getSouvenirsApi } from "../api/souvenirs";
import { getErrorMessage } from "../api/errors";
import LoadingIndicator from "../components/LoadingIndicator";
import {
  ADDON_LABELS,
  ADDON_TYPES,
  FOOD_TYPE_LABELS,
  GRAND_ONLY_THEMES,
  HOTEL_GRADE_LABELS,
  STYLE_FOOD_TYPE,
  STYLE_GRADE,
  STYLE_HOTEL_GRADE,
  STYLE_LABELS,
  STYLE_TYPES,
  THEME_LABELS,
  TRANSPORT_LABELS,
  TRANSPORT_TYPES,
} from "../constants";
import { formatWon } from "../utils/format";

const THEME_TABS = [
  { code: "ALL", label: "전체" },
  { code: "HONEYMOON", label: "HONEYMOON (허니문)" },
  { code: "PARENT", label: "PARENT (효도)" },
  { code: "GOLF", label: "GOLF (골프)" },
  { code: "TREKKING", label: "TREKKING (트레킹)" },
];

const DEFAULT_FOOD_NAMES = { LUNCHBOX: "도시락", LOCAL_RESTAURANT: "현지식 레스토랑", PREMIUM_RESTAURANT: "스테이크 전문 고급 레스토랑" };

const emptyStyle = (type) => ({
  enabled: true,
  basePrice: "",
  discountPercent: "10",
  description: "",
  hotelName: `${HOTEL_GRADE_LABELS[STYLE_HOTEL_GRADE[type]]} 호텔`,
  hotelLocation: "",
  hotelPrice: "0",
  foodName: DEFAULT_FOOD_NAMES[STYLE_FOOD_TYPE[type]],
  foodPrice: "0",
});

const emptyForm = () => ({
  name: "",
  tourTheme: "HONEYMOON",
  departure: "서울",
  destination: "",
  transportType: "_2_PEOPLE_CAR",
  souvenirId: "",
  nights: "2",
  departureTime: "09:00",
  arrivalTime: "18:00",
  course: "",
  description: "",
  styles: {
    CLASSIC: { ...emptyStyle("CLASSIC"), enabled: false },
    GRAND: emptyStyle("GRAND"),
    PREMIUM: emptyStyle("PREMIUM"),
  },
  addons: {
    COFFEE: { enabled: true, price: "10000", description: "원하는 식사 때 커피 추가" },
    CHAMPAGNE: { enabled: true, price: "50000", description: "원하는 식사 때 샴페인 추가" },
  },
});

const toTime = (value) => (value.length === 5 ? `${value}:00` : value);
const toInt = (value) => Number.parseInt(value, 10);

// 입력 칸·라벨 모양은 front 10836ce(관리자 투어 추가 UI)를 따름
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "8px",
  border: "1px solid #d5d8d0",
  fontSize: "14px",
  background: "#fff",
  boxSizing: "border-box",
};
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "700", color: "#202522", marginBottom: "6px" };
const smallLabel = { display: "block", fontSize: "12px", color: "#4f5752", marginBottom: "3px" };

const TourManagePage = () => {
  const [tours, setTours] = useState([]);
  const [souvenirs, setSouvenirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState("ALL");
  const [selected, setSelected] = useState({ id: null, tour: null, error: "" });
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getToursApi()
      .then((data) => {
        if (active) {
          setTours(data || []);
          setListError("");
        }
      })
      .catch((err) => {
        if (active) setListError(getErrorMessage(err, "투어 목록을 불러오지 못했어요."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listVersion]);

  useEffect(() => {
    let active = true;
    getSouvenirsApi()
      .then((data) => {
        if (active) setSouvenirs(data || []);
      })
      .catch(() => {}); // 기념품은 선택 항목이라 못 받아도 등록은 할 수 있다
    return () => {
      active = false;
    };
  }, []);

  const openTour = (id) => {
    if (selected.id === id) {
      setSelected({ id: null, tour: null, error: "" });
      return;
    }
    setSelected({ id, tour: null, error: "" });
    getTourDetailApi(id)
      .then((tour) => setSelected((prev) => (prev.id === id ? { id, tour, error: "" } : prev)))
      .catch((err) =>
        setSelected((prev) => (prev.id === id ? { id, tour: null, error: getErrorMessage(err, "상세 정보를 불러오지 못했어요.") } : prev)),
      );
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setStyleField = (type, field, value) =>
    setForm((prev) => ({ ...prev, styles: { ...prev.styles, [type]: { ...prev.styles[type], [field]: value } } }));
  const setAddonField = (type, field, value) =>
    setForm((prev) => ({ ...prev, addons: { ...prev.addons, [type]: { ...prev.addons[type], [field]: value } } }));

  const changeTheme = (tourTheme) =>
    setForm((prev) => ({
      ...prev,
      tourTheme,
      transportType: tourTheme === "HONEYMOON" ? "_2_PEOPLE_CAR" : "_10_PEOPLE_CAR",
      styles: GRAND_ONLY_THEMES.includes(tourTheme)
        ? { ...prev.styles, CLASSIC: { ...prev.styles.CLASSIC, enabled: false } }
        : prev.styles,
    }));

  const buildRequest = () => {
    const nights = toInt(form.nights);
    const enabledStyles = STYLE_TYPES.filter((type) => form.styles[type].enabled);
    if (!form.name.trim() || !form.destination.trim()) return { error: "투어 이름과 여행지를 입력해 주세요." };
    if (!Number.isInteger(nights) || nights < 0) return { error: "박 수를 0 이상 숫자로 입력해 주세요." };
    if (enabledStyles.length === 0) return { error: "스타일을 하나 이상 골라 주세요." };
    if (ADDON_TYPES.some((type) => form.addons[type].enabled && !(toInt(form.addons[type].price) >= 0))) {
      return { error: "추가 옵션 가격은 0 이상 숫자로 입력해 주세요." };
    }
    for (const type of enabledStyles) {
      const style = form.styles[type];
      if (!(toInt(style.basePrice) > 0)) return { error: `${STYLE_LABELS[type]} 기본가를 입력해 주세요.` };
      if (!style.hotelName.trim() || !style.foodName.trim()) return { error: `${STYLE_LABELS[type]}의 호텔·식사 이름을 입력해 주세요.` };
      if (toInt(style.hotelPrice || "0") < 0 || toInt(style.foodPrice || "0") < 0) {
        return { error: `${STYLE_LABELS[type]}의 추가금은 0 이상으로 입력해 주세요.` };
      }
      const percent = Number(style.discountPercent || 0);
      if (percent < 0 || percent > 100) return { error: "단골 할인율은 0~100% 사이로 입력해 주세요." };
    }

    return {
      request: {
        name: form.name.trim(),
        departure: form.departure.trim(),
        destination: form.destination.trim(),
        tourTheme: form.tourTheme,
        transportType: form.transportType,
        ...(form.souvenirId ? { souvenirId: Number(form.souvenirId) } : {}),
        nights,
        days: nights + 1,
        departureTime: toTime(form.departureTime),
        arrivalTime: toTime(form.arrivalTime),
        course: form.course.trim(),
        description: form.description.trim(),
        tourStyles: enabledStyles.map((type) => {
          const style = form.styles[type];
          return {
            type,
            basePrice: toInt(style.basePrice),
            regularDiscount: Number(style.discountPercent || 0) / 100,
            description: style.description.trim(),
            hotelOption: {
              name: style.hotelName.trim(),
              location: style.hotelLocation.trim() || form.destination.trim(),
              grade: STYLE_HOTEL_GRADE[type],
              price: toInt(style.hotelPrice) || 0,
            },
            foodOption: {
              name: style.foodName.trim(),
              type: STYLE_FOOD_TYPE[type],
              price: toInt(style.foodPrice) || 0,
            },
          };
        }),
        addonOptions: ADDON_TYPES.filter((type) => form.addons[type].enabled).map((type) => ({
          type,
          price: toInt(form.addons[type].price) || 0,
          description: form.addons[type].description.trim(),
        })),
      },
    };
  };

  const handleAddTour = async (e) => {
    e.preventDefault();
    const { request, error } = buildRequest();
    if (error) {
      setFormError(error);
      return;
    }
    setSubmitting(true);
    setFormError("");
    setSubmitMessage("");
    try {
      const created = await createTourApi(request);
      setSubmitMessage(`[${created?.name || request.name}] 투어가 서버에 등록되었습니다.`);
      setForm(emptyForm());
      setListVersion((v) => v + 1);
    } catch (err) {
      setFormError(getErrorMessage(err, "투어를 등록하지 못했어요."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTours =
    selectedThemeFilter === "ALL" ? tours : tours.filter((t) => t.tourTheme === selectedThemeFilter);
  const detail = selected.tour;

  if (loading) return <LoadingIndicator text="투어 목록을 불러오는 중" />;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#202522", marginTop: 0 }}>[직원 전용] 테마 투어 상품 관리</h2>

      {/* 신규 투어 등록 */}
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
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px", color: "#2c5f4c" }}>신규 투어 패키지 등록</h3>
        <form onSubmit={handleAddTour} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {formError && (
            <div role="alert" style={{ color: "#b42318", fontSize: "14px" }}>
              {formError}
            </div>
          )}
          {submitMessage && (
            <div role="status" style={{ color: "#2c5f4c", fontSize: "14px" }}>
              {submitMessage}
            </div>
          )}
          <div>
            <label style={labelStyle} htmlFor="tour-name">투어 상품명</label>
            <input id="tour-name" type="text" placeholder="예: 크루즈 투어" value={form.name} onChange={(e) => setField("name", e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle} htmlFor="tour-theme">테마 카테고리</label>
            <select id="tour-theme" value={form.tourTheme} onChange={(e) => changeTheme(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="HONEYMOON">HONEYMOON (허니문)</option>
              <option value="PARENT">PARENT (효도 힐링)</option>
              <option value="GOLF">GOLF (골프 리조트)</option>
              <option value="TREKKING">TREKKING (아웃도어 트레킹)</option>
            </select>
          </div>

          <div>
            <span style={labelStyle}>출발지 ➔ 도착지</span>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input type="text" aria-label="출발지" value={form.departure} onChange={(e) => setField("departure", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontWeight: "bold", color: "#69716c" }}>➔</span>
              <input type="text" aria-label="여행지" placeholder="목적지 (예: 스위스)" value={form.destination} onChange={(e) => setField("destination", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="tour-transport">차량 (고객은 바꿀 수 없음)</label>
            <select id="tour-transport" value={form.transportType} onChange={(e) => setField("transportType", e.target.value)} style={inputStyle}>
              {TRANSPORT_TYPES.map((type) => (
                <option key={type} value={type}>{TRANSPORT_LABELS[type]}</option>
              ))}
            </select>
          </div>

          <div>
            <span style={labelStyle}>일정</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input type="number" min="0" aria-label="박 수" value={form.nights} onChange={(e) => setField("nights", e.target.value)} style={{ ...inputStyle, width: "80px" }} />
              <span style={{ fontSize: "13px", whiteSpace: "nowrap" }}>박 {Number.isInteger(toInt(form.nights)) ? toInt(form.nights) + 1 : "-"}일</span>
            </div>
          </div>

          <div>
            <span style={labelStyle}>출발 · 도착 시각</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input type="time" aria-label="출발 시각" value={form.departureTime} onChange={(e) => setField("departureTime", e.target.value)} style={inputStyle} required />
              <span>~</span>
              <input type="time" aria-label="도착 시각" value={form.arrivalTime} onChange={(e) => setField("arrivalTime", e.target.value)} style={inputStyle} required />
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="tour-souvenir">기념품</label>
            <select id="tour-souvenir" value={form.souvenirId} onChange={(e) => setField("souvenirId", e.target.value)} style={inputStyle}>
              <option value="">선택 안 함</option>
              {souvenirs.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (재고 {s.stockCount}개)</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle} htmlFor="tour-course">상세 코스</label>
            <input id="tour-course" type="text" placeholder="예: 파리 -> 로마 -> 베네치아" value={form.course} onChange={(e) => setField("course", e.target.value)} style={inputStyle} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle} htmlFor="tour-description">상품 설명</label>
            <textarea id="tour-description" rows="3" placeholder="투어 코스 및 포함 사항 요약 설명" value={form.description} onChange={(e) => setField("description", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* 스타일별 기본가 + 호텔 + 식사 */}
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>스타일별 구성 (호텔 등급·식사 종류는 스타일에 맞춰 정해져요)</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
              {STYLE_TYPES.map((type) => {
                const style = form.styles[type];
                const blocked = type === "CLASSIC" && GRAND_ONLY_THEMES.includes(form.tourTheme);
                return (
                  <fieldset key={type} disabled={blocked} style={{ border: "1px solid #e6e7e1", borderRadius: "8px", padding: "12px", opacity: style.enabled ? 1 : 0.6 }}>
                    <legend style={{ fontWeight: "bold", fontSize: "13px" }}>
                      <label>
                        <input type="checkbox" checked={style.enabled} onChange={(e) => setStyleField(type, "enabled", e.target.checked)} />{" "}
                        {STYLE_LABELS[type]} ({HOTEL_GRADE_LABELS[STYLE_HOTEL_GRADE[type]]} · {FOOD_TYPE_LABELS[STYLE_FOOD_TYPE[type]]})
                      </label>
                    </legend>
                    {blocked && <div style={{ fontSize: "12px", color: "#b45309", marginBottom: "6px" }}>{THEME_LABELS[form.tourTheme]} 투어는 그랜드 이상만 둘 수 있어요.</div>}
                    {style.enabled && (
                      <div style={{ display: "grid", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ flex: 2 }}>
                            <label style={smallLabel}>기본가 (1인, 원)</label>
                            <input type="number" min="0" value={style.basePrice} onChange={(e) => setStyleField(type, "basePrice", e.target.value)} style={inputStyle} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={smallLabel}>단골 할인 %</label>
                            <input type="number" min="0" max="100" value={style.discountPercent} onChange={(e) => setStyleField(type, "discountPercent", e.target.value)} style={inputStyle} />
                          </div>
                        </div>
                        <div>
                          <label style={smallLabel}>설명</label>
                          <input type="text" value={style.description} onChange={(e) => setStyleField(type, "description", e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ flex: 2 }}>
                            <label style={smallLabel}>호텔 이름</label>
                            <input type="text" value={style.hotelName} onChange={(e) => setStyleField(type, "hotelName", e.target.value)} style={inputStyle} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={smallLabel}>위치</label>
                            <input type="text" placeholder={form.destination || "여행지"} value={style.hotelLocation} onChange={(e) => setStyleField(type, "hotelLocation", e.target.value)} style={inputStyle} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ flex: 2 }}>
                            <label style={smallLabel}>식사 이름</label>
                            <input type="text" value={style.foodName} onChange={(e) => setStyleField(type, "foodName", e.target.value)} style={inputStyle} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ flex: 1 }}>
                            <label style={smallLabel}>호텔 업그레이드 추가금</label>
                            <input type="number" min="0" value={style.hotelPrice} onChange={(e) => setStyleField(type, "hotelPrice", e.target.value)} style={inputStyle} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={smallLabel}>식사 업그레이드 추가금</label>
                            <input type="number" min="0" value={style.foodPrice} onChange={(e) => setStyleField(type, "foodPrice", e.target.value)} style={inputStyle} />
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "#69716c" }}>
                          추가금은 더 낮은 스타일을 고른 고객이 이 호텔·식사로 올릴 때 1인당 붙어요.
                        </div>
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>
          </div>

          {/* 추가 옵션 */}
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>추가 옵션 (고객이 일차·끼니마다 넣음)</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
              {ADDON_TYPES.map((type) => {
                const addon = form.addons[type];
                return (
                  <div key={type} style={{ border: "1px solid #e6e7e1", borderRadius: "8px", padding: "10px", display: "grid", gap: "6px" }}>
                    <label style={{ fontWeight: "bold", fontSize: "13px" }}>
                      <input type="checkbox" checked={addon.enabled} onChange={(e) => setAddonField(type, "enabled", e.target.checked)} /> {ADDON_LABELS[type]}
                    </label>
                    {addon.enabled && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="number" min="0" aria-label={`${ADDON_LABELS[type]} 가격`} value={addon.price} onChange={(e) => setAddonField(type, "price", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                        <input type="text" aria-label={`${ADDON_LABELS[type]} 설명`} value={addon.description} onChange={(e) => setAddonField(type, "description", e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      {/* 등록된 투어 목록 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
        <h3 style={{ color: "#202522", margin: 0 }}>현재 등록된 투어 목록 ({filteredTours.length}개)</h3>
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
        * 투어를 누르면 상세 구성(차량, 시각, 스타일별 기본가, 호텔·식사·추가 옵션)을 불러와요.
      </p>

      {listError && <div role="alert" style={{ color: "#99575b", marginBottom: "10px" }}>{listError}</div>}

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e6e7e1" }}>
        <thead>
          <tr style={{ background: "#202522", color: "#fff", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>테마</th>
            <th style={{ padding: "10px" }}>상품명 (눌러서 상세 보기)</th>
            <th style={{ padding: "10px" }}>노선</th>
            <th style={{ padding: "10px" }}>일정</th>
          </tr>
        </thead>
        <tbody>
          {filteredTours.map((t) => {
            const isSelected = selected.id === t.id;
            return (
              <tr
                key={t.id}
                onClick={() => openTour(t.id)}
                style={{ borderBottom: "1px solid #eee", background: isSelected ? "#eef5f1" : "#fff", cursor: "pointer" }}
              >
                <td style={{ padding: "10px" }}>{t.id}</td>
                <td style={{ padding: "10px", color: "#2c5f4c", fontWeight: "bold", fontSize: "13px" }}>{THEME_LABELS[t.tourTheme] || t.tourTheme}</td>
                <td style={{ padding: "10px", fontWeight: "bold", color: "#2c5f4c", textDecoration: "underline" }}>{t.name}</td>
                <td style={{ padding: "10px" }}>{t.departure} → {t.destination}</td>
                <td style={{ padding: "10px" }}>{t.nights != null ? `${t.nights}박 ${t.days}일` : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 선택한 투어 상세 */}
      {selected.id && (
        <div style={{ marginTop: "20px", padding: "20px", background: "#fff", border: "1.5px solid #2c5f4c", borderRadius: "12px" }}>
          {selected.error ? (
            <div role="alert" style={{ color: "#99575b" }}>{selected.error}</div>
          ) : !detail ? (
            <LoadingIndicator text="상세 정보를 불러오는 중" />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#2c5f4c", background: "#eef5f1", padding: "3px 8px", borderRadius: "6px" }}>
                    {THEME_LABELS[detail.tourTheme] || detail.tourTheme}
                  </span>
                  <h3 style={{ margin: "8px 0 4px 0", color: "#202522" }}>{detail.name}</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#69716c" }}>{detail.description || "등록된 설명이 없습니다."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected({ id: null, tour: null, error: "" })}
                  style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                >
                  닫기 ✕
                </button>
              </div>


              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "13px", background: "#fafaf7", padding: "14px", borderRadius: "8px" }}>
                <div><strong>노선:</strong> {detail.departure} → {detail.destination}</div>
                <div><strong>코스:</strong> {detail.course || "-"}</div>
                <div><strong>일정:</strong> {detail.nights}박 {detail.days}일 · {detail.departureTime?.slice(0, 5)} 출발 · {detail.arrivalTime?.slice(0, 5)} 도착</div>
                <div><strong>차량:</strong> {TRANSPORT_LABELS[detail.transportType] || detail.transportType || "-"}</div>
                <div><strong>기념품:</strong> {detail.souvenir ? `${detail.souvenir.name} (재고 ${detail.souvenir.stockCount}개)` : "-"}</div>
              </div>

              <div style={{ marginTop: "14px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e6e7e1" }}>
                      <th style={{ padding: "6px" }}>스타일</th>
                      <th style={{ padding: "6px" }}>기본가 (1인)</th>
                      <th style={{ padding: "6px" }}>단골 할인</th>
                      <th style={{ padding: "6px" }}>기본 호텔</th>
                      <th style={{ padding: "6px" }}>기본 식사</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(detail.styles || [])]
                      .sort((a, b) => STYLE_GRADE[a.type] - STYLE_GRADE[b.type])
                      .map((s) => {
                        const hotel = detail.hotelOptions?.find((h) => h.id === s.hotelOptionId);
                        const food = detail.foodOptions?.find((f) => f.id === s.foodOptionId);
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f0f0ec" }}>
                            <td style={{ padding: "6px", fontWeight: "bold" }}>{STYLE_LABELS[s.type] || s.type}</td>
                            <td style={{ padding: "6px" }}>{formatWon(s.basePrice)}</td>
                            <td style={{ padding: "6px" }}>{s.regularDiscount != null ? `${Math.round(s.regularDiscount * 100)}%` : "-"}</td>
                            <td style={{ padding: "6px" }}>{hotel ? `${hotel.name} (추가 ${formatWon(hotel.price)})` : "-"}</td>
                            <td style={{ padding: "6px" }}>{food ? `${food.name} (추가 ${formatWon(food.price)})` : "-"}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {(detail.addonOptions || []).length > 0 && (
                <div style={{ marginTop: "10px", fontSize: "13px", color: "#4f5752" }}>
                  <strong>추가 옵션:</strong>{" "}
                  {detail.addonOptions.map((a) => `${ADDON_LABELS[a.type] || a.type} ${formatWon(a.price)}`).join(" / ")}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TourManagePage;
