import React from "react";
import { useNotifications } from "../../context/NotificationContext";

// Human readable time formatter
function formatTimeAgo(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch (e) {
    return "";
  }
}

export default function NotificationModal() {
  const { 
    notifications, 
    isNotificationOpen, 
    closeNotification, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  if (!isNotificationOpen) return null;

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      {/* Click outside to close */}
      <div className="flex-1" onClick={closeNotification} />

      {/* Sheet panel */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col max-h-[85%] min-h-[50%]"
        style={{ borderRadius: "28px 28px 0 0", boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1" onClick={closeNotification}>
          <div className="w-10 h-1 rounded-full bg-slate-200 cursor-pointer" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Notifikasi</h2>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.isRead).length} Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Baca semua
              </button>
            )}
            <button
              onClick={closeNotification}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none hover:bg-slate-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p className="text-xs font-semibold text-gray-500">Tidak ada notifikasi.</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Semua pemberitahuan akan muncul di sini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markAsRead(item.id)}
                  className={`group relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    item.isRead
                      ? "bg-white border-slate-100 hover:bg-slate-50/50"
                      : "bg-blue-50/40 border-blue-100 hover:bg-blue-50/60"
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600" />
                  )}

                  {/* Bell/Notification type icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.isRead ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-xs text-gray-800 leading-snug break-words ${!item.isRead ? "font-bold" : "font-medium"}`}>
                      {item.content}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  {/* Delete button on hover/always for mobile touch */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="self-center p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100"
                    title="Hapus"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
