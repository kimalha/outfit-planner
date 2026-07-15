const db = require('../config/db');

// @desc    Batch migrasi data dari localStorage ke MySQL
// @route   POST /api/migrate
const migrateData = async (req, res) => {
    const userId = req.user.id;
    const { plannerData, notifications, stylePreferences, posts } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Cek apakah user sudah memiliki data di database (hindari duplikasi migrasi)
        const [existingClothes] = await connection.query('SELECT id FROM clothes WHERE user_id = ? LIMIT 1', [userId]);
        const [existingPlans] = await connection.query('SELECT id FROM daily_plans WHERE user_id = ? LIMIT 1', [userId]);
        const [existingPosts] = await connection.query('SELECT id FROM posts WHERE user_id = ? LIMIT 1', [userId]);

        if (existingClothes.length > 0 || existingPlans.length > 0 || existingPosts.length > 0) {
            await connection.rollback();
            return res.status(200).json({
                success: true,
                message: 'User sudah memiliki data di database, migrasi dilewati.'
            });
        }

        // 2. Kumpulkan seluruh pakaian unik dari plannerData
        const legacyClothesMap = new Map(); // key: legacy_id, value: clothes object
        if (plannerData) {
            for (const dateKey of Object.keys(plannerData)) {
                const day = plannerData[dateKey];
                if (day.outfits && Array.isArray(day.outfits)) {
                    for (const outfit of day.outfits) {
                        if (outfit && outfit.id) {
                            legacyClothesMap.set(outfit.id, outfit);
                        }
                    }
                }
            }
        }

        // 3. Masukkan pakaian unik ke tabel clothes dan buat mapping ID baru
        const clothesIdMapping = {}; // key: legacy_id, value: new_db_id
        for (const [legacyId, outfit] of legacyClothesMap.entries()) {
            const isFavorite = outfit.is_favorite ? 1 : 0;
            const lastWorn = outfit.last_worn || null;
            const [insertResult] = await connection.query(
                `INSERT INTO clothes (user_id, name, category, image_url, is_favorite, color, tags, last_worn) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, outfit.name, outfit.category, outfit.image_url, isFavorite, outfit.color || null, outfit.tags || null, lastWorn]
            );
            clothesIdMapping[legacyId] = insertResult.insertId;
        }

        // 4. Masukkan planner data (daily_plans, plan_outfits, plan_activities)
        if (plannerData) {
            for (const dateKey of Object.keys(plannerData)) {
                const day = plannerData[dateKey];
                const confirmed = day.confirmed ? 1 : 0;

                // Buat daily_plans
                const [planResult] = await connection.query(
                    'INSERT INTO daily_plans (user_id, date, confirmed) VALUES (?, ?, ?)',
                    [userId, dateKey, confirmed]
                );
                const planId = planResult.insertId;

                // Masukkan plan_outfits
                if (day.outfits && Array.isArray(day.outfits)) {
                    for (const outfit of day.outfits) {
                        if (outfit && outfit.id) {
                            const newClothesId = clothesIdMapping[outfit.id];
                            if (newClothesId) {
                                await connection.query(
                                    'INSERT INTO plan_outfits (plan_id, clothes_id) VALUES (?, ?)',
                                    [planId, newClothesId]
                                );
                            }
                        }
                    }
                }

                // Masukkan plan_activities
                if (day.activities && Array.isArray(day.activities)) {
                    for (const act of day.activities) {
                        const startTime = act.startTime || '';
                        const endTime = act.endTime || '';
                        const note = act.note || null;
                        const period = act.period || 'MORNING';
                        await connection.query(
                            `INSERT INTO plan_activities (plan_id, title, start_time, end_time, note, period) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [planId, act.title, startTime, endTime, note, period]
                        );
                    }
                }
            }
        }

        // 5. Masukkan style preferences
        if (stylePreferences && Array.isArray(stylePreferences)) {
            for (const style of stylePreferences) {
                if (style) {
                    await connection.query(
                        'INSERT IGNORE INTO style_preferences (user_id, style) VALUES (?, ?)',
                        [userId, style]
                    );
                }
            }
        }

        // 6. Masukkan notifications
        if (notifications && Array.isArray(notifications)) {
            for (const notify of notifications) {
                if (notify && notify.content) {
                    const isRead = notify.isRead ? 1 : 0;
                    const createdAt = notify.createdAt ? new Date(notify.createdAt) : new Date();
                    await connection.query(
                        'INSERT INTO notifications (user_id, content, is_read, created_at) VALUES (?, ?, ?, ?)',
                        [userId, notify.content, isRead, createdAt]
                    );
                }
            }
        }

        // 7. Masukkan posts
        if (posts && Array.isArray(posts)) {
            for (const post of posts) {
                if (post && post.photo) {
                    const legacyOutfitId = post.outfitId;
                    const newOutfitId = legacyOutfitId ? (clothesIdMapping[legacyOutfitId] || null) : null;
                    const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
                    
                    const [postResult] = await connection.query(
                        'INSERT INTO posts (user_id, photo, caption, outfit_id, location, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, post.photo, post.caption || null, newOutfitId, post.location || null, createdAt]
                    );

                    // Jika post memiliki comments lama, migrasikan komentar tersebut
                    if (post.comments && Array.isArray(post.comments)) {
                        for (const comm of post.comments) {
                            if (comm && comm.text) {
                                const commCreatedAt = comm.createdAt ? new Date(comm.createdAt) : new Date();
                                // Gunakan userId yang sedang login sebagai pembuat komentar agar konsisten
                                await connection.query(
                                    'INSERT INTO post_comments (post_id, user_id, text, created_at) VALUES (?, ?, ?, ?)',
                                    [postResult.insertId, userId, comm.text, commCreatedAt]
                                );
                            }
                        }
                    }
                }
            }
        }

        await connection.commit();
        res.status(200).json({
            success: true,
            message: 'Migrasi data dari localStorage berhasil diselesaikan.'
        });
    } catch (error) {
        await connection.rollback();
        console.error("Gagal melakukan migrasi data:", error);
        res.status(500).json({
            success: false,
            message: 'Gagal melakukan migrasi data',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = { migrateData };
