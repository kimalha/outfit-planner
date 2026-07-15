const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getClothes, addClothes, updateClothes, deleteClothes } = require('../controllers/clothesController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

// Konfigurasi Multer untuk upload gambar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'clothes-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // max 5MB
});

router.route('/')
    .get(getClothes)
    .post(upload.single('image'), addClothes);

router.route('/:id')
    .put(updateClothes)
    .delete(deleteClothes);

module.exports = router;