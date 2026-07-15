import React, { createContext, useState, useContext } from 'react';
import { useProfile } from './ProfileContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [isRegistering, setIsRegistering] = useState(false);
  const { loadProfile } = useProfile();

  const login = () => {
    setLoggedIn(true);
    loadProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, setLoggedIn, isRegistering, setIsRegistering, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
