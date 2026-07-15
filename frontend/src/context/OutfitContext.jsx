import React, { createContext, useState, useContext } from 'react';
import api from '../utils/api';

const OutfitContext = createContext(null);

export const OutfitProvider = ({ children }) => {
  const [clothes, setClothes] = useState([]);
  const [loadingClothes, setLoadingClothes] = useState(true);

  const fetchClothes = async () => {
    try {
      setLoadingClothes(true);
      const response = await api.get("/api/clothes");
      setClothes(response.data.data);
    } catch (err) {
      console.error("Gagal mengambil data baju:", err);
    } finally {
      setLoadingClothes(false);
    }
  };

  const addOutfit = async (formData) => {
    const response = await api.post("/api/clothes", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    await fetchClothes();
    return response.data;
  };

  const updateOutfit = async (id, data) => {
    const response = await api.put(`/api/clothes/${id}`, data);
    await fetchClothes();
    return response.data;
  };

  const deleteOutfit = async (id) => {
    const response = await api.delete(`/api/clothes/${id}`);
    await fetchClothes();
    return response.data;
  };

  return (
    <OutfitContext.Provider value={{ clothes, setClothes, loadingClothes, fetchClothes, addOutfit, updateOutfit, deleteOutfit }}>
      {children}
    </OutfitContext.Provider>
  );
};

export const useOutfit = () => {
  const context = useContext(OutfitContext);
  if (!context) {
    throw new Error("useOutfit must be used within an OutfitProvider");
  }
  return context;
};
