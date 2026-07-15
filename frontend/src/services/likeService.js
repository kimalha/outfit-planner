import { postService } from './postService';

export const likeService = {
  toggleLike: (postId) => {
    const posts = postService.getPosts();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const isLiked = p.likedByMe;
        return {
          ...p,
          likedByMe: !isLiked,
          likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    postService.savePosts(updated);
    return updated.find(p => p.id === postId);
  },

  toggleSave: (postId) => {
    const posts = postService.getPosts();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const isSaved = p.savedByMe;
        return {
          ...p,
          savedByMe: !isSaved,
          saves: isSaved ? Math.max(0, p.saves - 1) : p.saves + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    postService.savePosts(updated);
    return updated.find(p => p.id === postId);
  }
};
