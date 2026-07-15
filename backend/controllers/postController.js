const db = require('../config/db');

// @desc    Ambil semua postingan komunitas
// @route   GET /api/posts
const getPosts = async (req, res) => {
    const userId = req.user.id;
    try {
        const [posts] = await db.query(
            `SELECT p.*, u.username, u.avatar, 
             c.name as outfitName, c.category as outfitCategory, c.image_url as outfitImageUrl,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likesCount,
             (SELECT COUNT(*) FROM post_saves WHERE post_id = p.id) as savesCount,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) > 0 as likedByMe,
             (SELECT COUNT(*) FROM post_saves WHERE post_id = p.id AND user_id = ?) > 0 as savedByMe
             FROM posts p
             JOIN users u ON p.user_id = u.id
             LEFT JOIN clothes c ON p.outfit_id = c.id
             ORDER BY p.created_at DESC`,
            [userId, userId]
        );

        const results = [];
        for (const post of posts) {
            const [comments] = await db.query(
                `SELECT pc.id, pc.text, pc.created_at as createdAt, pc.user_id as userId, u.username, u.avatar
                 FROM post_comments pc
                 JOIN users u ON pc.user_id = u.id
                 WHERE pc.post_id = ?
                 ORDER BY pc.created_at ASC`,
                [post.id]
            );

            results.push({
                id: post.id,
                userId: post.user_id,
                username: post.username,
                avatar: post.avatar,
                photo: post.photo,
                caption: post.caption,
                outfitId: post.outfit_id,
                outfitName: post.outfitName,
                outfitCategory: post.outfitCategory,
                outfitImageUrl: post.outfitImageUrl,
                location: post.location,
                likes: post.likesCount,
                saves: post.savesCount,
                likedByMe: post.likedByMe === 1 || post.likedByMe === true,
                savedByMe: post.savedByMe === 1 || post.savedByMe === true,
                comments,
                createdAt: post.created_at,
                updatedAt: post.updated_at
            });
        }

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Buat postingan baru
// @route   POST /api/posts
const createPost = async (req, res) => {
    const userId = req.user.id;
    const { photo, caption, outfitId, location } = req.body;
    if (!photo) {
        return res.status(400).json({ success: false, message: 'Foto postingan wajib diisi!' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO posts (user_id, photo, caption, outfit_id, location) VALUES (?, ?, ?, ?, ?)',
            [userId, photo, caption || null, outfitId || null, location || null]
        );
        res.status(201).json({
            success: true,
            message: 'Postingan berhasil dibuat',
            data: { id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Hapus postingan
// @route   DELETE /api/posts/:id
const deletePost = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [existing] = await db.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Postingan tidak ditemukan atau bukan milik Anda' });
        }
        await db.query('DELETE FROM posts WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Postingan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Like postingan
// @route   POST /api/posts/:id/like
const toggleLike = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [existing] = await db.query('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
        if (existing.length > 0) {
            await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
            res.status(200).json({ success: true, liked: false, message: 'Like dihapus' });
        } else {
            await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
            res.status(200).json({ success: true, liked: true, message: 'Berhasil me-like postingan' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Save postingan
// @route   POST /api/posts/:id/save
const toggleSave = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [existing] = await db.query('SELECT * FROM post_saves WHERE post_id = ? AND user_id = ?', [id, userId]);
        if (existing.length > 0) {
            await db.query('DELETE FROM post_saves WHERE post_id = ? AND user_id = ?', [id, userId]);
            res.status(200).json({ success: true, saved: false, message: 'Simpanan dihapus' });
        } else {
            await db.query('INSERT INTO post_saves (post_id, user_id) VALUES (?, ?)', [id, userId]);
            res.status(200).json({ success: true, saved: true, message: 'Berhasil menyimpan postingan' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tambah komentar pada postingan
// @route   POST /api/posts/:id/comments
const addComment = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { text } = req.body;
    if (!text || text.trim() === '') {
        return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong!' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO post_comments (post_id, user_id, text) VALUES (?, ?, ?)',
            [id, userId, text]
        );
        
        const [userRows] = await db.query('SELECT username, avatar FROM users WHERE id = ?', [userId]);

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                text,
                createdAt: new Date(),
                userId,
                username: userRows[0].username,
                avatar: userRows[0].avatar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Hapus komentar
// @route   DELETE /api/posts/:id/comments/:commentId
const deleteComment = async (req, res) => {
    const userId = req.user.id;
    const { id, commentId } = req.params;
    try {
        const [existing] = await db.query('SELECT * FROM post_comments WHERE id = ? AND post_id = ? AND user_id = ?', [commentId, id, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan atau bukan milik Anda' });
        }
        await db.query('DELETE FROM post_comments WHERE id = ?', [commentId]);
        res.status(200).json({ success: true, message: 'Komentar berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getPosts,
    createPost,
    deletePost,
    toggleLike,
    toggleSave,
    addComment,
    deleteComment
};
