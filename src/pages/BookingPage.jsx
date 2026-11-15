// src/pages/BookingPage.jsx (UC-04 Book Tour, UC-05 Customize Tour Options)
// - AI 상담에서 만든 draft가 같은 투어면 그 값으로 폼을 채운다 (draft 모양 = 예약 요청 모양)
// - 금액은 POST /api/tours/{id}/price 결과를 그대로 보여 준다
// - [예약하기]는 결제 없이 예약만 한다. 응답 status로 신청대기/확정을 안내한다.
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { calculateTourPriceApi, getTourDetailApi } from "../api/tours";
import { createBookingApi } from "../api/bookings";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/useAuth";
import { useAiChat } from "../context/useAiChat";
import LoadingIndicator from "../components/LoadingIndicator";
import {
  ADDON_LABELS,
  BOOKING_STATUS,
  FOOD_TYPE_LABELS,
  FOOD_TYPE_RANK,
  GRAND_ONLY_THEMES,
  HOTEL_GRADE_LABELS,
  HOTEL_GRADE_RANK,
  MAXIMUM_N_PEOPLE,
  MEALS,
  MEAL_LABELS,
  STYLE_GRADE,
  STYLE_LABELS,
  THEME_LABELS,
  TRANSPORT_LABELS,
  minParticipants,
  minPeopleNotice,
} from "../constants";
import {
  addDaysYmd,
  formatDateTime,
  formatWon,
  todayYmd,
  tourEndAt,
  tourStartAt,
} from "../utils/format";

const addonKey = (a) => `${a.addonOptionId}-${a.nthDay}-${a.meal}`;
const sortAddons = (addons) =>
  [...addons].sort(
    (a, b) => a.nthDay - b.nthDay || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal) || a.addonOptionId - b.addonOptionId,
  );

// 고른 등급의 스타일보다 높은 호텔·식사만 추가 요금이 붙는다 (안내용 표시, 금액 계산은 백엔드)
const extraLabel = (rank, styleGrade, price) =>
  rank > styleGrade && price > 0 ? `+${formatWon(price)} / 1인` : "추가 요금 없음";

// 폼 값 → 예약 요청(BookingCreateRequest) = AI draft 모양
const toBookingRequest = (tour, form) => ({
  tourId: tour.id,
  tourStyleId: form.styleId,
  hotelOptionId: form.hotelId,
  foodOptionId: form.foodId,
  participantsCount: form.participantsCount,
  startAt: form.startDate ? tourStartAt(form.startDate, tour) : null,
  endAt: form.startDate ? tourEndAt(form.startDate, tour) : null,
  bookingAddons: form.addons,
});

// AI draft가 같은 투어면 그 값으로, 아니면 스타일 기본값으로 시작한다
const initialForm = (tour, styles, draft) => {
  const fromDraft = draft?.tourId === tour.id ? draft : null;
  const style = styles.find((s) => s.id === fromDraft?.tourStyleId) || styles[0];
  const pick = (options, id, fallbackId) =>
    options.find((o) => o.id === id)?.id ?? options.find((o) => o.id === fallbackId)?.id ?? options[0]?.id ?? null;
  const addonIds = new Set((tour.addonOptions || []).map((a) => a.id));
  return {
    tourId: tour.id,
    styleId: style?.id ?? null,
    hotelId: pick(tour.hotelOptions || [], fromDraft?.hotelOptionId, style?.hotelOptionId),
    foodId: pick(tour.foodOptions || [], fromDraft?.foodOptionId, style?.foodOptionId),
    participantsCount: fromDraft?.participantsCount ?? 2,
    startDate: fromDraft?.startAt?.slice(0, 10) ?? addDaysYmd(todayYmd(), 14),
    addons: sortAddons(
      (fromDraft?.bookingAddons || []).filter(
        (a) => addonIds.has(a.addonOptionId) && a.nthDay >= 1 && a.nthDay <= tour.days,
      ),
    ),
    fromAi: Boolean(fromDraft),
  };
};

const labelStyle = { fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" };
const selectStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff" };

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const tourId = searchParams.get("tourId");
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { draft, syncDraftFromForm, resetChat, reloadMyBookings } = useAiChat();

  const [tourState, setTourState] = useState({ id: null, tour: null, error: "" });
  const [form, setForm] = useState(null);
  const [priceState, setPriceState] = useState({ key: null, price: null, error: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [peopleText, setPeopleText] = useState(null); // 인원 칸을 비워 둔 동안만 ""

  useEffect(() => {
    if (!tourId) return undefined;
    let active = true;
    getTourDetailApi(tourId)
      .then((tour) => {
        if (active) setTourState({ id: tourId, tour, error: "" });
      })
      .catch((error) => {
        if (active) {
          setTourState({ id: tourId, tour: null, error: getErrorMessage(error, "투어 정보를 불러오지 못했어요.") });
        }
      });
    return () => {
      active = false;
    };
  }, [tourId]);

  const tour = tourState.id === tourId ? tourState.tour : null;
  const loadError = tourState.id === tourId ? tourState.error : "";

  const styles = useMemo(() => {
    if (!tour) return [];
    const allowed = (tour.styles || []).filter(
      (s) => !(GRAND_ONLY_THEMES.includes(tour.tourTheme) && s.type === "CLASSIC"),
    );
    return allowed.sort((a, b) => STYLE_GRADE[a.type] - STYLE_GRADE[b.type]);
  }, [tour]);

  const current = useMemo(() => {
    if (!tour) return null;
    return form?.tourId === tour.id ? form : initialForm(tour, styles, draft);
  }, [tour, form, styles, draft]);

  // ----- 금액: 옵션이 바뀌면 백엔드에 계산을 맡긴다 -----
  const priceKey =
    tour && current?.styleId && current.hotelId && current.foodId
      ? JSON.stringify([
          tour.id,
          {
            tourStyleId: current.styleId,
            hotelOptionId: current.hotelId,
            foodOptionId: current.foodId,
            participantsCount: current.participantsCount,
            addonOptions: current.addons,
          },
        ])
      : null;

  useEffect(() => {
    if (!priceKey) return undefined;
    let active = true;
    const [id, body] = JSON.parse(priceKey);
    const timer = setTimeout(() => {
      calculateTourPriceApi(id, body)
        .then((price) => {
          if (active) setPriceState({ key: priceKey, price, error: "" });
        })
        .catch((error) => {
          if (active) setPriceState({ key: priceKey, price: null, error: getErrorMessage(error, "금액을 계산하지 못했어요.") });
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [priceKey]);

  if (!tourId) return <Navigate to="/" replace />;
  if (loadError) {
    return (
      <div style={{ maxWidth: "800px", margin: "24px auto", padding: "20px", color: "#99575b" }}>
        {loadError}
        <div style={{ marginTop: "12px" }}>
          <button type="button" className="button button-secondary" onClick={() => navigate("/")}>
            투어 목록으로
          </button>
        </div>
      </div>
    );
  }
  if (!tour || !current) return <LoadingIndicator text="투어 정보를 불러오는 중" />;

  const hotelOptions = [...(tour.hotelOptions || [])].sort((a, b) => HOTEL_GRADE_RANK[a.grade] - HOTEL_GRADE_RANK[b.grade]);
  const foodOptions = [...(tour.foodOptions || [])].sort((a, b) => FOOD_TYPE_RANK[a.type] - FOOD_TYPE_RANK[b.type]);
  const addonOptions = tour.addonOptions || [];
  const activeStyle = styles.find((s) => s.id === current.styleId);
  const styleGrade = STYLE_GRADE[activeStyle?.type] ?? 3;
  const minimum = minParticipants(tour.tourTheme);
  const days = Array.from({ length: Math.max(1, Number(tour.days) || 1) }, (_, i) => i + 1);
  const request = toBookingRequest(tour, current);

  const priceLoading = priceKey && priceState.key !== priceKey;
  const price = priceState.price;
  const priceError = priceState.key === priceKey ? priceState.error : "";

  const edit = (changes, touchedFields) => {
    const next = { ...current, ...changes };
    setForm(next);
    setFormError("");
    syncDraftFromForm(toBookingRequest(tour, next), touchedFields);
  };

  const changeStyle = (style) =>
    edit(
      {
        styleId: style.id,
        hotelId: style.hotelOptionId ?? current.hotelId,
        foodId: style.foodOptionId ?? current.foodId,
      },
      ["tourStyleId"],
    );

  const toggleAddon = (addonOptionId, nthDay, meal) => {
    const key = addonKey({ addonOptionId, nthDay, meal });
    const exists = current.addons.some((a) => addonKey(a) === key);
    const addons = exists
      ? current.addons.filter((a) => addonKey(a) !== key)
      : sortAddons([...current.addons, { addonOptionId, nthDay, meal }]);
    edit({ addons }, ["bookingAddons"]);
  };

  // 입력하는 동안에는 칸을 비울 수 있게 두고(예: "1"을 지우고 "5" 입력), 칸을 벗어날 때 1명 이상으로 맞춘다
  const changePeople = (value) => {
    const digits = value.replace(/[^0-9]/g, "");
    if (digits === "") {
      setPeopleText("");
      return;
    }
    setPeopleText(null);
    edit({ participantsCount: Math.min(MAXIMUM_N_PEOPLE, Math.max(1, Number(digits))) }, ["participantsCount"]);
  };
  const fixPeopleOnBlur = () => {
    if (peopleText === "") {
      setPeopleText(null);
      edit({ participantsCount: 1 }, ["participantsCount"]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("예약하려면 로그인이 필요해요.");
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (!current.startDate || current.startDate < todayYmd()) {
      setFormError("출발일은 오늘 이후 날짜로 골라 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBookingApi(request);
      reloadMyBookings();
      if (draft?.tourId === tour.id) resetChat(); // AI 상담으로 만든 예약이면 대화를 새로 시작

      if (created?.status === "CONFIRMED") {
        alert(`[${tour.name}] 예약이 ${BOOKING_STATUS.CONFIRMED.label}됐어요.\n24시간 안에 결제해 주세요.`);
        navigate(`/payment?bookingId=${created.id}`);
      } else {
        alert(
          `[${tour.name}] 예약 신청이 접수됐어요 (${BOOKING_STATUS.PENDING.label}).\n` +
            // 이미 최소 인원 이상인데 신청대기면(백엔드 확정 기준이 다를 때) 인원 수를 말하지 않는다
            (current.participantsCount < minimum
              ? `같은 날짜에 함께 가는 인원이 ${minimum}명 이상 모이면 확정되고, 결제 안내 문자를 보내 드려요.`
              : "같은 날짜 인원이 모여 확정되면 결제 안내 문자를 보내 드려요."),
        );
        navigate("/past-tours");
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "예약 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <h2 style={{ color: "#222", marginTop: 0 }}>투어 예약 및 옵션 선택</h2>
      <div className="booking-tour-summary">
        <span className="booking-theme">{THEME_LABELS[tour.tourTheme] || tour.tourTheme}</span>
        <h3>{tour.name}</h3>
        <p>{tour.description}</p>
        <dl>
          <div><dt>여행지</dt><dd>{tour.departure} → {tour.destination}</dd></div>
          <div><dt>일정</dt><dd>{tour.nights}박 {tour.days}일 · 출발 {tour.departureTime?.slice(0, 5)} · 도착 {tour.arrivalTime?.slice(0, 5)}</dd></div>
          {tour.course && <div><dt>코스</dt><dd>{tour.course}</dd></div>}
          <div><dt>차량</dt><dd>{TRANSPORT_LABELS[tour.transportType] || tour.transportType || "-"} (투어마다 정해져 있어요)</dd></div>
        </dl>
      </div>

      {current.fromAi && (
        <div className="booking-ai-note">AI 상담에서 고른 내용으로 채워 두었어요. 확인하고 [예약하기]를 눌러 주세요.</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* 1. 여행 스타일 */}
        <div>
          <span style={labelStyle}>1. 여행 스타일</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {styles.map((style) => {
              const isSelected = style.id === current.styleId;
              return (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => changeStyle(style)}
                  aria-pressed={isSelected}
                  className={`booking-style-card${isSelected ? " is-selected" : ""}`}
                >
                  <strong>{STYLE_LABELS[style.type] || style.type}</strong>
                  <span className="booking-style-price">{formatWon(style.basePrice)} / 1인</span>
                  <span className="booking-style-desc">{style.description}</span>
                </button>
              );
            })}
          </div>
          {GRAND_ONLY_THEMES.includes(tour.tourTheme) && (
            <div className="booking-hint">{THEME_LABELS[tour.tourTheme]} 투어는 그랜드 이상만 고를 수 있어요.</div>
          )}
        </div>

        {/* 2. 호텔 */}
        <div>
          <label style={labelStyle} htmlFor="booking-hotel">2. 호텔</label>
          <select
            id="booking-hotel"
            value={current.hotelId ?? ""}
            onChange={(e) => edit({ hotelId: Number(e.target.value) }, ["hotelOptionId"])}
            style={selectStyle}
          >
            {hotelOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({HOTEL_GRADE_LABELS[h.grade] || h.grade}) · {extraLabel(HOTEL_GRADE_RANK[h.grade], styleGrade, h.price)}
              </option>
            ))}
          </select>
        </div>

        {/* 3. 식사 (예약 전체에 하나) */}
        <div>
          <label style={labelStyle} htmlFor="booking-food">3. 식사</label>
          <select
            id="booking-food"
            value={current.foodId ?? ""}
            onChange={(e) => edit({ foodId: Number(e.target.value) }, ["foodOptionId"])}
            style={selectStyle}
          >
            {foodOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({FOOD_TYPE_LABELS[f.type] || f.type}) · {extraLabel(FOOD_TYPE_RANK[f.type], styleGrade, f.price)}
              </option>
            ))}
          </select>
          <div className="booking-hint">
            식사 등급은 여행 전체에 하나예요. 스타일({STYLE_LABELS[activeStyle?.type]})보다 높은 호텔·식사를 고르면 추가 요금이 붙어요.
          </div>
        </div>

        {/* 4. 추가 옵션: 일차 × 끼니 */}
        {addonOptions.length > 0 && (
          <div>
            <span style={labelStyle}>4. 추가 옵션 (원하는 날·끼니에)</span>
            <div className="booking-hint" style={{ marginTop: 0, marginBottom: "8px" }}>
              {addonOptions.map((a) => `${ADDON_LABELS[a.type] || a.type} +${formatWon(a.price)}`).join(" · ")} (1인, 넣을 때마다)
            </div>
            <div className="addon-table-wrap">
              <table className="addon-table">
                <thead>
                  <tr>
                    <th scope="col">일차</th>
                    {MEALS.map((meal) => (
                      <th scope="col" key={meal}>{MEAL_LABELS[meal]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <th scope="row">{day}일차</th>
                      {MEALS.map((meal) => (
                        <td key={meal}>
                          <div className="addon-cell">
                            {addonOptions.map((option) => {
                              const on = current.addons.some(
                                (a) => a.addonOptionId === option.id && a.nthDay === day && a.meal === meal,
                              );
                              return (
                                <button
                                  type="button"
                                  key={option.id}
                                  className={`addon-chip${on ? " is-on" : ""}`}
                                  aria-pressed={on}
                                  aria-label={`${day}일차 ${MEAL_LABELS[meal]} ${ADDON_LABELS[option.type]}`}
                                  onClick={() => toggleAddon(option.id, day, meal)}
                                >
                                  {ADDON_LABELS[option.type] || option.type}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="addon-summary">
              <span>
                {current.addons.length > 0
                  ? `${current.addons.length}번 추가: ` +
                    current.addons
                      .map((a) => {
                        const option = addonOptions.find((o) => o.id === a.addonOptionId);
                        return `${a.nthDay}일차 ${MEAL_LABELS[a.meal]} ${ADDON_LABELS[option?.type] || ""}`;
                      })
                      .join(", ")
                  : "추가 옵션 없음"}
              </span>
              {current.addons.length > 0 && (
                <button type="button" className="addon-clear" onClick={() => edit({ addons: [] }, ["bookingAddons"])}>
                  모두 지우기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. 출발일 · 6. 인원 */}
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle} htmlFor="booking-date">5. 출발일</label>
            <input
              id="booking-date"
              type="date"
              value={current.startDate}
              min={todayYmd()}
              onChange={(e) => edit({ startDate: e.target.value }, ["startAt"])}
              required
              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            {request.startAt && (
              <div className="booking-hint">
                출발 {formatDateTime(request.startAt)} → 도착 {formatDateTime(request.endAt)}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle} htmlFor="booking-people">6. 인원</label>
            <input
              id="booking-people"
              type="number"
              min="1"
              max={MAXIMUM_N_PEOPLE}
              value={peopleText ?? current.participantsCount}
              onChange={(e) => changePeople(e.target.value)}
              onBlur={fixPeopleOnBlur}
              style={{ width: "100px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <div className="booking-hint">한 번에 최대 {MAXIMUM_N_PEOPLE}명까지 예약할 수 있어요.</div>
          </div>
        </div>

        {current.participantsCount < minimum && (
          <div className="booking-warning">
            {minimum}명 미만 예약은 <strong>{BOOKING_STATUS.PENDING.label}</strong>로 접수되고, 같은 날짜 신청 인원이 {minimum}명 이상이 되면 자동으로 확정돼요.{" "}
            {minPeopleNotice(minimum)}
          </div>
        )}

        {/* 금액 (백엔드 계산) */}
        <div className="booking-price">
          <h4>예상 결제 금액 {priceLoading && <small>계산 중...</small>}</h4>
          {priceError ? (
            <div style={{ color: "#99575b", fontSize: "14px" }}>{priceError}</div>
          ) : price ? (
            <>
              <div className="booking-price-row">
                <span>{STYLE_LABELS[activeStyle?.type]} · {current.participantsCount}명{current.addons.length > 0 ? ` · 추가 옵션 ${current.addons.length}번` : ""}</span>
                <span className={price.discountPrice > 0 ? "is-struck" : ""}>{formatWon(price.totalPrice)}</span>
              </div>
              {price.discountPrice > 0 && (
                <div className="booking-price-row is-discount">
                  <span>단골 할인</span>
                  <span>-{formatWon(price.discountPrice)}</span>
                </div>
              )}
              <hr />
              <div className="booking-price-total">
                <span>최종 금액</span>
                <span>{formatWon(price.finalPrice)}</span>
              </div>
            </>
          ) : (
            <div style={{ color: "#69716c", fontSize: "14px" }}>금액을 계산하고 있어요.</div>
          )}
        </div>

        {formError && <div className="booking-error" role="alert">{formError}</div>}

        <button type="submit" disabled={submitting || !current.styleId} className="booking-submit">
          {submitting ? "예약 요청 중..." : "예약하기"}
        </button>
        <div className="booking-hint" style={{ textAlign: "center", marginTop: "-12px" }}>
          [예약하기]는 결제 없이 예약만 해요. 예약이 확정되면 24시간 안에 결제해 주세요.
        </div>
      </form>
    </div>
  );
};

export default BookingPage;
