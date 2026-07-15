import React, { useState, useEffect } from "react";
import axios from "axios";
import { useProfile } from "../../context/ProfileContext";
import { useNotifications } from "../../context/NotificationContext";
import { useCategories } from "../../context/CategoryContext";
import { useOutfit } from "../../context/OutfitContext";
import { BellIcon } from "../../components/Common/Icons";
import { labelColor } from "../../utils/formatter";
import CategoryModal from "../../components/modals/CategoryModal";

export default function CatalogPage({ setPage }) {
  const { profile } = useProfile();
  const { openNotification, unreadCount } = useNotifications();
  const { categories } = useCategories();
  const { clothes, setClothes, updateOutfit, deleteOutfit } = useOutfit();

  const [active, setActive] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Pastikan active reset ke "Semua" jika kategori yang dipilih dihapus
  useEffect(() => {
    const stillExists = categories.some(
      (c) => c.name.toLowerCase() === active.toLowerCase()
    );
    if (!stillExists) setActive("Semua");
  }, [categories, active]);

  // Konsumsi filter pencarian jika di-redirect dari postingan
  useEffect(() => {
    const savedSearch = localStorage.getItem("catalog_search");
    if (savedSearch) {
      setSearchQuery(savedSearch);
      setActive("Semua");
      localStorage.removeItem("catalog_search");
    }
  }, []);

  const handleToggleFavorite = async (item) => {
    try {
      const updatedIsFavorite = item.is_favorite ? 0 : 1;
      await updateOutfit(item.id, {
        is_favorite: updatedIsFavorite
      });
    } catch (err) {
      console.error("Gagal mengubah status favorit:", err);
      alert("Gagal memperbarui status favorit.");
    }
  };

  const handleDeleteClothes = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pakaian ini dari lemari?")) return;
    try {
      await deleteOutfit(id);
      alert("Pakaian berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus pakaian:", err);
      alert("Gagal menghapus pakaian.");
    }
  };

  // Filter logika menggunakan data 'clothes'
  const filtered = clothes.filter(item => {
    const matchesCategory = active === "Semua" || item.category.toLowerCase() === active.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.color && item.color.toLowerCase().includes(q)) ||
      (item.tags && item.tags.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
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

      {/* Search */}
      <div className="px-5 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2.5 border border-slate-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="flex-1 outline-none text-sm text-gray-500 bg-transparent placeholder-gray-400"
            placeholder="Cari lemari bajumu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter pills — Dynamic dari CategoryContext */}
      <div className="flex gap-2 px-5 mb-3 overflow-x-auto scrollbar-hide flex-shrink-0">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.name)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${active === cat.name ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-gray-600"}`}
          >
            {cat.name}
          </button>
        ))}
        {/* Tombol tambah kategori */}
        <button
          onClick={() => setShowCategoryModal(true)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-dashed border-slate-300 hover:border-blue-300"
          title="Kelola Kategori"
        >
          +
        </button>
      </div>

      {/* Grid title */}
      <div className="flex items-center justify-between px-5 mb-3 flex-shrink-0">
        <h2 className="text-base font-bold text-gray-900">Koleksi Baju</h2>
        <span className="text-xs font-semibold text-blue-600">{filtered.length} Items</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p className="text-xs font-semibold text-gray-500">Tidak ada pakaian yang ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => (
              <div key={item.id} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-transform relative">
                <div className="relative aspect-[3/4]">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 left-2 ${labelColor(item.category.toUpperCase())} text-white text-[9px] font-bold px-2 py-0.5 rounded-full`}>{item.category.toUpperCase()}</span>
                  
                  {/* Favorite Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(item);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                  >
                    <svg 
                      width="13" 
                      height="13" 
                      viewBox="0 0 24 24" 
                      fill={item.is_favorite ? "#EF4444" : "none"} 
                      stroke={item.is_favorite ? "#EF4444" : "#64748B"} 
                      strokeWidth="2.5"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  {/* Delete Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClothes(item.id);
                    }}
                    className="absolute top-10 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform text-red-500 hover:text-red-700"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                <div className="p-2.5 bg-white">
                  <p className="text-xs font-bold text-gray-900">{item.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {item.used || item.last_worn || "Belum pernah dipakai"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal kelola kategori */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
}
