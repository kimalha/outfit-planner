import React, { createContext, useState, useContext } from 'react';
import api from '../utils/api';
import { useNotifications } from './NotificationContext';

const PostContext = createContext(null);

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const { addNotification } = useNotifications();

  // Ambil semua postingan dari backend
  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts');
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil postingan:", err);
    }
  };

  // Buat postingan baru di backend
  const createPost = async (postData) => {
    try {
      const response = await api.post('/api/posts', {
        photo: postData.photo,
        caption: postData.caption,
        outfitId: postData.outfitId,
        location: postData.location
      });
      await fetchPosts();
      return response.data;
    } catch (err) {
      console.error("Gagal membuat postingan:", err);
      throw err;
    }
  };

  // Hapus postingan
  const deletePost = async (id) => {
    try {
      await api.delete(`/api/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Gagal menghapus postingan:", err);
    }
  };

  // Toggle Like postingan
  const likePost = async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/like`);
      const { liked } = response.data;
      
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const delta = liked ? 1 : -1;
          return {
            ...p,
            likedByMe: liked,
            likes: Math.max(0, p.likes + delta)
          };
        }
        return p;
      }));

      if (liked) {
        addNotification(`Postingan mendapatkan Like.`);
      }
    } catch (err) {
      console.error("Gagal men-toggle like:", err);
    }
  };

  // Toggle Save postingan
  const savePost = async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/save`);
      const { saved } = response.data;

      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const delta = saved ? 1 : -1;
          return {
            ...p,
            savedByMe: saved,
            saves: Math.max(0, p.saves + delta)
          };
        }
        return p;
      }));

      if (saved) {
        addNotification(`Seseorang menyimpan postingan Anda.`);
      }
    } catch (err) {
      console.error("Gagal men-toggle save:", err);
    }
  };

  // Tambah komentar pada postingan
  const addComment = async (postId, text, userProfile) => {
    try {
      const response = await api.post(`/api/posts/${postId}/comments`, { text });
      if (response.data.success) {
        const newComment = response.data.data;
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...p.comments, newComment]
            };
          }
          return p;
        }));
        addNotification(`Postingan mendapatkan Komentar.`);
        return newComment;
      }
    } catch (err) {
      console.error("Gagal menambah komentar:", err);
      throw err;
    }
  };

  // Hapus komentar dari postingan
  const deleteComment = async (postId, commentId) => {
    try {
      await api.delete(`/api/posts/${postId}/comments/${commentId}`);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Gagal menghapus komentar:", err);
    }
  };

  return (
    <PostContext.Provider value={{
      posts,
      fetchPosts,
      refreshPosts: fetchPosts,
      createPost,
      deletePost,
      likePost,
      savePost,
      addComment,
      deleteComment
    }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePosts must be used within a PostProvider");
  }
  return context;
};
