const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const clothesRoutes = require('./routes/clothesRoutes');
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const postRoutes = require('./routes/postRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const migrateRoutes = require('./routes/migrateRoutes');

dotenv.config();

console.log("=== Active Environment Variable Keys ===");
console.log(Object.keys(process.env).filter(k => 
  !k.toLowerCase().includes('pass') && 
  !k.toLowerCase().includes('secret') && 
  !k.toLowerCase().includes('key')
));
console.log("========================================");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sajikan folder uploads sebagai file statis
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mapping Endpoint API
app.get('/api/debug-env', (req, res) => {
    const keys = Object.keys(process.env).map(key => {
        const lowerKey = key.toLowerCase();
        let value = process.env[key];
        if (lowerKey.includes('pass') || lowerKey.includes('secret') || lowerKey.includes('key') || lowerKey.includes('token')) {
            value = '***MASKED***';
        }
        return { key, value };
    });
    res.json({ success: true, env: keys });
});

app.use('/api/clothes', clothesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/migrate', migrateRoutes);

// Test Route Utama
app.get('/', (req, res) => {
    res.send('Backend Outfit.in Ready!');
});

app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
});