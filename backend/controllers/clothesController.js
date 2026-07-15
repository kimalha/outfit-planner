const db = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Ambil semua data baju untuk user yang login
// @route   GET /api/clothes
const getClothes = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.query('SELECT * FROM clothes WHERE user_id = ?', [userId]);
        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data baju',
            error: error.message
        });
    }
};

// @desc    Tambah baju baru (mendukung JSON biasa & file upload)
// @route   POST /api/clothes
const addClothes = async (req, res) => {
    const userId = req.user.id;
    const { name, category } = req.body;

    let image_url = req.body.image_url || null;

    if (req.file) {
        const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'clothes');
        if (cloudinaryUrl) {
            image_url = cloudinaryUrl;
        } else {
            if (process.env.NODE_ENV === 'production') {
                return res.status(400).json({ success: false, message: 'Gagal mengupload gambar ke Cloudinary. Cloudinary wajib di production!' });
            }
            image_url = `http://localhost:5000/uploads/${req.file.filename}`;
        }
    } else if (process.env.NODE_ENV === 'production' && !image_url) {
        return res.status(400).json({ success: false, message: 'Gambar wajib diunggah di production!' });
    }

    const last_worn = req.body.last_worn || null;
    const is_favorite = req.body.is_favorite !== undefined ? req.body.is_favorite : 0;

    if (!name || !category) {
        return res.status(400).json({
            success: false,
            message: 'Nama dan kategori wajib diisi!'
        });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO clothes (user_id, name, category, image_url, last_worn, is_favorite) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, category, image_url, last_worn, is_favorite]
        );
        res.status(201).json({
            success: true,
            message: 'Baju berhasil ditambahkan',
            data: { id: result.insertId, name, category, image_url, is_favorite }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Fungsi Update Baju
const updateClothes = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, category, image_url, last_worn, is_favorite } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM clothes WHERE id = ? AND user_id = ?', [id, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Baju tidak ditemukan atau bukan milik Anda' });
        }
        
        const item = existing[0];
        const finalName = name !== undefined ? name : item.name;
        const finalCategory = category !== undefined ? category : item.category;
        const finalImageUrl = image_url !== undefined ? image_url : item.image_url;
        const finalLastWorn = last_worn !== undefined ? last_worn : item.last_worn;
        const finalIsFavorite = is_favorite !== undefined ? is_favorite : item.is_favorite;

        await db.query(
            'UPDATE clothes SET name=?, category=?, image_url=?, last_worn=?, is_favorite=? WHERE id=? AND user_id=?',
            [finalName, finalCategory, finalImageUrl, finalLastWorn, finalIsFavorite, id, userId]
        );
        res.status(200).json({ success: true, message: 'Baju berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Fungsi Hapus Baju
const deleteClothes = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const [existing] = await db.query('SELECT * FROM clothes WHERE id = ? AND user_id = ?', [id, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Baju tidak ditemukan atau bukan milik Anda' });
        }

        await db.query('DELETE FROM clothes WHERE id=? AND user_id=?', [id, userId]);
        res.status(200).json({ success: true, message: 'Baju berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getClothes, addClothes, updateClothes, deleteClothes };
