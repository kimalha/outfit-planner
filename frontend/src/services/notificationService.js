const STORAGE_KEY = 'outfit_notifications';

const DEFAULT_NOTIFICATIONS = [
  { id: '1', content: 'Outfit hari ini belum dikonfirmasi.', isRead: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: '2', content: 'Jadwal outfit besok sudah tersedia.', isRead: false, createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: '3', content: 'Jangan lupa kegiatan pukul 09:00.', isRead: true, createdAt: new Date(Date.now() - 3600000 * 24).toISOString() }
];

export const notificationService = {
  getNotifications: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing notifications", e);
      return DEFAULT_NOTIFICATIONS;
    }
  },

  saveNotifications: (notifications) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  },

  addNotification: (content) => {
    const notifications = notificationService.getNotifications();
    const newNotification = {
      id: Date.now().toString(),
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotification);
    notificationService.saveNotifications(notifications);
    return newNotification;
  },

  markAsRead: (id) => {
    const notifications = notificationService.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    notificationService.saveNotifications(updated);
    return updated;
  },

  markAllAsRead: () => {
    const notifications = notificationService.getNotifications();
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    notificationService.saveNotifications(updated);
    return updated;
  },

  deleteNotification: (id) => {
    const notifications = notificationService.getNotifications();
    const updated = notifications.filter(n => n.id !== id);
    notificationService.saveNotifications(updated);
    return updated;
  }
};
