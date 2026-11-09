import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTourByIdApi, calculateTourPriceApi } from "../api/tours";
import { useAuth } from "../context/AuthContext";

const STYLES = [
  { code: "CLASSIC", name: "클래식 (Classic)", multiplier: 1.0, desc: "기본 충실 가성비 패키지" },
  { code: "GRAND", name: "그랜드 (Grand)", multiplier: 1.25, desc: "4성급 고급 호텔 & 프리미엄 식사" },
  { code: "PREMIUM", name: "프리미엄 (Premium)", multiplier: 1.5, desc: "5성급 스위트 & 전용 단독 가이드" },
];

const MEAL_OPTIONS = [
  { code: "STANDARD", name: "일반식 (기본)", price: 0 },
  { code: "DELUXE", name: "고급 현지식 코스 (+50,000원)", price: 50000 },
  { code: "VIP_DINING", name: "미슐랭 & 프라이빗 셰프 (+150,000원)", price: 150000 },
];

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const tourId = searchParams.get("tourId") || "1";
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [tour, setTour] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState("CLASSIC");
  const [selectedMeal, setSelectedMeal] = useState("STANDARD");
  const [headcount, setHeadcount] = useState(2);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const data = await getTourByIdApi(tourId);
        setTour(data);
      } catch (err) {
        console.error("Failed to fetch tour:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  if (loading) return <div style={{ padding: 20, color: "#333" }}>투어 정보를 불러오는 중...</div>;
  if (!tour) return <div style={{ padding: 20, color: "#333" }}>존재하지 않는 투어 상품입니다.</div>;

  // 실시간 가격 계산 로직
  const styleObj = STYLES.find((s) => s.code === selectedStyle);
  const mealObj = MEAL_OPTIONS.find((m) => m.code === selectedMeal);

  const basePricePerPerson = tour.basePrice || 1200000;
  const stylePricePerPerson = basePricePerPerson * styleObj.multiplier;
  const itemTotal = (stylePricePerPerson + mealObj.price) * headcount;

  // 단골/VIP 10% 할인 로직 (user.isRegular 기준)
  const isVip = user?.isRegular || false;
  const discountAmount = isVip ? itemTotal * 0.1 : 0;
  const finalTotalPrice = itemTotal - discountAmount;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("예약을 진행하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tourId: tour.id,
        style: selectedStyle,
        mealOption: selectedMeal,
        headcount,
        totalPrice: finalTotalPrice,
        status: "PENDING",
      };

      console.log("Submitting Booking Payload:", payload);
      alert(`[${tour.name}] 예약 신청이 완료되었습니다!\n(현재 상태: 직원 승인 대기 / PENDING)`);
      navigate("/past-tours");
    } catch (err) {
      alert("예약 신청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2 style={{ color: "#1a1a2e", marginTop: 0 }}>투어 예약 및 옵션 선택</h2>
      <div style={{ background: "#f0f4f8", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px 0", color: "#0f3460" }}>{tour.name}</h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>{tour.description}</p>
      </div>

      <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Step 1: 여행 등급 선택 */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
            1. 여행 등급 (Style) 선택
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {STYLES.map((style) => (
              <div
                key={style.code}
                onClick={() => setSelectedStyle(style.code)}
                style={{
                  border: selectedStyle === style.code ? "2px solid #0f3460" : "1px solid #ccc",
                  background: selectedStyle === style.code ? "#eef2f7" : "#fff",
                  padding: "12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "14px", color: "#111" }}>{style.name}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{style.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: 식사 옵션 */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
            2. 식사 업그레이드 옵션
          </label>
          <select
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            {MEAL_OPTIONS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: 인원 수 */}
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#222" }}>
            3. 인원 수 선택
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={headcount}
            onChange={(e) => setHeadcount(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: "100px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Step 4: 실시간 계산서 */}
        <div style={{ background: "#fafafa", padding: "15px", border: "1px dashed #ccc", borderRadius: "6px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#111" }}>예상 결제 금액 계산</h4>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>기본 1인 금액 ({styleObj.name})</span>
            <span>{stylePricePerPerson.toLocaleString()} 원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>추가 옵션 (인당)</span>
            <span>+{mealObj.price.toLocaleString()} 원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#555", marginBottom: "6px" }}>
            <span>총 수량</span>
            <span>{headcount} 명</span>
          </div>
          {isVip && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#e94560", marginBottom: "6px" }}>
              <span>단골/VIP 할인 (10%)</span>
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
          style={{ width: "100%", padding: "14px", background: "#4ecca3", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
        >
          {submitting ? "예약 요청 중..." : "예약 신청하기 (PENDING 승인 대기)"}
        </button>
      </form>
    </div>
  );
};

export default BookingPage;