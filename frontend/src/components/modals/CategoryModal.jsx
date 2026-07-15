import React, { useState } from "react";
import { useCategories } from "../../context/CategoryContext";
import { useOutfit } from "../../context/OutfitContext";

export default function CategoryModal({ onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory, isSystemCategory } = useCategories();
  const { clothes, setClothes } = useOutfit();

  const [mode, setMode] = useState("list"); // "list" | "add" | "edit" | "delete_confirm"
  const [newName, setNewName] = useState("");
  const [editTarget, setEditTarget] = useState(null); // { id, name }
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [moveTo, setMoveTo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Kategori selain "Semua" yang bisa jadi tujuan pemindahan
  const moveOptions = categories.filter(
    (c) => c.name.toLowerCase() !== "semua" && c.id !== deleteTarget?.id
  );

  const handleAdd = async () => {
    setError("");
    if (!newName.trim()) { setError("Nama kategori wajib diisi!"); return; }
    if (newName.trim().length > 30) { setError("Nama kategori maksimal 30 karakter!"); return; }
    setSaving(true);
    try {
      await addCategory(newName.trim());
      setNewName("");
      setMode("list");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setError("");
    if (!editName.trim()) { setError("Nama kategori wajib diisi!"); return; }
    if (editName.trim().length > 30) { setError("Nama kategori maksimal 30 karakter!"); return; }
    setSaving(true);
    try {
      await updateCategory(editTarget.id, editName.trim());
      // Perbarui nama kategori di data pakaian lokal
      setClothes(prev => prev.map(c =>
        c.category.toLowerCase() === editTarget.name.toLowerCase()
          ? { ...c, category: editName.trim() }
          : c
      ));
      setEditTarget(null);
      setEditName("");
      setMode("list");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (cat) => {
    // Cek apakah kategori masih dipakai
    const inUse = clothes.some(
      (c) => c.category.toLowerCase() === cat.name.toLowerCase()
    );
    setDeleteTarget({ ...cat, inUse });
    setMoveTo("");
    setError("");
    setMode("delete_confirm");
  };

  const handleDeleteConfirm = async () => {
    setError("");
    if (deleteTarget.inUse && !moveTo) {
      setError("Pilih kategori tujuan untuk memindahkan pakaian.");
      return;
    }
    setSaving(true);
    try {
      await deleteCategory(deleteTarget.id, deleteTarget.inUse ? moveTo : undefined);
      // Perbarui data pakaian lokal jika ada pemindahan
      if (deleteTarget.inUse && moveTo) {
        setClothes(prev => prev.map(c =>
          c.category.toLowerCase() === deleteTarget.name.toLowerCase()
            ? { ...c, category: moveTo }
            : c
        ));
      }
      setDeleteTarget(null);
      setMode("list");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
        style={{ borderRadius: "28px 28px 0 0", maxHeight: "85%" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {mode === "add" ? "Tambah Kategori" :
             mode === "edit" ? "Ubah Nama Kategori" :
             mode === "delete_confirm" ? "Hapus Kategori" :
             "Kelola Kategori"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8 pt-4">

          {/* LIST MODE */}
          {mode === "list" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400">Tekan ikon pensil untuk mengubah nama atau ikon tempat sampah untuk menghapus.</p>
              {categories.map((cat) => {
                const isSystem = isSystemCategory(cat.name);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      {isSystem && (
                        <span className="text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-0.5 uppercase tracking-wide">Sistem</span>
                      )}
                      <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                    </div>
                    {!isSystem && (
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => { setEditTarget(cat); setEditName(cat.name); setError(""); setMode("edit"); }}
                          className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors active:scale-90"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteRequest(cat)}
                          className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors active:scale-90"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => { setNewName(""); setError(""); setMode("add"); }}
                className="mt-1 w-full py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform hover:bg-blue-700"
              >
                + Tambah Kategori Baru
              </button>
            </div>
          )}

          {/* ADD MODE */}
          {mode === "add" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Kategori</label>
                <input
                  autoFocus
                  maxLength={30}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  placeholder="contoh: Topi, Tas, Hoodie..."
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                />
                <div className="flex justify-between items-center mt-0.5">
                  {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : <span />}
                  <p className="text-[10px] text-gray-400">{newName.length}/30</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setMode("list"); setError(""); }}
                  className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-bold text-gray-500 hover:bg-slate-100 transition-colors"
                >Batal</button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-200 disabled:opacity-60 active:scale-95 transition-all hover:bg-blue-700"
                >{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {mode === "edit" && editTarget && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-400">Semua pakaian yang menggunakan kategori <strong className="text-gray-700">{editTarget.name}</strong> akan otomatis diperbarui.</p>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Kategori Baru</label>
                <input
                  autoFocus
                  maxLength={30}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  value={editName}
                  onChange={e => { setEditName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleEdit()}
                />
                <div className="flex justify-between items-center mt-0.5">
                  {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : <span />}
                  <p className="text-[10px] text-gray-400">{editName.length}/30</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setMode("list"); setError(""); }}
                  className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-bold text-gray-500 hover:bg-slate-100 transition-colors"
                >Batal</button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="flex-1 py-3 rounded-full bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-200 disabled:opacity-60 active:scale-95 transition-all hover:bg-blue-700"
                >{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </div>
          )}

          {/* DELETE CONFIRM MODE */}
          {mode === "delete_confirm" && deleteTarget && (
            <div className="flex flex-col gap-4">
              {deleteTarget.inUse ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-xs font-bold text-amber-700 mb-1">⚠️ Kategori masih digunakan</p>
                    <p className="text-xs text-amber-600">Kategori <strong>{deleteTarget.name}</strong> masih digunakan oleh beberapa pakaian. Pilih kategori tujuan untuk memindahkan pakaian tersebut.</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pindahkan pakaian ke</label>
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400"
                      value={moveTo}
                      onChange={e => { setMoveTo(e.target.value); setError(""); }}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {moveOptions.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {error && <p className="text-xs text-red-500 font-medium mt-0.5">{error}</p>}
                  </div>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-red-700 mb-1">Hapus Kategori</p>
                  <p className="text-xs text-red-600">Apakah Anda yakin ingin menghapus kategori <strong>{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setMode("list"); setError(""); }}
                  className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-bold text-gray-500 hover:bg-slate-100 transition-colors"
                >Batal</button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={saving || (deleteTarget.inUse && !moveTo)}
                  className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-200 disabled:opacity-60 active:scale-95 transition-all hover:bg-red-600"
                >{saving ? "Menghapus..." : "Hapus"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
