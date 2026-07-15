import React, { useState, useRef, useEffect } from "react";
import { usePosts } from "../../context/PostContext";
import { useProfile } from "../../context/ProfileContext";

// Time ago formatter helper
function formatTimeAgo(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return "Kemarin";
    return `${diffDays}h lalu`;
  } catch (e) {
    return "";
  }
}

export default function CommentsModal({ postId, onClose }) {
  const { posts, addComment, editComment, deleteComment } = usePosts();
  const { profile } = useProfile();

  const [newCommentText, setNewCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const inputRef = useRef(null);

  const post = posts.find(p => p.id === postId);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCommentId]);

  if (!post) return null;

  const handleSendComment = (e) => {
    e.preventDefault();
    if (editingCommentId) {
      if (!editingText.trim()) return;
      editComment(postId, editingCommentId, editingText.trim());
      setEditingCommentId(null);
      setEditingText("");
    } else {
      if (!newCommentText.trim()) return;
      addComment(postId, newCommentText.trim(), profile);
      setNewCommentText("");
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm("Hapus komentar ini?")) {
      deleteComment(postId, commentId);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Modal panel */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex flex-col max-h-[85%] min-h-[50%]"
        style={{ borderRadius: "28px 28px 0 0", boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-slate-200 cursor-pointer" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-gray-900">Komentar</h2>
            <span className="bg-slate-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {post.comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none hover:bg-slate-200 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 pb-20">
          {post.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="text-xs font-semibold text-gray-500">Belum ada komentar.</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Jadilah yang pertama memberikan komentar!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {post.comments.map((comment) => {
                const isMyComment = comment.userId === "user_1";
                const isEditingThis = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className="flex items-start gap-3 group">
                    <img
                      src={comment.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-50 rounded-2xl px-3.5 py-2.5 relative">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-gray-900">
                            {comment.username}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        {isEditingThis ? (
                          <div className="text-xs text-gray-500 italic">Sedang diedit di bawah...</div>
                        ) : (
                          <p className="text-xs text-gray-700 leading-snug break-words">
                            {comment.text}
                          </p>
                        )}
                      </div>

                      {/* Comment Actions (Edit / Delete) for User's own comments */}
                      {isMyComment && !isEditingThis && (
                        <div className="flex items-center gap-3 px-2 mt-1">
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[10px] font-bold text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendComment}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3.5 flex flex-col gap-2"
        >
          {editingCommentId && (
            <div className="flex justify-between items-center bg-blue-50 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] text-blue-700 font-semibold">Mengedit komentar...</span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] font-bold text-red-500 hover:underline"
              >
                Batal
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editingCommentId ? editingText : newCommentText}
              onChange={e => editingCommentId ? setEditingText(e.target.value) : setNewCommentText(e.target.value)}
              placeholder="Tulis komentar..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-gray-800 outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={editingCommentId ? !editingText.trim() : !newCommentText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full p-2.5 active:scale-95 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
