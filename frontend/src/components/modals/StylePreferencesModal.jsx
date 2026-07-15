import React, { useState } from "react";

const SUGGESTIONS = [
  "Minimalist", "Casual", "Business Casual", "Formal", 
  "Streetwear", "Vintage", "Monochrome", "Sporty", 
  "Oversized", "Old Money", "Smart Casual", "Korean Style"
];

export default function StylePreferencesModal({ onClose, initialStyles, onSave }) {
  const [styles, setStyles] = useState([...initialStyles]);
  const [newStyle, setNewStyle] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const handleAddStyle = (styleName) => {
    const trimmed = styleName.trim();
    if (!trimmed) return;
    if (styles.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      alert("Style sudah ada!");
      return;
    }
    setStyles(prev => [...prev, trimmed]);
    setNewStyle("");
  };

  const handleDeleteStyle = (indexToDelete) => {
    setStyles(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditingValue(styles[index]);
  };

  const handleSaveEdit = (index) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    
    // Check duplication with other styles
    if (styles.some((s, idx) => idx !== index && s.toLowerCase() === trimmed.toLowerCase())) {
      alert("Style sudah ada!");
      return;
    }

    setStyles(prev => prev.map((s, idx) => idx === index ? trimmed : s));
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleSaveAll = () => {
    onSave(styles);
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
        style={{ borderRadius: "28px 28px 0 0", maxHeight: "92%", height: "92%" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            Edit Style Preferences
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-8 pt-4">
          <div className="flex flex-col gap-5">
            {/* Input Tambah Custom */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tambah Style Baru</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Vintage, Gorpcore..."
                  value={newStyle}
                  onChange={e => setNewStyle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddStyle(newStyle)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  onClick={() => handleAddStyle(newStyle)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-2xl transition-all active:scale-95 shadow-md shadow-blue-200"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Rekomendasi Style</label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pb-1 scrollbar-hide">
                {SUGGESTIONS.map(s => {
                  const isActive = styles.some(item => item.toLowerCase() === s.toLowerCase());
                  return (
                    <button
                      key={s}
                      disabled={isActive}
                      onClick={() => handleAddStyle(s)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                        isActive
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 active:scale-95"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Styles List */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Daftar Style Pilihan ({styles.length})</label>
              {styles.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6 border border-dashed border-slate-200 rounded-2xl">Belum ada preferensi style yang dipilih.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {styles.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                      {editingIndex === idx ? (
                        <div className="flex gap-1.5 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSaveEdit(idx)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 outline-none focus:border-blue-400"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(idx)}
                            className="bg-green-500 text-white font-bold text-[10px] px-3 rounded-lg active:scale-95"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="bg-slate-200 text-gray-600 font-bold text-[10px] px-3 rounded-lg active:scale-95"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-gray-800">{s}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(idx)}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStyle(idx)}
                              className="text-[10px] font-bold text-red-500 hover:underline"
                            >
                              Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full border border-slate-200 text-sm font-bold text-gray-500 hover:bg-slate-100 transition-colors active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
