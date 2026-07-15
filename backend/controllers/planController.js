const db = require('../config/db');

// Ambil semua jadwal atau filter berdasarkan tanggal untuk user yang login
const getPlans = async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query; // contoh: ?date=2026-06-30
    try {
        let query = 'SELECT * FROM daily_plans WHERE user_id = ?';
        let params = [userId];

        if (date) {
            query += ' AND date = ?';
            params.push(date);
        }

        const [plans] = await db.query(query, params);
        
        const results = [];
        for (const plan of plans) {
            // Fetch outfits linked to this plan
            const [outfits] = await db.query(
                `SELECT c.* FROM clothes c
                 JOIN plan_outfits po ON c.id = po.clothes_id
                 WHERE po.plan_id = ? AND c.user_id = ?`,
                [plan.id, userId]
            );
            
            // Fetch activities linked to this plan
            const [activities] = await db.query(
                `SELECT id, title, start_time as startTime, end_time as endTime, note, period 
                 FROM plan_activities WHERE plan_id = ?`,
                [plan.id]
            );

            // Format date object/string for JSON response
            let formattedDate = plan.date;
            if (plan.date instanceof Date) {
                // Keep local timezone format YYYY-MM-DD
                const year = plan.date.getFullYear();
                const month = String(plan.date.getMonth() + 1).padStart(2, '0');
                const day = String(plan.date.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }

            results.push({
                id: plan.id,
                date: formattedDate,
                confirmed: plan.confirmed === 1,
                outfits,
                activities
            });
        }

        if (date) {
            return res.status(200).json({ success: true, data: results[0] || null });
        }
        
        // Return as key-value pair for easy context mapping: { "YYYY-MM-DD": { outfits, activities, confirmed } }
        const dataMap = {};
        results.forEach(p => {
            dataMap[p.date] = {
                outfits: p.outfits,
                activities: p.activities,
                confirmed: p.confirmed
            };
        });

        res.status(200).json({ success: true, data: dataMap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Tambah/Update jadwal harian (mendukung batch insert outfits & activities)
const savePlan = async (req, res) => {
    const userId = req.user.id;
    const { date, outfits, activities, confirmed } = req.body;

    if (!date) {
        return res.status(400).json({ success: false, message: 'Tanggal wajib diisi!' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Cek atau buat record daily_plans
        const [planRows] = await connection.query(
            'SELECT id FROM daily_plans WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        let planId;
        const isConfirmed = confirmed !== undefined ? (confirmed ? 1 : 0) : 0;

        if (planRows.length > 0) {
            planId = planRows[0].id;
            await connection.query(
                'UPDATE daily_plans SET confirmed = ? WHERE id = ?',
                [isConfirmed, planId]
            );
        } else {
            const [insertResult] = await connection.query(
                'INSERT INTO daily_plans (user_id, date, confirmed) VALUES (?, ?, ?)',
                [userId, date, isConfirmed]
            );
            planId = insertResult.insertId;
        }

        // 2. Simpan outfit yang dipilih
        if (outfits !== undefined) {
            await connection.query('DELETE FROM plan_outfits WHERE plan_id = ?', [planId]);
            for (const outfit of outfits) {
                await connection.query(
                    'INSERT INTO plan_outfits (plan_id, clothes_id) VALUES (?, ?)',
                    [planId, outfit.id]
                );
            }

            // Jika dikonfirmasi (confirmed), update last_worn di tabel clothes
            if (isConfirmed) {
                for (const outfit of outfits) {
                    await connection.query(
                        'UPDATE clothes SET last_worn = ? WHERE id = ? AND user_id = ?',
                        [date, outfit.id, userId]
                    );
                }
            }
        }

        // 3. Simpan daftar kegiatan
        if (activities !== undefined) {
            await connection.query('DELETE FROM plan_activities WHERE plan_id = ?', [planId]);
            for (const act of activities) {
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

        await connection.commit();
        res.status(200).json({ success: true, message: 'Rencana kalender berhasil disimpan' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};

module.exports = { getPlans, savePlan };