import React, { useState } from "react";
import { usePlanner } from "../context/PlannerContext";

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CalendarMiniIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export default function HistoryPage({ setPage, wornOutfits: propsWornOutfits }) {
  const { plannerData } = usePlanner();

  // Helper to process Worn Outfits from plannerData
  const getWornOutfits = (data) => {
    const worn = [];
    if (!data) return worn;
    Object.entries(data).forEach(([dateStr, dayData]) => {
      if (dayData.confirmed && dayData.outfits && dayData.outfits.length > 0) {
        dayData.outfits.forEach(outfit => {
          worn.push({
            id: outfit.id,
            name: outfit.name,
            image_url: outfit.image_url,
            category: outfit.category,
            dateStr: dateStr
          });
        });
      }
    });
    return worn.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  };

  const wornOutfits = propsWornOutfits || getWornOutfits(plannerData) || [];
  const safeWornOutfits = wornOutfits;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua"); // "Minggu ini" | "Bulan ini" | "Semua"

  const formatDateLabel = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getFilteredOutfits = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const checkDateInRange = (dateStr, daysLimit) => {
      const d = new Date(dateStr);
      const diffTime = today.getTime() - d.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= daysLimit;
    };

    return safeWornOutfits.filter(item => {
      // Date filter
      let matchesDate = true;
      if (activeFilter === "Minggu ini") {
        matchesDate = checkDateInRange(item.dateStr, 7);
      } else if (activeFilter === "Bulan ini") {
        matchesDate = checkDateInRange(item.dateStr, 30);
      }

      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDate && matchesSearch;
    });
  };

  const filtered = getFilteredOutfits();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-slate-50 flex-shrink-0">
        <button
          onClick={() => setPage("profile")}
          className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft />
        </button>
        <h1 className="text-base font-bold text-gray-900">History Outfit</h1>
      </div>

      {/* Search Bar */}
      <div className="px-5 mt-4 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2.5 border border-slate-100">
          <SearchIcon />
          <input
            className="flex-1 outline-none text-sm text-gray-500 bg-transparent placeholder-gray-400"
            placeholder="Cari pakaian dalam riwayat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide flex-shrink-0">
        {["Minggu ini", "Bulan ini", "Semua"].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === f 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "bg-slate-100 text-gray-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-50">
              <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
            <p className="text-xs font-semibold text-gray-500">Belum ada outfit yang pernah dipakai.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((item, idx) => (
              <div
                key={`${item.id}-${item.dateStr}-${idx}`}
                className="flex gap-3.5 p-3 bg-white border border-slate-100 rounded-2xl items-center shadow-sm"
              >
                <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 relative">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase inline-block mb-1 tracking-wider">
                    {item.category}
                  </span>
                  <p className="text-xs font-bold text-gray-900 truncate leading-snug">{item.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                    <CalendarMiniIcon />
                    {formatDateLabel(item.dateStr)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
