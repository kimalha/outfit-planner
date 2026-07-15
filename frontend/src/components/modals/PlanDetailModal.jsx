import React, { useState, useEffect } from "react";
import { useCategories } from "../../context/CategoryContext";
import { useOutfit } from "../../context/OutfitContext";
import { usePlanner } from "../../context/PlannerContext";
import { formatDateKey } from "../../utils/dateUtils";

const DEFAULT_DAY_DATA = { outfits: [], activities: [] };

export default function PlanDetailModal({ date, onClose }) {
  const { categories } = useCategories();
  const { clothes, loadingClothes } = useOutfit();
  const { plannerData, savePlannerData } = usePlanner();

  const [showOutfitSelector, setShowOutfitSelector] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!showOutfitSelector) {
      setSearchQuery("");
    }
  }, [showOutfitSelector]);
  
  // ✅ Use formatDateKey (local time) NOT toISOString (UTC) to avoid date shift
  const dateStr = date ? formatDateKey(date) : "";
  const dayData = plannerData[dateStr] || DEFAULT_DAY_DATA;

  // Kategori untuk filter di outfit selector (termasuk "Semua")
  const categoriesForPlanner = categories;

  const [selectedOutfitIds, setSelectedOutfitIds] = useState(() => {
    return dayData.outfits ? dayData.outfits.map(o => o.id) : [];
  });
  
  // Activity form states
  const [activityName, setActivityName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activityDesc, setActivityDesc] = useState("");

  useEffect(() => {
    if (showOutfitSelector) {
      const currentDayData = plannerData[dateStr] || DEFAULT_DAY_DATA;
      setSelectedOutfitIds(currentDayData.outfits.map(o => o.id));
    }
  }, [showOutfitSelector, dateStr, plannerData]);

  if (!date) return null;

  const handleSaveOutfits = () => {
    const selectedClothes = clothes.filter(c => selectedOutfitIds.includes(c.id));
    savePlannerData(dateStr, {
      ...dayData,
      outfits: selectedClothes
    });
    setShowOutfitSelector(false);
  };

  const handleToggleOutfitSelection = (id) => {
    setSelectedOutfitIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const handleSaveActivity = () => {
    if (!activityName.trim() || !startTime || !endTime) {
      alert("Nama kegiatan, jam mulai, dan jam selesai wajib diisi!");
      return;
    }

    const startHour = parseInt(startTime.split(":")[0]);
    let period = "MORNING";
    if (startHour >= 12 && startHour < 17) {
      period = "AFTERNOON";
    } else if (startHour >= 17) {
      period = "EVENING";
    }

    const newActivity = {
      id: Date.now().toString(),
      title: activityName.trim(),
      time: `${startTime} – ${endTime}`,
      startTime,
      endTime,
      note: activityDesc.trim(),
      period
    };

    const updatedActivities = [...dayData.activities, newActivity].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    savePlannerData(dateStr, {
      ...dayData,
      activities: updatedActivities
    });

    setActivityName("");
    setStartTime("");
    setEndTime("");
    setActivityDesc("");
    setShowActivityForm(false);
  };

  const handleDeleteActivity = (id) => {
    const updatedActivities = dayData.activities.filter(a => a.id !== id);
    savePlannerData(dateStr, {
      ...dayData,
      activities: updatedActivities
    });
  };

  const [activeCategory, setActiveCategory] = useState("Semua");
  
  const filteredClothes = React.useMemo(() => {
    return clothes.filter(item => {
      // 1. Kategori Filter
      const matchesCategory = activeCategory === "Semua" || item.category.toLowerCase() === activeCategory.toLowerCase();
      
      // 2. Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.color && item.color.toLowerCase().includes(q)) ||
        (item.tags && item.tags.toLowerCase().includes(q));
      
      return matchesCategory && matchesSearch;
    });
  }, [clothes, activeCategory, searchQuery]);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
        style={{ borderRadius: "28px 28px 0 0", maxHeight: "92%", height: "92%" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {showOutfitSelector ? "Pilih Pakaian" : "Detail Rencana Harian"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {showOutfitSelector ? (
            <div className="flex flex-col gap-4 pt-4 h-full">
              {/* Search Bar */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2.5 border border-slate-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    className="flex-1 outline-none text-sm text-gray-500 bg-transparent placeholder-gray-400"
                    placeholder="Cari pakaian..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                {categoriesForPlanner.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCategory === cat.name 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                        : "bg-slate-100 text-gray-600"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pb-4">
                {loadingClothes ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                    <svg className="animate-spin w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.3"/>
                      <path d="M21 12a9 9 0 0 1-9 9"/>
                    </svg>
                    <p className="text-xs font-semibold">Memuat daftar outfit...</p>
                  </div>
                ) : filteredClothes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500">Tidak ada pakaian yang ditemukan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredClothes.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleOutfitSelection(item.id)}
                        className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                          selectedOutfitIds.includes(item.id) 
                            ? "border-blue-600 shadow-md shadow-blue-100 bg-blue-50/30" 
                            : "border-transparent"
                        }`}
                      >
                        <div className="aspect-[3/4] relative">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          {selectedOutfitIds.includes(item.id) && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-slate-50">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedOutfitIds.length === 0 && (
                <div className="px-1 text-center flex-shrink-0 mb-1">
                  <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl py-1.5 px-3 font-medium inline-block animate-pulse">
                    Pilih minimal satu outfit terlebih dahulu.
                  </p>
                </div>
              )}

              <div className="flex gap-2 flex-shrink-0 pt-2 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setShowOutfitSelector(false)}
                  className="flex-1 py-3.5 rounded-full border border-slate-200 text-sm font-bold text-gray-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveOutfits}
                  disabled={selectedOutfitIds.length === 0}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-gray-400 disabled:shadow-none text-white rounded-full text-sm font-bold shadow-lg shadow-blue-200 transition-all"
                >
                  Simpan Outfit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 pt-4">
              <div className="bg-slate-50 rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-4xl font-black text-gray-900">{String(date.getDate()).padStart(2, "0")}</p>
                  <p className="text-xs font-semibold text-gray-500">{date.toLocaleDateString("id-ID", { weekday: "long" })}</p>
                  <p className="text-xs text-gray-400">{date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-white shadow" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outfit Hari Ini</h3>
                    {dayData.confirmed && (
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        Confirmed ✓
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowOutfitSelector(true)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {dayData.outfits.length > 0 ? "Edit Outfit" : "Tambah Outfit"}
                  </button>
                </div>
                
                {dayData.outfits.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-xs text-gray-400 mb-2">Belum ada outfit yang direncanakan</p>
                    <button
                      onClick={() => setShowOutfitSelector(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100"
                    >
                      Pilih Outfit
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {dayData.outfits.map(item => (
                      <div key={item.id} className="flex gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl items-center shadow-sm">
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate leading-snug">{item.name}</p>
                          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kegiatan Hari Ini</h3>
                  {!showActivityForm && (
                    <button
                      onClick={() => setShowActivityForm(true)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Tambah Kegiatan
                    </button>
                  )}
                </div>

                {showActivityForm && (
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-100 rounded-3xl mt-1 mb-4 shadow-inner">
                    <h3 className="text-xs font-bold text-gray-700">Tambah Kegiatan Baru</h3>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Nama Kegiatan</label>
                      <input
                        type="text"
                        value={activityName}
                        onChange={e => setActivityName(e.target.value)}
                        placeholder="e.g. Kuliah Rekayasa Web"
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Jam Mulai</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Jam Selesai</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Deskripsi / Lokasi (Opsional)</label>
                      <input
                        type="text"
                        value={activityDesc}
                        onChange={e => setActivityDesc(e.target.value)}
                        placeholder="e.g. Gedung Informatika"
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowActivityForm(false)}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-gray-500 hover:bg-slate-100"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveActivity}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}

                {dayData.activities.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-xs text-gray-400 mb-2">Belum ada kegiatan yang dijadwalkan</p>
                    <button
                      onClick={() => setShowActivityForm(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100"
                    >
                      Buat Kegiatan
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dayData.activities.map((a) => (
                      <div key={a.id} className="relative bg-white rounded-2xl border border-slate-100 shadow-sm p-4 border-l-4 border-l-blue-500 flex justify-between items-start">
                        <div>
                          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">{a.period}</p>
                          <p className="text-xs font-bold text-gray-900">{a.time} – {a.title}</p>
                          {a.note && <p className="text-[10px] text-gray-500 mt-1">{a.note}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(a.id)}
                          className="text-gray-400 hover:text-red-500 text-xs font-bold px-1"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
