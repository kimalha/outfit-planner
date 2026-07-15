const db = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        res.status(201).json({ success: true, message: 'User berhasil didaftarkan' });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// LOGIN
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Password salah' });

        // Token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'SECRET_KEY_PADUKA', { expiresIn: '1d' });

        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            token,
            user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatar: user.avatar }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const ensureProfileColumns = async () => {
    const columns = [
        { name: 'fullname', type: 'VARCHAR(100) NULL' },
        { name: 'phone', type: 'VARCHAR(20) NULL' },
        { name: 'birthdate', type: 'VARCHAR(20) NULL' },
        { name: 'gender', type: 'VARCHAR(20) NULL' },
        { name: 'location', type: 'VARCHAR(100) NULL' }
    ];
    for (const col of columns) {
        try {
            await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
            console.log(`Column ${col.name} added successfully.`);
        } catch (err) {
            // Ignore error if column already exists (code ER_DUP_FIELDNAME or error number 1060)
            if (err.code !== 'ER_DUP_FIELDNAME' && err.errno !== 1060) {
                console.error(`Error adding column ${col.name}:`, err);
            }
        }
    }
};

const getProfile = async (req, res) => {
    const userId = req.user.id; 
    try {
        await ensureProfileColumns();
        const [rows] = await db.query(
            'SELECT id, username, email, bio, avatar, fullname, phone, birthdate, gender, location FROM users WHERE id = ?', 
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        
        // Fetch style preferences
        const [styleRows] = await db.query('SELECT style FROM style_preferences WHERE user_id = ?', [userId]);
        const stylePreferences = styleRows.map(r => r.style);

        const profileData = {
            ...rows[0],
            stylePreferences
        };
        res.status(200).json(profileData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { username, email, bio, fullname, phone, birthdate, gender, location, stylePreferences } = req.body;
    
    // Check if new avatar is uploaded
    let avatar = null;
    if (req.file) {
        const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'avatars');
        if (cloudinaryUrl) {
            avatar = cloudinaryUrl;
        } else {
            if (process.env.NODE_ENV === 'production') {
                return res.status(400).json({ success: false, message: 'Gagal mengupload avatar ke Cloudinary. Cloudinary wajib di production!' });
            }
            avatar = `http://localhost:5000/uploads/${req.file.filename}`;
        }
    }
    
    try {
        await ensureProfileColumns();

        // Retrieve existing user data
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const user = existing[0];
        const finalAvatar = avatar || user.avatar;

        // Perform the update
        await db.query(
            `UPDATE users SET 
                username = ?, 
                email = ?, 
                bio = ?, 
                avatar = ?, 
                fullname = ?, 
                phone = ?, 
                birthdate = ?, 
                gender = ?, 
                location = ? 
             WHERE id = ?`,
            [
                username || user.username,
                email || user.email,
                bio !== undefined ? bio : user.bio,
                finalAvatar,
                fullname !== undefined ? fullname : user.fullname,
                phone !== undefined ? phone : user.phone,
                birthdate !== undefined ? birthdate : user.birthdate,
                gender !== undefined ? gender : user.gender,
                location !== undefined ? location : user.location,
                userId
            ]
        );

        // Update style preferences if provided
        if (stylePreferences !== undefined) {
            let styles = [];
            if (typeof stylePreferences === 'string') {
                try {
                    styles = JSON.parse(stylePreferences);
                } catch (e) {
                    styles = stylePreferences.split(',').map(s => s.trim()).filter(Boolean);
                }
            } else if (Array.isArray(stylePreferences)) {
                styles = stylePreferences;
            }

            await db.query('DELETE FROM style_preferences WHERE user_id = ?', [userId]);
            for (const style of styles) {
                await db.query('INSERT IGNORE INTO style_preferences (user_id, style) VALUES (?, ?)', [userId, style]);
            }
        }

        // Fetch updated profile
        const [updatedRows] = await db.query(
            'SELECT id, username, email, bio, avatar, fullname, phone, birthdate, gender, location FROM users WHERE id = ?',
            [userId]
        );

        const [styleRows] = await db.query('SELECT style FROM style_preferences WHERE user_id = ?', [userId]);
        const finalStylePreferences = styleRows.map(r => r.style);

        res.status(200).json({
            success: true,
            message: 'Profil berhasil diperbarui',
            user: {
                ...updatedRows[0],
                stylePreferences: finalStylePreferences
            }
        });
    } catch (error) {
        console.error("Gagal memperbarui profil:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { register, login, getProfile, updateProfile };