export const getLatestCompletedTrip = (bookings) => {
  const completedTrips = Array.isArray(bookings)
    ? bookings.filter((booking) => booking?.status === "BOOKED" || booking?.status === "ARRIVED")
    : [];

  return completedTrips
    .map((booking, index) => ({
      booking,
      index,
      timestamp: Date.parse(
        booking?.endAt || booking?.startAt || booking?.createdAt || booking?.date || "",
      ),
    }))
    .sort((a, b) => {
      if (Number.isFinite(a.timestamp) && Number.isFinite(b.timestamp)) {
        return b.timestamp - a.timestamp;
      }
      if (Number.isFinite(a.timestamp)) return -1;
      if (Number.isFinite(b.timestamp)) return 1;
      return b.index - a.index;
    })[0]?.booking || null;
};

export const needsTourDetails = (booking) => Boolean(
  booking?.tourId && !booking?.tour && (
    !booking?.tourName
    || ((booking?.tourStyleId || booking?.styleId)
      && !(booking?.tourStyleType || booking?.style || booking?.tourStyle || booking?.selectedStyle))
    || (booking?.hotelOptionId != null
      && !(booking?.hotelOption || booking?.hotel || booking?.hotelOptionName || booking?.selectedHotelOption))
    || (booking?.foodOptionId != null
      && !(booking?.foodOption || booking?.mealOption || booking?.foodOptionName || booking?.mealOptionName || booking?.selectedFoodOption || booking?.selectedMealOption))
  ),
);

const getOptionLabel = (option) => {
  if (option == null || option === "") return null;
  if (typeof option === "string" || typeof option === "number") {
    return String(option).replaceAll("_", " ");
  }
  if (Array.isArray(option)) {
    return option.map(getOptionLabel).filter(Boolean).join(", ");
  }
  if (typeof option === "object") {
    const label = option.name || option.label || option.title || option.description
      || option.type || option.code || option.value;
    if (label) return getOptionLabel(label);
    if (option.id != null) return `옵션 #${option.id}`;
    return Object.values(option).map(getOptionLabel).filter(Boolean).join(", ") || null;
  }
  return null;
};

export const getTripDetails = (booking) => {
  const tour = booking?.tour;
  const findTourOption = (options, id) => Array.isArray(options)
    ? options.find((option) => String(option?.id) === String(id))
    : null;
  const startAt = booking?.startAt || booking?.travelStartAt || booking?.startDate
    || booking?.departureDate || booking?.date;
  const endAt = booking?.endAt || booking?.travelEndAt || booking?.endDate
    || booking?.arrivalDate;
  const formatDate = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime())
      ? String(date)
      : parsedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };
  const startDate = formatDate(startAt);
  const endDate = formatDate(endAt);
  const travelers = booking?.participantsCount ?? booking?.headcount
    ?? booking?.numberOfPeople ?? booking?.guestCount;
  const style = getOptionLabel(booking?.tourStyleType || booking?.style
    || booking?.tourStyle || booking?.selectedStyle || booking?.styleName
    || findTourOption(tour?.styles, booking?.tourStyleId || booking?.styleId));
  const optionSources = [
    booking?.hotelOption || booking?.hotel || booking?.hotelOptionName
      || booking?.selectedHotelOption
      || findTourOption(tour?.hotelOptions, booking?.hotelOptionId)
      || (booking?.hotelOptionId != null ? `숙소 옵션 #${booking.hotelOptionId}` : null),
    booking?.foodOption || booking?.mealOption || booking?.meal
      || booking?.foodOptionName || booking?.mealOptionName
      || booking?.selectedFoodOption || booking?.selectedMealOption
      || findTourOption(tour?.foodOptions, booking?.foodOptionId)
      || (booking?.foodOptionId != null ? `식사 옵션 #${booking.foodOptionId}` : null),
    booking?.bookingAddons,
    booking?.addons,
    booking?.addOns,
    booking?.selectedOptions,
    booking?.options,
  ];
  const options = [...new Set(optionSources.flatMap((option) => {
    const label = getOptionLabel(option);
    return label ? [label] : [];
  }))];

  return {
    name: booking?.tourName || tour?.name || tour?.title || "지난 여행",
    dates: startDate && endDate
      ? `${startDate} ~ ${endDate}`
      : startDate || endDate || "일정 정보 없음",
    travelers: travelers != null ? `${travelers}명` : "인원 정보 없음",
    style: style || "등급 정보 없음",
    options: options.length > 0 ? options : ["예약 정보에서 확인되지 않았어요."],
  };
};
