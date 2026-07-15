import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';

const CategoryContext = createContext(null);

// Kategori bawaan sistem (tidak boleh dihapus)
export const SYSTEM_CATEGORIES = ['semua', 'atasan', 'bawahan', 'luar', 'sepatu'];

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil semua kategori dari backend
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil kategori:', err);
      // Fallback ke kategori default jika backend tidak tersedia
      setCategories([
        { id: 1, name: 'Semua' },
        { id: 2, name: 'Atasan' },
        { id: 3, name: 'Bawahan' },
        { id: 4, name: 'Luar' },
        { id: 5, name: 'Sepatu' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Tambah kategori baru
  const addCategory = async (name) => {
    const trimmed = name.trim();

    // Validasi frontend
    if (!trimmed) throw new Error('Nama kategori wajib diisi!');
    if (trimmed.length > 30) throw new Error('Nama kategori maksimal 30 karakter!');

    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) throw new Error('Kategori sudah ada!');

    const response = await api.post('/api/categories', { name: trimmed });
    if (response.data.success) {
      setCategories((prev) => [...prev, response.data.data]);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Gagal menambahkan kategori');
  };

  // Update nama kategori
  const updateCategory = async (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('Nama kategori wajib diisi!');
    if (trimmed.length > 30) throw new Error('Nama kategori maksimal 30 karakter!');

    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== id
    );
    if (isDuplicate) throw new Error('Kategori dengan nama tersebut sudah ada!');

    const response = await api.put(`/api/categories/${id}`, { name: trimmed });
    if (response.data.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
      return response.data.data;
    }
    throw new Error(response.data.message || 'Gagal memperbarui kategori');
  };

  // Hapus kategori (dengan opsi memindahkan pakaian)
  const deleteCategory = async (id, moveTo) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) throw new Error('Kategori tidak ditemukan');

    if (SYSTEM_CATEGORIES.includes(cat.name.toLowerCase())) {
      throw new Error('Kategori bawaan sistem tidak boleh dihapus!');
    }

    const body = moveTo ? { moveTo } : {};
    const response = await api.delete(`/api/categories/${id}`, { data: body });

    if (response.data.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    }
    throw new Error(response.data.message || 'Gagal menghapus kategori');
  };

  // Cek apakah kategori adalah sistem
  const isSystemCategory = (name) =>
    SYSTEM_CATEGORIES.includes((name || '').toLowerCase());

  // Daftar kategori selain "Semua" — untuk digunakan di form tambah/edit pakaian
  const clothingCategories = categories.filter(
    (c) => c.name.toLowerCase() !== 'semua'
  );

  return (
    <CategoryContext.Provider
      value={{
        categories,
        clothingCategories,
        loading,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        isSystemCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
