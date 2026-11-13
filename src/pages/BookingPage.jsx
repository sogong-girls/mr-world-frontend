// src/pages/BookingPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTourByIdApi } from "../api/tours";
import { createBookingApi } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import LoadingIndicator from "../components/LoadingIndicator";

const STYLE_TIER_RANK = {
  CLASSIC: 1,
  GRAND: 2,
  PREMIUM: 3,
};

const STYLE_LABELS = {
  CLASSIC: "클래식 (Classic)",
  GRAND: "그랜드 (Grand)",
  PREMIUM: "프리미엄 (Premium)",
};

const HOTEL_GRADE_RANK = {
  _3_STAR: 1,
  _4_STAR: 2,
  _5_STAR: 3,
};

const FOOD_TYPE_RANK = {
  LUNCHBOX: 1,
  LOCAL_RESTAURANT: 2,
  FINE_DINING: 3,
  PREMIUM_RESTAURANT: 3,
};

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const tourId = searchParams.get("tourId") || "1";
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [tour, setTour] = useState(null);
  const [selectedStyleId, setSelectedStyleId] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [participantsCount, setParticipantsCount] = useState(2);

  const handleParticipantsChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setParticipantsCount(0);
      return;
    }
    setParticipantsCount(Math.min(10, Number(raw)));
  };

  const handleParticipantsBlur = () => {
    if (!participantsCount || participantsCount < 1) {
      setParticipantsCount(1);
    }
  };

  const [startDate, setStartDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    return nextMonth.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const data = await getTourByIdApi(tourId);
        setTour(data);
        if (data?.styles?.length > 0) {
          const defaultStyle = data.styles[0];
          setSelectedStyleId(defaultStyle.id);
          setSelectedHotelId(defaultStyle.hotelOptionId ?? data.hotelOptions?.[0]?.id ?? null);
          setSelectedFoodId(defaultStyle.foodOptionId ?? data.foodOptions?.[0]?.id ?? null);
        } else {
          setSelectedHotelId(data?.hotelOptions?.[0]?.id ?? null);
          setSelectedFoodId(data?.foodOptions?.[0]?.id ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch tour:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  if (loading) return <LoadingIndicator text="투어 정보를 불러오는 중" />;
  if (!tour) return <div style={{ padding: 20, color: "#333" }}>존재하지 않는 투어 상품입니다.</div>;

  const styles = tour.styles || [];
  const hotelOptions = tour.hotelOptions || [];
  const foodOptions = tour.foodOptions || [];
  const addonOptions = tour.addonOptions || [];

  const activeStyle = styles.find((s) => String(s.id) === String(selectedStyleId)) || styles[0];
  const activeHotel = hotelOptions.find((h) => String(h.id) === String(selectedHotelId));
  const activeFood = foodOptions.find((f) => String(f.id) === String(selectedFoodId));

  const styleTier = STYLE_TIER_RANK[activeStyle?.type] || 1;
  const getHotelTier = (hotel) =>
    hotel?.tier ?? HOTEL_GRADE_RANK[hotel?.grade] ?? 1;
  const getFoodTier = (food) =>
    food?.tier ?? FOOD_TYPE_RANK[food?.type] ?? 1;

  // Backend rule: extra charge applies ONLY when option tier is strictly higher than base style tier
  const getHotelExtra = (hotel) => {
    if (!hotel) return 0;
    return getHotelTier(hotel) > styleTier ? Number(hotel.price || 0) : 0;
  };

  const getFoodExtra = (food) => {
    if (!food) return 0;
    return getFoodTier(food) > styleTier ? Number(food.price || 0) : 0;
  };

  const basePricePerPerson = Number(activeStyle?.basePrice ?? tour.basePrice ?? 1200000);
  const hotelExtraPerPerson = getHotelExtra(activeHotel);
  const foodExtraPerPerson = getFoodExtra(activeFood);
  const addonsPerPerson = addonOptions
    .filter((a) => selectedAddons.includes(a.type))
    .reduce((sum, a) => sum + Number(a.price || 0), 0);

  const subtotal =
    (basePricePerPerson + hotelExtraPerPerson + foodExtraPerPerson + addonsPerPerson) *
    participantsCount;

  const isVip = Boolean(user?.isRegular);
  const discountRate = activeStyle?.regularDiscount ?? 0.1;
  const discountAmount = isVip ? Math.round(subtotal * discountRate) : 0;
  const finalTotalPrice = subtotal - discountAmount;

  const handleStyleChange = (style) => {
    setSelectedStyleId(style.id);
    if (style.hotelOptionId != null && hotelOptions.some((h) => h.id === style.hotelOptionId)) {
      setSelectedHotelId(style.hotelOptionId);
    }
    if (style.foodOptionId != null && foodOptions.some((f) => f.id === style.foodOptionId)) {
      setSelectedFoodId(style.foodOptionId);
    }
  };

  const toggleAddon = (addonType) => {
    setSelectedAddons((prev) =>
      prev.includes(addonType) ? prev.filter((item) => item !== addonType) : [...prev, addonType]
    );
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("예약을 진행하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    const finalParticipantsCount = Math.max(1, Number(participantsCount) || 1);
    setParticipantsCount(finalParticipantsCount);

    try {
      const startIso = `${startDate}T${tour.departureTime || "09:00"}:00+09:00`;
      const endObj = new Date(startDate);
      endObj.setDate(endObj.getDate() + (Number(tour.days) || 3));
      const endIso = `${endObj.toISOString().split("T")[0]}T${tour.arrivalTime || "18:00"}:00+09:00`;

      const payload = {
        tourId: tour.id,
        tourStyleId: activeStyle?.id,
        hotelOptionId: activeHotel?.id ?? null,
        foodOptionId: activeFood?.id ?? null,
        participantsCount: finalParticipantsCount,
        startAt: startIso,
        endAt: endIso,
        bookingAddons: selectedAddons,
        totalPrice: finalTotalPrice,
      };

      const created = await createBookingApi(payload);
      const isPending = created?.status === "PENDING" || finalParticipantsCount < 3;

      alert(
        isPending
          ? `[${tour.name}] 예약 신청이 접수되었습니다!\n(현재 상태: PENDING — 3명 이상 모객 시 자동으로 CONFIRMED 확정됩니다.)`
          : `[${tour.name}] 예약 신청이 확정(CONFIRMED)되었습니다!\n내 여행 이력 또는 결제 페이지에서 결제를 완료해 주세요.`
      );
      navigate("/past-tours");
    } catch (err) {
      console.error("Failed to submit booking:", err);
      alert(err.response?.data?.message || "예약 신청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", background: "#fff", border: "1px solid #eee", borderRadius: "8px" }}>
      <h2 style={{ color: "#222", marginTop: 0 }}>투어 예약 및 옵션 선택</h2>
      <div style={{ background: "#f0f4f8", padding: "15px", borderRadius: "6px", marginBottom: "22px", border: "1px solid #eee" }}>
        <h3 style={{ margin: "0 0 6px 0", color: "#0f3460" }}>{tour.name}</h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>{tour.description}</p>
        {tour.course && (
          <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#666" }}>코스: {tour.course}</p>
        )}
      </div>

      <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Step 1: 여행 등급 선택 */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
            1. 여행 등급 (Style) 선택
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {styles.map((style) => {
              const isSelected = String(style.id) === String(activeStyle?.id);
              return (
                <div
                  key={style.id}
                  onClick={() => handleStyleChange(style)}
                  style={{
                    border: isSelected ? "2px solid #0f3460" : "1px solid #ccc",
                    background: isSelected ? "#eef2f7" : "#fff",
                    padding: "12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "14px", color: "#222" }}>
                    {STYLE_LABELS[style.type] || style.type}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f3460", marginTop: "4px" }}>
                    {Number(style.basePrice).toLocaleString()}원 / 1인
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{style.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: 숙소 옵션 */}
        {hotelOptions.length > 0 && (
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
              2. 숙소 옵션 선택
            </label>
            <select
              value={selectedHotelId ?? ""}
              onChange={(e) => setSelectedHotelId(Number(e.target.value))}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
            >
              {hotelOptions.map((h) => {
                const extra = getHotelExtra(h);
                return (
                  <option key={h.id} value={h.id}>
                    {h.name} ({extra > 0 ? `+${extra.toLocaleString()}원` : "추가금 0원 - 기본 포함"})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Step 3: 식사 옵션 */}
        {foodOptions.length > 0 && (
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
              3. 식사 업그레이드 옵션
            </label>
            <select
              value={selectedFoodId ?? ""}
              onChange={(e) => setSelectedFoodId(Number(e.target.value))}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
            >
              {foodOptions.map((f) => {
                const extra = getFoodExtra(f);
                return (
                  <option key={f.id} value={f.id}>
                    {f.name} ({extra > 0 ? `+${extra.toLocaleString()}원` : "추가금 0원 - 기본 포함"})
                  </option>
                );
              })}
            </select>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
              * 선택한 숙소·식사 등급이 기본 여행 등급({activeStyle?.type})보다 높을 때만 추가 요금이 적용됩니다.
            </div>
          </div>
        )}

        {/* Step 4: 추가 애드온 */}
        {addonOptions.length > 0 && (
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
              4. 선택 애드온 (1인 기준)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {addonOptions.map((addon) => {
                const checked = selectedAddons.includes(addon.type);
                return (
                  <label
                    key={addon.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      border: checked ? "1.5px solid #0f3460" : "1px solid #ccc",
                      borderRadius: "8px",
                      background: checked ? "#eef2f7" : "#fff",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddon(addon.type)}
                    />
                    <span>
                      {addon.description} (+{Number(addon.price).toLocaleString()}원)
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: 출발일 및 인원 수 */}
        <div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
                5. 출발 희망일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
                6. 인원 수 선택
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={String(participantsCount)}
                onChange={handleParticipantsChange}
                onBlur={handleParticipantsBlur}
                style={{ width: "100px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>
          </div>

          {participantsCount < 3 && (
            <div style={{ fontSize: "12px", color: "#b45309", marginTop: "8px" }}>
              * 3명 미만 예약은 <strong>PENDING(모객 대기)</strong> 상태로 접수되며, 다른 대기 예약과 합산되어 3명 이상이 되면 자동 확정됩니다.
            </div>
          )}
        </div>

        {/* 실시간 계산서 */}
        <div style={{ background: "#fafafa", padding: "15px", border: "1px dashed #ccc", borderRadius: "6px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#222" }}>예상 결제 금액 계산</h4>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>기본 1인 금액 ({STYLE_LABELS[activeStyle?.type] || activeStyle?.type})</span>
            <span>{basePricePerPerson.toLocaleString()} 원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>숙소 업그레이드 추가금 (1인)</span>
            <span>+{hotelExtraPerPerson.toLocaleString()} 원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>식사 업그레이드 추가금 (1인)</span>
            <span>+{foodExtraPerPerson.toLocaleString()} 원</span>
          </div>
          {addonsPerPerson > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
              <span>선택 애드온 (1인)</span>
              <span>+{addonsPerPerson.toLocaleString()} 원</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>총 인원</span>
            <span>{participantsCount} 명</span>
          </div>
          {isVip && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#ce6f72", marginBottom: "6px" }}>
              <span>단골/VIP 할인 ({Math.round(discountRate * 100)}%)</span>
              <span>-{discountAmount.toLocaleString()} 원</span>
            </div>
          )}
          <hr style={{ margin: "10px 0", borderColor: "#eee" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px", color: "#0f3460" }}>
            <span>최종 예상 금액</span>
            <span>{finalTotalPrice.toLocaleString()} 원</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px",
            background: "#4ecca3",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {submitting
            ? "예약 요청 중..."
            : participantsCount < 3
              ? "예약 신청하기 (모객 대기 PENDING 접수)"
              : "예약 신청하기 (즉시 확정 대상)"}
        </button>
      </form>
    </div>
  );
};

export default BookingPage;