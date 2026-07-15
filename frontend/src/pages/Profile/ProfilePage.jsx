import React, { useState } from "react";
import { useProfile } from "../../context/ProfileContext";
import { useNotifications } from "../../context/NotificationContext";
import { usePosts } from "../../context/PostContext";
import { useOutfit } from "../../context/OutfitContext";
import { usePlanner } from "../../context/PlannerContext";
import { useAuth } from "../../context/AuthContext";
import { BellIcon, LogOutIcon, SlidersIcon } from "../../components/Common/Icons";
import MyPostsSection from "../../components/MyPostsSection";
import EditProfileModal from "../../components/modals/EditProfileModal";
import StylePreferencesModal from "../../components/modals/StylePreferencesModal";
import { formatDateKey } from "../../utils/dateUtils";

import { updateProfileApi } from "../../services/profileService";

export default function ProfilePage({ setPage }) {
  const { profile, refreshProfile } = useProfile();
  const { openNotification, unreadCount } = useNotifications();
  const { posts } = usePosts();
  const { clothes } = useOutfit();
  const { plannerData } = usePlanner();
  const { logout } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showStylePreferencesModal, setShowStylePreferencesModal] = useState(false);

  const stylePreferences = profile.stylePreferences || ["Minimalist", "Business Casual", "Streetwear", "Monochrome"];

  const handleSaveStylePreferences = async (newStyles) => {
    try {
      await updateProfileApi({ stylePreferences: newStyles });
      refreshProfile();
    } catch (err) {
      console.error("Gagal menyimpan preferensi gaya:", err);
    }
  };

  // Helper to process Worn Outfits
  const getWornOutfits = (data) => {
    const worn = [];
    Object.entries(data).forEach(([dateStr, dayData]) => {
      if (dayData.confirmed && dayData.outfits && dayData.outfits.length > 0) {
        dayData.outfits.forEach(outfit => {
          worn.push({
            id: outfit.id,
            name: outfit.name,
            image_url: outfit.image_url,
            category: outfit.category,
            dateStr: dateStr
          });
        });
      }
    });
    return worn.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  };

  const wornOutfits = getWornOutfits(plannerData);

  // Helper to filter Recently Worn (7 days)
  const getRecentlyWorn = (allWorn) => {
    const todayStr = formatDateKey(new Date());
    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
    const sevenDaysAgoStr = formatDateKey(sevenDaysAgoDate);

    return allWorn.filter(item =>
      item.dateStr >= sevenDaysAgoStr && item.dateStr <= todayStr
    );
  };

  const recentlyWorn = getRecentlyWorn(wornOutfits);

  // Dynamic counts
  const outfitsCount = clothes.length;
  const favoritesCount = clothes.filter(c => c.is_favorite === 1 || c.is_favorite === true).length;
  const postsCount = posts.filter(p => String(p.userId) === String(profile?.id)).length;

  const stats = [
    { label: "OUTFITS", val: outfitsCount },
    { label: "FAVORITES", val: favoritesCount },
    { label: "POSTS", val: postsCount }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gray-900">Outfit.in</h1>
        <div className="flex items-center gap-2">
          <button onClick={openNotification} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center active:scale-90 transition-transform relative">
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => {
              logout();
              setPage("home");
            }} 
            className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center"
          >
            <LogOutIcon />
          </button>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5 pb-24">
        {/* Avatar & info */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full ring-4 ring-blue-500 ring-offset-2 overflow-hidden bg-slate-100 flex items-center justify-center">
              <img src={profile.avatar} alt="avatar" className="w-20 h-20 object-cover" />
            </div>
            <button onClick={() => setShowEditModal(true)} className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow hover:bg-blue-700 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{profile.fullname}</h2>
            <p className="text-xs text-blue-500 font-medium">@{profile.username}</p>
            <p className="text-xs text-gray-500 mt-1">{profile.bio}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
              <p className="text-xl font-black text-gray-900">{s.val}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Edit Profile */}
        <button onClick={() => setShowEditModal(true)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-blue-200 active:scale-95 transition-transform hover:bg-blue-700">
          Edit Profile
        </button>

        {/* Style Preferences */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div onClick={() => setShowStylePreferencesModal(true)} className="flex items-center justify-between mb-3 cursor-pointer group">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Style Preferences</h3>
            <button className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center active:scale-90 transition-transform">
              <SlidersIcon />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {stylePreferences.map(t => (
              <span key={t} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">{t}</span>
            ))}
          </div>
        </div>

        {/* Recently Worn */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recently Worn</h3>
            <span onClick={() => setPage("history")} className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">View All</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {recentlyWorn.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">Belum ada outfit yang dipakai dalam 7 hari terakhir.</p>
            ) : (
              recentlyWorn.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 w-20">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-800 truncate w-20 text-center leading-none mt-1">{item.name}</p>
                  <p className="text-[8px] text-gray-400 text-center font-medium">
                    {new Date(item.dateStr + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Posts Section */}
        <MyPostsSection clothes={clothes} setPage={setPage} />
      </div>

      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showStylePreferencesModal && (
        <StylePreferencesModal
          initialStyles={stylePreferences}
          onClose={() => setShowStylePreferencesModal(false)}
          onSave={handleSaveStylePreferences}
        />
      )}
    </div>
  );
}
