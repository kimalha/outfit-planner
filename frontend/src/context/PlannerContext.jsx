import React, { createContext, useState, useContext } from 'react';
import api from '../utils/api';

const PlannerContext = createContext(null);

export const PlannerProvider = ({ children }) => {
  const [plannerData, setPlannerData] = useState({});
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Ambil semua rencana harian dari backend
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await api.get('/api/plans');
      if (response.data.success) {
        setPlannerData(response.data.data || {});
      }
    } catch (err) {
      console.error("Gagal mengambil data planner dari backend:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Simpan/update rencana harian di database
  const savePlannerData = async (dateStr, newData) => {
    // Update state lokal (Optimistic UI)
    setPlannerData(prev => ({
      ...prev,
      [dateStr]: newData
    }));

    try {
      await api.post('/api/plans', {
        date: dateStr,
        outfits: newData.outfits,
        activities: newData.activities,
        confirmed: newData.confirmed
      });
    } catch (err) {
      console.error("Gagal menyimpan rencana ke backend:", err);
      // Sinkronisasi ulang jika terjadi error
      await fetchPlans();
    }
  };

  return (
    <PlannerContext.Provider value={{ plannerData, savePlannerData, fetchPlans, loadingPlans }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within a PlannerProvider");
  }
  return context;
};
