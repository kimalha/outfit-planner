import React from "react";
import { HomeIcon, CalendarIcon, CatalogIcon, ProfileIcon } from "../Common/Icons";

export default function BottomNav({ page, setPage, onAddClick }) {
  const leftTabs  = [
    { id: "home",     label: "HOME",     Icon: HomeIcon },
    { id: "calendar", label: "CALENDAR", Icon: CalendarIcon },
  ];
  const rightTabs = [
    { id: "catalog", label: "CATALOG", Icon: CatalogIcon },
    { id: "profile", label: "PROFILE", Icon: ProfileIcon },
  ];

  const renderTab = ({ id, label, Icon }) => {
    const active = page === id;
    return (
      <button
        key={id}
        onClick={() => setPage(id)}
        className="w-full flex items-center justify-center py-1.5 focus:outline-none select-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className={`rounded-2xl px-3 py-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 ease-out border ${
          active 
            ? "bg-blue-600 shadow-[0_4px_10px_rgba(37,99,235,0.3)] border-blue-500/20 text-white" 
            : "bg-transparent border-transparent text-slate-400"
        }`} style={{ minHeight: "54px", minWidth: "68px" }}>
          <div className="flex items-center justify-center transition-all duration-200">
            <Icon active={active} />
          </div>
          <span 
            className={`text-[9px] tracking-wider transition-all duration-200 origin-center ${
              active 
                ? "font-bold text-white scale-90" 
                : "font-semibold text-slate-400 scale-100"
            }`}
            style={{
              display: "inline-block",
              transformOrigin: "center center"
            }}
          >
            {label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="relative z-30 flex-shrink-0 bg-white border-t border-slate-100 shadow-lg" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="grid grid-cols-5 items-center px-1 py-1">
        {leftTabs.map(renderTab)}

        {/* Center FAB */}
        <div className="flex justify-center">
          <button
            onClick={onAddClick}
            className="relative z-40 w-13 h-13 rounded-full bg-blue-600 shadow-xl shadow-blue-300 flex items-center justify-center active:scale-95 transition-all hover:bg-blue-700 -mt-5 border-4 border-white"
            style={{ width: 52, height: 52 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </div>
  );
}
