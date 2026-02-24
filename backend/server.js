const express = require('express');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 🟢 1. Database Connections ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'cinema_db',
    waitForConnections: true,
    connectionLimit: 10
});

const mongoURI = process.env.MONGO_URI || 'mongodb://mongo_db:27017/cinema_logs';
mongoose.connect(mongoURI)
    .then(() => console.log('🍃 MongoDB Connected (Seating & Logs)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 🔵 2. MongoDB Schemas & Models ---
const theaterSchema = new mongoose.Schema({
    showtimeId: { type: Number, required: true, unique: true },
    movieId: Number,
    theaterName: String,
    seats: [{
        seatNumber: String,
        isReserved: { type: Boolean, default: false },
        reservedUntil: Date, 
        price: { type: Number, default: 200 }
    }]
});
const Theater = mongoose.model('Theater', theaterSchema);

const paymentSchema = new mongoose.Schema({
    showtimeId: Number,
    seatNumbers: [String],
    amount: Number,
    status: { type: String, default: 'completed' },
    timestamp: { type: Date, default: Date.now }
});
const Payment = mongoose.model('Payment', paymentSchema);

// --- 🔴 3. API Routes ---

// --- [MySQL] Movies Management ---

// ดึงข้อมูลหนังทั้งหมด
app.get('/api/movies', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM movies ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// เพิ่มหนังใหม่
app.post('/api/movies', async (req, res) => {
    const { title, genre, duration, poster_url } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO movies (title, genre, duration, poster_url) VALUES (?, ?, ?, ?)',
            [title, genre, duration, poster_url]
        );
        res.json({ id: result.insertId, title, genre, duration, poster_url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// แก้ไขข้อมูลหนัง
app.put('/api/movies/:id', async (req, res) => {
    const { title, genre, duration, poster_url } = req.body;
    try {
        await db.query(
            'UPDATE movies SET title = ?, genre = ?, duration = ?, poster_url = ? WHERE id = ?',
            [title, genre, duration, poster_url, req.params.id]
        );
        res.json({ message: "Movie updated successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ลบหนัง
app.delete('/api/movies/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM movies WHERE id = ?', [req.params.id]);
        res.json({ message: "Movie deleted from MySQL" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- [MySQL] Showtimes Management ---

// ดึงรอบฉายของหนังแต่ละเรื่อง
app.get('/api/movies/:id/showtimes', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, show_time, theater_no FROM showtimes WHERE movie_id = ? ORDER BY show_time', 
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// เพิ่มรอบฉายใหม่
app.post('/api/showtimes', async (req, res) => {
    const { movie_id, show_time, theater_no } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO showtimes (movie_id, show_time, theater_no) VALUES (?, ?, ?)',
            [movie_id, show_time, theater_no]
        );
        res.json({ id: result.insertId, movie_id, show_time, theater_no });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ลบรอบฉายและล้างผังที่นั่งใน MongoDB
app.delete('/api/showtimes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM showtimes WHERE id = ?', [req.params.id]);
        await Theater.deleteOne({ showtimeId: req.params.id });
        res.json({ message: "Showtime and seating data deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- [MongoDB] Seating & Bookings ---

// ดึงผังที่นั่งตามรอบฉาย (ถ้าไม่มีจะสร้างใหม่ให้อัตโนมัติ)
app.get('/api/theater/showtime/:showtimeId', async (req, res) => {
    const { showtimeId } = req.params;
    try {
        let theater = await Theater.findOne({ showtimeId });
        if (!theater) {
            const seats = [];
            // สร้าง 20 ที่นั่งเริ่มต้น (A1-D5)
            for (let i = 1; i <= 20; i++) {
                seats.push({ 
                    seatNumber: `${String.fromCharCode(64 + Math.ceil(i/5))}${i%5 || 5}`, 
                    isReserved: false, 
                    price: 200 
                });
            }
            theater = await Theater.create({ showtimeId, theaterName: "Standard Hall", seats });
        }
        res.json(theater);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// จองที่นั่งชั่วคราว (Hold Seats)
app.post('/api/bookings/hold', async (req, res) => {
    const { showtimeId, seatNumbers } = req.body;
    const holdUntil = new Date(Date.now() + 10 * 60 * 1000); // ล็อกไว้ 10 นาที

    try {
        const theater = await Theater.findOne({ showtimeId });
        if (!theater) return res.status(404).json({ error: "Theater not found" });

        theater.seats.forEach(seat => {
            if (seatNumbers.includes(seat.seatNumber)) {
                const isAlreadyHeld = seat.isReserved && seat.reservedUntil && seat.reservedUntil > new Date();
                const isSold = seat.isReserved && !seat.reservedUntil;
                if (isSold || isAlreadyHeld) throw new Error(`Seat ${seat.seatNumber} is taken`);
                
                seat.isReserved = true;
                seat.reservedUntil = holdUntil;
            }
        });
        await theater.save();
        res.json({ message: "Seats held successfully", expiresAt: holdUntil });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// ยืนยันการชำระเงินและล็อกที่นั่งถาวร
app.post('/api/payments/mock', async (req, res) => {
    const { showtimeId, seatNumbers, amount } = req.body;
    try {
        await Payment.create({ showtimeId, seatNumbers, amount });
        const theater = await Theater.findOne({ showtimeId });
        theater.seats.forEach(seat => {
            if (seatNumbers.includes(seat.seatNumber)) {
                seat.isReserved = true;
                seat.reservedUntil = null; // ลบเวลาหมดอายุออกเพื่อให้เป็นสถานะจองถาวร
            }
        });
        await theater.save();
        res.json({ message: "Payment confirmed!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ⚙️ 4. Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Cinema API is running on port ${PORT}`);
});