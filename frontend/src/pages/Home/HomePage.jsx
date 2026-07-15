import React, { useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import { usePlanner } from "../../context/PlannerContext";
import { useNotifications } from "../../context/NotificationContext";
import { BellIcon } from "../../components/Common/Icons";
import { formatDateKey, getCurrentWeekDates } from "../../utils/dateUtils";

export default function HomePage({ setPage }) {
  const { profile } = useProfile();
  const { plannerData, savePlannerData } = usePlanner();
  const { openNotification, addNotification, unreadCount, notifications } = useNotifications();

  const todayDate = formatDateKey(new Date()); // YYYY-MM-DD local time ✅
  const todayLabel = new Date().toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const dayData = plannerData[todayDate] || { outfits: [], activities: [], confirmed: false };
  const hasOutfits = dayData.outfits && dayData.outfits.length > 0;

  // Check today's confirmation status
  useEffect(() => {
    if (hasOutfits && !dayData.confirmed) {
      const hasNotify = notifications.some(n => n.content === "Outfit hari ini belum dikonfirmasi." && !n.isRead);
      if (!hasNotify) {
        addNotification("Outfit hari ini belum dikonfirmasi.");
      }
    }
  }, [hasOutfits, dayData.confirmed, notifications, addNotification]);

  // Check tomorrow's plan status
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateKey(tomorrow); // ✅ local time
    const tomorrowPlan = plannerData[tomorrowStr];
    if (tomorrowPlan && tomorrowPlan.outfits && tomorrowPlan.outfits.length > 0) {
      const hasNotify = notifications.some(n => n.content === "Jadwal outfit besok sudah tersedia.");
      if (!hasNotify) {
        addNotification("Jadwal outfit besok sudah tersedia.");
      }
    }
  }, [plannerData, notifications, addNotification]);

  // Outfits are rendered dynamically without slots

  // Sort activities by time
  const sortedActivities = [...(dayData.activities || [])].sort((a, b) => {
    return (a.startTime || "").localeCompare(b.startTime || "");
  });

  const handleConfirm = () => {
    if (!dayData.confirmed) {
      savePlannerData(todayDate, {
        ...dayData,
        confirmed: true
      });
      addNotification("Outfit berhasil dikonfirmasi.");
      alert("✅ Pakaian hari ini berhasil dikonfirmasi!");
    }
  };

  const weekDays = getCurrentWeekDates();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-blue-400 transition-all"
            onClick={() => setPage("profile")}
          >
            <img src={profile.avatar} alt="avatar" className="w-10 h-10 object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Good Morning</p>
            <p className="text-base font-bold text-gray-900 leading-tight">{profile.fullname}</p>
          </div>
        </div>
        <button onClick={openNotification} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center active:scale-90 transition-transform relative">
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
          )}
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5 pb-24">
        {/* Today's Plan */}
        {!hasOutfits ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center flex flex-col items-center gap-3">
            <h2 className="text-base font-bold text-gray-900 self-start">Today's Plan</h2>
            <div className="my-2">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="mx-auto mb-2 opacity-50">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p className="text-xs font-semibold text-gray-500">Belum ada outfit untuk hari ini.</p>
              <p className="text-[10px] text-gray-400 mt-1">Tambahkan outfit melalui Calendar.</p>
            </div>
            <button
              onClick={() => setPage("calendar")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-md shadow-blue-200"
            >
              Buka Calendar
            </button>
          </div>
        ) : (
          /* Real Data State */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900">Today's Plan</h2>
              <span className="text-[10px] text-gray-400">{todayLabel}</span>
            </div>
            
            {/* Carousel of outfits */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide mb-4">
              {dayData.outfits.map(item => (
                <div key={item.id} className="flex flex-col gap-1 min-w-[96px] w-24 flex-shrink-0">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[8px] font-bold text-center text-gray-400 tracking-wider uppercase truncate px-0.5">{item.category}</p>
                  <p className="text-[9px] text-center text-gray-800 font-bold truncate px-0.5">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>

            {/* List of activities */}
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Aktivitas Hari Ini</h3>
              {sortedActivities.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Tidak ada agenda hari ini.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedActivities.map(act => (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
                        {act.startTime || act.time.split(" ")[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 leading-none">{act.title}</p>
                        {act.note && <p className="text-[9px] text-gray-400 truncate mt-0.5">{act.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={dayData.confirmed}
              className={`w-full mt-4 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
                dayData.confirmed
                  ? "bg-green-500 shadow-green-200 text-white cursor-default"
                  : "bg-blue-600 shadow-blue-200 text-white hover:bg-blue-700"
              }`}
            >
              {dayData.confirmed ? (
                <span>✓ Outfit Confirmed</span>
              ) : (
                "Confirm Outfit"
              )}
            </button>
          </div>
        )}

        {/* Weekly Lookbook */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Weekly Lookbook</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {weekDays.map((day) => {
              const weekDayData = plannerData[day.dateStr] || {};
              const firstOutfit = weekDayData.outfits && weekDayData.outfits[0];
              const outfitImg = firstOutfit ? firstOutfit.image_url : null;
              
              return (
                <div key={day.dateStr} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <p className="text-[9px] font-bold text-gray-400 tracking-wider">{day.dayName}</p>
                  <p className="text-xs font-bold text-gray-700">{day.dateNum}</p>
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex items-center justify-center ${day.isToday ? "border-blue-500 shadow-md shadow-blue-100" : "border-transparent bg-slate-50"}`}>
                    {outfitImg ? (
                      <img src={outfitImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                        <span className="text-[14px] font-light opacity-50">+</span>
                      </div>
                    )}
                  </div>
                  {day.isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
