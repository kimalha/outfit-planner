import React, { createContext, useState, useContext } from 'react';
import api from '../utils/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Ambil notifikasi dari database
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    }
  };

  // Tambah notifikasi baru ke database
  const addNotification = async (content) => {
    try {
      const response = await api.post('/api/notifications', { content });
      if (response.data.success) {
        setNotifications(prev => [response.data.data, ...prev]);
      }
    } catch (err) {
      console.error("Gagal menambah notifikasi:", err);
    }
  };

  // Tandai notifikasi sebagai dibaca
  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch (err) {
      console.error("Gagal menandai dibaca:", err);
      await fetchNotifications();
    }
  };

  // Tandai semua notifikasi sebagai dibaca
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.put('/api/notifications/read-all');
    } catch (err) {
      console.error("Gagal menandai semua dibaca:", err);
      await fetchNotifications();
    }
  };

  // Hapus notifikasi
  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.error("Gagal menghapus notifikasi:", err);
      await fetchNotifications();
    }
  };

  const openNotification = () => setIsNotificationOpen(true);
  const closeNotification = () => setIsNotificationOpen(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isNotificationOpen,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      openNotification,
      closeNotification,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
