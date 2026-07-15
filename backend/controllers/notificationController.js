const db = require('../config/db');

// @desc    Ambil semua notifikasi untuk user
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.query(
            'SELECT id, content, is_read as isRead, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tambah notifikasi baru
// @route   POST /api/notifications
const addNotification = async (req, res) => {
    const userId = req.user.id;
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ success: false, message: 'Konten notifikasi wajib diisi' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, content) VALUES (?, ?)',
            [userId, content]
        );
        res.status(201).json({
            success: true,
            data: { id: result.insertId, content, isRead: false, createdAt: new Date() }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tandai satu notifikasi sebagai dibaca
// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        res.status(200).json({ success: true, message: 'Notifikasi ditandai sebagai dibaca' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tandai semua notifikasi sebagai dibaca
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            [userId]
        );
        res.status(200).json({ success: true, message: 'Semua notifikasi ditandai sebagai dibaca' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Hapus notifikasi
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        res.status(200).json({ success: true, message: 'Notifikasi berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
