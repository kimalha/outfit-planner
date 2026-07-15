import { postService } from './postService';

export const commentService = {
  addComment: (postId, text, userProfile) => {
    const posts = postService.getPosts();
    const newComment = {
      id: 'comment_' + Date.now().toString(),
      userId: userProfile.id || 'user_1',
      username: userProfile.fullname || userProfile.username || 'Hakim',
      avatar: userProfile.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hakim',
      text: text,
      createdAt: new Date().toISOString()
    };

    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    postService.savePosts(updated);
    return {
      updatedPost: updated.find(p => p.id === postId),
      newComment
    };
  },

  editComment: (postId, commentId, text) => {
    const posts = postService.getPosts();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const updatedComments = p.comments.map(c => 
          c.id === commentId ? { ...c, text, updatedAt: new Date().toISOString() } : c
        );
        return {
          ...p,
          comments: updatedComments,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    postService.savePosts(updated);
    return updated.find(p => p.id === postId);
  },

  deleteComment: (postId, commentId) => {
    const posts = postService.getPosts();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const filteredComments = p.comments.filter(c => c.id !== commentId);
        return {
          ...p,
          comments: filteredComments,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    postService.savePosts(updated);
    return updated.find(p => p.id === postId);
  }
};
