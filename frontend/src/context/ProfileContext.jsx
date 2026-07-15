import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchProfile } from '../services/profileService';

const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  username: "",
  email: "",
  bio: "Kece dari lahir",
  avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hakim",
  fullname: "Hakim",
  phone: "",
  birthdate: "",
  gender: "",
  location: ""
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchProfile();
      setProfile(prev => ({
        ...prev,
        ...data,
        fullname: data.fullname || data.username || "Hakim",
        bio: data.bio || "Kece dari lahir",
        avatar: data.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Hakim"
      }));
    } catch (err) {
      console.error("Gagal memuat profil di context:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const refreshProfile = () => {
    loadProfile();
  };

  const updateProfileLocal = (updatedData) => {
    setProfile(prev => ({
      ...prev,
      ...updatedData,
      fullname: updatedData.fullname || updatedData.username || prev.fullname,
      bio: updatedData.bio || prev.bio,
      avatar: updatedData.avatar || prev.avatar
    }));
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile, updateProfileLocal, loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
