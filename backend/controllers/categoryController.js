const db = require('../config/db');

// @desc    Ambil semua kategori
// @route   GET /api/categories
const getCategories = async (req, res) => {
    try {
        // Urutkan: "Semua" selalu pertama, lalu sistem, lalu custom alfabetis
        const [rows] = await db.query(
            `SELECT * FROM categories 
             ORDER BY 
               CASE WHEN LOWER(name) = 'semua' THEN 0
                    WHEN LOWER(name) IN ('atasan','bawahan','luar','sepatu') THEN 1
                    ELSE 2
               END,
               name ASC`
        );
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kategori',
            error: error.message
        });
    }
};

// @desc    Tambah kategori baru
// @route   POST /api/categories
const addCategory = async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Nama kategori wajib diisi!'
        });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 30) {
        return res.status(400).json({
            success: false,
            message: 'Nama kategori maksimal 30 karakter!'
        });
    }

    try {
        // Cek apakah kategori sudah ada (case-insensitive)
        const [existing] = await db.query('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)', [trimmedName]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Kategori sudah ada!'
            });
        }

        const [result] = await db.query(
            'INSERT INTO categories (name) VALUES (?)',
            [trimmedName]
        );
        res.status(201).json({
            success: true,
            message: 'Kategori berhasil ditambahkan',
            data: { id: result.insertId, name: trimmedName }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan kategori',
            error: error.message
        });
    }
};

// @desc    Update kategori
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Nama kategori wajib diisi!'
        });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 30) {
        return res.status(400).json({
            success: false,
            message: 'Nama kategori maksimal 30 karakter!'
        });
    }

    try {
        // Cek kategori yang diupdate
        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        const oldName = existing[0].name;

        // Cek kategori bawaan/sistem
        const systemCategories = ['semua', 'atasan', 'bawahan', 'luar', 'sepatu'];
        if (systemCategories.includes(oldName.toLowerCase())) {
            // Optional: User boleh merubah nama kategori bawaan jika diinginkan,
            // tetapi untuk amannya kita izinkan update dengan validasi keunikan.
        }

        // Cek apakah nama baru sama dengan kategori lain
        const [duplicate] = await db.query('SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [trimmedName, id]);
        if (duplicate.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Kategori dengan nama tersebut sudah ada!'
            });
        }

        // Update di tabel categories
        await db.query('UPDATE categories SET name = ? WHERE id = ?', [trimmedName, id]);

        // Otomatis update semua pakaian yang menggunakan kategori lama
        await db.query('UPDATE clothes SET category = ? WHERE category = ?', [trimmedName, oldName]);

        res.status(200).json({
            success: true,
            message: 'Kategori berhasil diperbarui',
            data: { id: parseInt(id), name: trimmedName }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui kategori',
            error: error.message
        });
    }
};

// @desc    Hapus kategori
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const { moveTo } = req.body; // Nama kategori tujuan jika pakaian dipindahkan

    try {
        const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        const categoryName = existing[0].name;

        // Cek kategori default (tidak boleh dihapus)
        const systemCategories = ['semua', 'atasan', 'bawahan', 'luar', 'sepatu'];
        if (systemCategories.includes(categoryName.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Kategori bawaan sistem tidak boleh dihapus!'
            });
        }

        // Cek apakah kategori masih digunakan oleh pakaian
        const [clothesUsing] = await db.query('SELECT * FROM clothes WHERE category = ?', [categoryName]);
        if (clothesUsing.length > 0) {
            if (!moveTo || moveTo.trim() === '') {
                return res.status(400).json({
                    success: false,
                    isUsed: true,
                    message: 'Kategori ini masih digunakan oleh beberapa pakaian.'
                });
            }

            const targetCategory = moveTo.trim();

            // Pindahkan pakaian ke kategori baru
            await db.query('UPDATE clothes SET category = ? WHERE category = ?', [targetCategory, categoryName]);
        }

        // Hapus kategori dari tabel
        await db.query('DELETE FROM categories WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Kategori berhasil dihapus'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus kategori',
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
};
