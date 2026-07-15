const STORAGE_KEY = 'outfit_user_posts';

const DEFAULT_POSTS = [
  {
    id: 'post_1',
    userId: 'user_1',
    photo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    caption: 'Gaya kasual untuk ngopi sore hari ini. Denim never goes out of style! ☕✨',
    outfitId: 3,
    outfitName: 'Denim Slim',
    location: 'Cafe Senja, Jakarta',
    likes: 24,
    comments: [
      { id: 'c1', userId: 'user_2', username: 'Rara', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rara', text: 'Keren banget outfitnya kak!', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'c2', userId: 'user_3', username: 'Budi', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Budi', text: 'Denimnya merk apa kak?', createdAt: new Date(Date.now() - 1800000).toISOString() }
    ],
    saves: 12,
    likedByMe: true,
    savedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'post_2',
    userId: 'user_1',
    photo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    caption: 'Outfit formal/semi-formal untuk presentasi hari ini. Semoga lancar! 👍💼',
    outfitId: 1,
    outfitName: 'Trench Klasik',
    location: 'Kampus Merdeka',
    likes: 42,
    comments: [
      { id: 'c3', userId: 'user_4', username: 'Siti', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Siti', text: 'Good luck presentasinya!', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
    ],
    saves: 8,
    likedByMe: false,
    savedByMe: true,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString()
  }
];

export const postService = {
  getPosts: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
      return DEFAULT_POSTS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing posts", e);
      return DEFAULT_POSTS;
    }
  },

  savePosts: (posts) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  },

  createPost: (postData) => {
    const posts = postService.getPosts();
    const newPost = {
      id: 'post_' + Date.now().toString(),
      userId: postData.userId || 'user_1',
      photo: postData.photo,
      caption: postData.caption,
      outfitId: postData.outfitId || null,
      outfitName: postData.outfitName || null,
      location: postData.location || '',
      likes: 0,
      comments: [],
      saves: 0,
      likedByMe: false,
      savedByMe: false,
      createdAt: postData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    posts.unshift(newPost);
    postService.savePosts(posts);
    return newPost;
  },

  updatePost: (id, postData) => {
    const posts = postService.getPosts();
    const updated = posts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          photo: postData.photo !== undefined ? postData.photo : p.photo,
          caption: postData.caption !== undefined ? postData.caption : p.caption,
          location: postData.location !== undefined ? postData.location : p.location,
          outfitId: postData.outfitId !== undefined ? postData.outfitId : p.outfitId,
          outfitName: postData.outfitName !== undefined ? postData.outfitName : p.outfitName,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    postService.savePosts(updated);
    return updated.find(p => p.id === id);
  },

  deletePost: (id) => {
    const posts = postService.getPosts();
    const filtered = posts.filter(p => p.id !== id);
    postService.savePosts(filtered);
    return filtered;
  }
};
