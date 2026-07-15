import React, { useState } from "react";
import { useProfile } from "../../context/ProfileContext";
import { usePlanner } from "../../context/PlannerContext";
import { useNotifications } from "../../context/NotificationContext";
import { useOutfit } from "../../context/OutfitContext";
import { BellIcon, ChevronLeft, ChevronRight } from "../../components/Common/Icons";
import { formatDateKey } from "../../utils/dateUtils";
import PlanDetailModal from "../../components/modals/PlanDetailModal";

const calDays = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

export default function CalendarPage({ setPage }) {
  const { profile } = useProfile();
  const { plannerData } = usePlanner();
  const { openNotification, unreadCount } = useNotifications();
  const { clothes, loadingClothes } = useOutfit();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDetails, setShowDetails] = useState(false);

  // Touch Swipe Gesture State
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextMonth();
    } else if (isRightSwipe) {
      handlePrevMonth();
    }
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(clickedDate);
    setShowDetails(true);
  };

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const getFirstDayOffset = (y, m) => {
    const day = new Date(y, m, 1).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return day === 0 ? 6 : day - 1; // Mon-based offset
  };
  const firstDayOffset = getFirstDayOffset(currentYear, currentMonth);

  const cells = Array(firstDayOffset).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const selectedDateStr = selectedDate ? formatDateKey(selectedDate) : "";
  const activeDayData = plannerData[selectedDateStr] || { outfits: [], activities: [] };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-blue-400 transition-all bg-slate-100 flex items-center justify-center"
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

      <div className="px-5 flex flex-col gap-4 pb-24">
        {/* Month navigator */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 select-none"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Planning Cycle</p>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <button onClick={handlePrevMonth} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-75 transition-transform"><ChevronLeft /></button>
            <div className="flex gap-2 items-center">
              <select
                value={currentMonth}
                onChange={e => setCurrentMonth(parseInt(e.target.value))}
                className="text-sm font-bold text-gray-900 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
              >
                {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
              </select>
              <select
                value={currentYear}
                onChange={e => setCurrentYear(parseInt(e.target.value))}
                className="text-sm font-bold text-gray-900 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
              >
                {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={handleNextMonth} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center active:scale-75 transition-transform"><ChevronRight /></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {calDays.map(d => (
              <div key={d} className="text-center text-[9px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              
              const dateStr = formatDateKey(new Date(currentYear, currentMonth, day));
              const cellData = plannerData[dateStr] || {};
              const hasOutfit = cellData.outfits && cellData.outfits.length > 0;
              const hasActivity = cellData.activities && cellData.activities.length > 0;
              
              const isSelected = selectedDate && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === currentMonth && 
                selectedDate.getFullYear() === currentYear;
                
              const isToday = today.getDate() === day && 
                today.getMonth() === currentMonth && 
                today.getFullYear() === currentYear;

              return (
                <div key={i} className="flex flex-col items-center justify-center relative py-1">
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-all relative ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : isToday
                        ? "bg-slate-900 text-white"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                  
                  {/* Indicators */}
                  <div className="flex gap-0.5 mt-0.5 absolute bottom-0">
                    {hasOutfit && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {hasActivity && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected date preview header */}
        <div 
          onClick={() => setShowDetails(true)}
          className="bg-slate-50 rounded-3xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-black text-gray-900">{String(selectedDate.getDate()).padStart(2, "0")}</p>
              {activeDayData.confirmed && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  Confirmed ✓
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500">{selectedDate.toLocaleDateString("id-ID", { weekday: "long" })}</p>
            <p className="text-xs text-gray-400">{selectedDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
          </div>
          <button className="text-xs font-bold text-blue-600 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm active:scale-95 transition-transform">
            Detail Rencana
          </button>
        </div>

        {/* Selected date activities summary */}
        {activeDayData.activities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-xs text-gray-400">Tidak ada kegiatan terjadwal hari ini.</p>
          </div>
        ) : (
          activeDayData.activities.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 border-l-4 border-l-blue-500">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">{a.period}</p>
              <p className="text-sm font-bold text-gray-900">{a.time} – {a.title}</p>
              {a.note && <p className="text-xs text-gray-500 mt-1">{a.note}</p>}
            </div>
          ))
        )}

        {/* Selected date outfit summary */}
        {activeDayData.outfits.length === 0 ? (
          <div className="relative rounded-3xl overflow-hidden h-52 bg-slate-50 border border-slate-100 border-dashed flex flex-col items-center justify-center p-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="mb-2">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
            <p className="text-xs font-semibold text-gray-400">Belum ada outfit yang direncanakan</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {activeDayData.outfits.map(item => (
              <div key={item.id} className="relative rounded-3xl overflow-hidden h-52 w-44 flex-shrink-0 shadow-sm border border-slate-100">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-0.5">{item.category}</p>
                  <p className="text-sm font-black text-white truncate">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date detail sheet modal */}
      {showDetails && (
        <PlanDetailModal
          date={selectedDate}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
