const express = require('express');
const cors = require('cors');
const db = require('./config/db'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ดึงรายการหนัง
app.get('/api/movies', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM movies ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เพิ่มหนัง
app.post('/api/movies', async (req, res) => {
    try {
        const { title, poster_url, duration, genre } = req.body;
        console.log("📥 Received:", req.body);
        
        const sql = 'INSERT INTO movies (title, poster_url, duration, genre) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [
            title, 
            poster_url || 'https://via.placeholder.com/300', 
            parseInt(duration) || 120, 
            genre || 'General'
        ]);
        
        res.status(201).json({ id: result.insertId, title, poster_url, duration, genre });
    } catch (err) {
        console.error("❌ SQL Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM movies WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบหนังที่ต้องการลบ" });
        }
        
        res.json({ message: "ลบหนังสำเร็จ!" });
    } catch (err) {
        console.error("❌ Delete Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MySQL Backend ready on port ${PORT}`));