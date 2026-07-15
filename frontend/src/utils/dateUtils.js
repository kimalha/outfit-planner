// ── Global date helper (LOCAL timezone, not UTC) ─────────────────────────────
// IMPORTANT: Always use this function to generate date keys (YYYY-MM-DD).
// Never use date.toISOString().split("T")[0] — that converts to UTC first,
// which shifts the date backward by 1 day for WIB (UTC+7) users at local midnight.
export const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Helper to get week days (MON - SUN) based on current date
export const getCurrentWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const days = [];
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateKey(d); // ✅ local time, not UTC
    const isToday = d.toDateString() === today.toDateString();
    
    days.push({
      dayName: dayNames[i],
      dateNum: d.getDate(),
      dateStr: dateStr,
      isToday: isToday
    });
  }
  return days;
};
