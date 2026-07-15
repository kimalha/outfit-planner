import React, { useState } from "react";
import { usePosts } from "../context/PostContext";
import { useProfile } from "../context/ProfileContext";
import CommentsModal from "./modals/CommentsModal";
import EditPostModal from "./modals/EditPostModal";
import CreatePostModal from "./modals/CreatePostModal";
import ZoomableImage from "./Common/ZoomableImage";

// Human-readable time ago formatter
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
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return "";
  }
}

export default function MyPostsSection({ clothes, setPage }) {
  const { profile } = useProfile();
  const { posts, likePost, savePost } = usePosts();

  // Active modals
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewOutfit, setPreviewOutfit] = useState(null);

  // Filter posts that belong to the current user
  const currentUserId = 'user_1'; // Same as CreatePostModal — single source of truth
  const myPosts = posts.filter(p => p.userId === currentUserId);

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Header & Create Button */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-gray-900">Postingan Saya</h3>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
            {myPosts.length} Posts
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-full px-4 py-2 transition-all active:scale-95 flex items-center gap-1"
        >
          <span>+</span> Posting Baru
        </button>
      </div>

      {/* Posts Feed */}
      {myPosts.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 text-center flex flex-col items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="opacity-50">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <p className="text-xs font-semibold text-gray-500">Belum ada postingan.</p>
          <p className="text-[10px] text-gray-400">Bagikan outfit pertamamu hari ini!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-md shadow-blue-200"
          >
            Mulai Posting
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myPosts.map((post) => {
            // Find outfit details if linked
            const linkedOutfit = post.outfitId ? clothes.find(c => c.id === post.outfitId) : null;

            return (
              <div key={post.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={profile.avatar}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-gray-900 leading-tight">{profile.fullname}</p>
                        <p className="text-[10px] text-blue-500 font-medium">@{profile.username}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {post.location && (
                          <span className="text-[9px] text-gray-500 flex items-center gap-0.5 truncate max-w-[120px]">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {post.location}
                          </span>
                        )}
                        {post.location && <span className="text-[8px] text-gray-300">•</span>}
                        <span className="text-[9px] text-gray-400">{formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Post trigger */}
                  <button
                    onClick={() => setEditingPost(post)}
                    className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                    title="Edit Postingan"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>
                </div>

                {/* Post Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
                  <img
                    src={post.photo}
                    alt="post"
                    className="w-full h-full object-cover"
                    onDoubleClick={() => likePost(post.id)}
                  />

                  {/* Linked outfit tag inside image */}
                  {(linkedOutfit || post.outfitName) && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (linkedOutfit) {
                          setPreviewOutfit({ isDeleted: false, outfit: linkedOutfit });
                        } else {
                          setPreviewOutfit({ isDeleted: true, name: post.outfitName || "Outfit Linked" });
                        }
                      }}
                      className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center justify-between text-white border border-white/10 cursor-pointer active:scale-[0.98] transition-transform z-10"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {linkedOutfit && (
                          <img
                            src={linkedOutfit.image_url}
                            alt=""
                            className="w-6 h-6 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider leading-none">Outfit Linked</p>
                          <p className="text-xs font-bold text-white truncate mt-0.5">{post.outfitName || linkedOutfit?.name}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-600/90 text-white font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {linkedOutfit?.category.toUpperCase() || "FIT"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interaction Action Buttons */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => likePost(post.id)}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors py-1 group"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={post.likedByMe ? "#EF4444" : "none"}
                        stroke={post.likedByMe ? "#EF4444" : "currentColor"}
                        strokeWidth="2.5"
                        className="group-active:scale-125 transition-transform"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span className={`text-xs font-bold ${post.likedByMe ? "text-red-500" : "text-gray-700"}`}>
                        {post.likes}
                      </span>
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={() => setActiveCommentsPostId(post.id)}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors py-1"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span className="text-xs font-bold text-gray-700">
                        {post.comments.length}
                      </span>
                    </button>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => savePost(post.id)}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-yellow-500 transition-colors py-1"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={post.savedByMe ? "#F59E0B" : "none"}
                      stroke={post.savedByMe ? "#F59E0B" : "currentColor"}
                      strokeWidth="2.5"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className={`text-xs font-bold ${post.savedByMe ? "text-yellow-600" : "text-gray-700"}`}>
                      {post.saves}
                    </span>
                  </button>
                </div>

                {/* Caption display */}
                <div className="px-4 py-3 bg-slate-50/40">
                  <p className="text-xs text-gray-800 leading-snug">
                    <span className="font-bold text-gray-900 mr-1.5">@{profile.username}</span>
                    {post.caption}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Sub modals */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          clothes={clothes}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          clothes={clothes}
        />
      )}

      {activeCommentsPostId && (
        <CommentsModal
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
        />
      )}

      {/* Outfit Preview Modal Bottom Sheet */}
      {previewOutfit && (() => {
        const dateStr = previewOutfit.outfit?.created_at || previewOutfit.outfit?.createdAt;
        const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : null;

        return (
          <div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
          >
            {/* Click outside to close */}
            <div className="flex-1" onClick={() => setPreviewOutfit(null)} />

            {/* Modal bottom sheet */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-white flex flex-col max-h-[85%] min-h-[50%]"
              style={{ 
                borderRadius: "28px 28px 0 0", 
                boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.1)",
                animation: "slideUpOutfit 0.25s ease-out forwards"
              }}
            >
              <style>{`
                @keyframes slideUpOutfit {
                  from { transform: translateY(100%); }
                  to { transform: translateY(0); }
                }
              `}</style>

              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1" onClick={() => setPreviewOutfit(null)}>
                <div className="w-10 h-1 rounded-full bg-slate-200 cursor-pointer" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                <h2 className="text-base font-bold text-gray-900">
                  Detail Outfit Linked
                </h2>
                <button
                  onClick={() => setPreviewOutfit(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none hover:bg-slate-200 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Content Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 pb-24 flex flex-col gap-4">
                {previewOutfit.isDeleted ? (
                  <div className="flex flex-col items-center gap-4 text-center py-6">
                    <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="#EF4444" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-red-600">Outfit ini sudah tidak tersedia.</h3>
                      <p className="text-xs text-gray-500 mt-1">Nama Tautan: {previewOutfit.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <ZoomableImage src={previewOutfit.outfit.image_url} alt={previewOutfit.outfit.name} />

                    <div className="flex flex-col gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase inline-block mb-1.5 tracking-wider">
                          {previewOutfit.outfit.category}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">{previewOutfit.outfit.name}</h3>
                      </div>

                      <div className="pt-2 border-t border-slate-50 flex flex-col gap-1.5 text-xs text-gray-600">
                        {previewOutfit.outfit.color && (
                          <p className="flex justify-between py-1 border-b border-slate-50/50">
                            <span className="font-semibold text-gray-400">Warna</span>
                            <span className="font-bold text-gray-800">{previewOutfit.outfit.color}</span>
                          </p>
                        )}
                        {previewOutfit.outfit.brand && (
                          <p className="flex justify-between py-1 border-b border-slate-50/50">
                            <span className="font-semibold text-gray-400">Brand</span>
                            <span className="font-bold text-gray-800">{previewOutfit.outfit.brand}</span>
                          </p>
                        )}
                        {previewOutfit.outfit.tags && (
                          <p className="flex justify-between py-1 border-b border-slate-50/50">
                            <span className="font-semibold text-gray-400">Tag</span>
                            <span className="font-bold text-gray-800">{previewOutfit.outfit.tags}</span>
                          </p>
                        )}
                        {previewOutfit.outfit.notes && (
                          <p className="flex flex-col gap-1 py-1 border-b border-slate-50/50">
                            <span className="font-semibold text-gray-400">Catatan</span>
                            <span className="text-gray-800 font-medium whitespace-pre-line leading-relaxed">{previewOutfit.outfit.notes}</span>
                          </p>
                        )}
                        {formattedDate && (
                          <p className="flex justify-between py-1 border-b border-slate-50/50">
                            <span className="font-semibold text-gray-400">Tanggal Ditambahkan</span>
                            <span className="font-bold text-gray-800">{formattedDate}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3.5 flex gap-2 flex-shrink-0 z-20">
                <button
                  onClick={() => setPreviewOutfit(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold py-3 rounded-full text-xs transition-colors active:scale-95"
                >
                  Tutup
                </button>
                {!previewOutfit.isDeleted && setPage && (
                  <button
                    onClick={() => {
                      localStorage.setItem("catalog_search", previewOutfit.outfit.name);
                      setPage("catalog");
                      setPreviewOutfit(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full text-xs shadow-md shadow-blue-200 transition-all active:scale-95"
                  >
                    Lihat di Katalog
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
