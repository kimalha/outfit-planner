const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Cek apakah authHeader ada. Jika tidak, langsung return error 401
    if (!authHeader) {
        return res.status(401).json({ message: "Token tidak ditemukan, akses ditolak" });
    }

    // Ambil token (formatnya biasanya: "Bearer <token>")
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Format token salah" });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY_PADUKA', (err, user) => {
        if (err) return res.status(403).json({ message: "Token tidak valid" });
        req.user = user;
        next();
    });
};

module.exports = verifyToken;