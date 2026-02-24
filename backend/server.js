const express = require('express');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 🟢 ส่วนการเชื่อมต่อฐานข้อมูล ---

// MySQL Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'cinema_db'
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://mongo_db:27017/cinema_logs';
mongoose.connect(mongoURI)
    .then(() => console.log('🍃 MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// --- 🔵 MongoDB Models (Schemas) ---

const Theater = mongoose.model('Theater', new mongoose.Schema({
    movieId: Number,
    theaterName: String,
    seats: [{
        seatNumber: String,
        isReserved: { type: Boolean, default: false },
        reservedUntil: Date, // null = จองถาวร, มีค่า = จองชั่วคราว
        price: { type: Number, default: 200 }
    }]
}));

const Payment = mongoose.model('Payment', new mongoose.Schema({
    amount: Number,
    method: String,
    status: String,
    timestamp: { type: Date, default: Date.now }
}));

// --- 🔴 API Routes ---

// 1. ดึงข้อมูลหนังจาก MySQL
app.get('/api/movies', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM movies ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. ดึงผังที่นั่งของหนังแต่ละเรื่องจาก MongoDB
app.get('/api/theater/:movieId', async (req, res) => {
    try {
        let theater = await Theater.findOne({ movieId: req.params.movieId });
        // ถ้ายังไม่มีโรงหนัง ให้ Mock ข้อมูลขึ้นมา 10 ที่นั่ง
        if (!theater) {
            const mockSeats = Array.from({ length: 10 }, (_, i) => ({
                seatNumber: `A${i + 1}`,
                isReserved: false,
                price: 200
            }));
            theater = await Theater.create({ movieId: req.params.movieId, theaterName: "Hall 1", seats: mockSeats });
        }
        res.json(theater);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. ระบบจองที่นั่งชั่วคราว (Hold Seats - 10 Mins)
app.post('/api/bookings/hold', async (req, res) => {
    const { movieId, seatNumbers } = req.body;
    const holdTime = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที
    try {
        const theater = await Theater.findOne({ movieId });
        theater.seats.forEach(seat => {
            if (seatNumbers.includes(seat.seatNumber)) {
                if (seat.isReserved && (!seat.reservedUntil || seat.reservedUntil > new Date())) {
                    throw new Error(`ที่นั่ง ${seat.seatNumber} ไม่ว่าง`);
                }
                seat.isReserved = true;
                seat.reservedUntil = holdTime;
            }
        });
        await theater.save();
        res.json({ message: "จองชั่วคราวสำเร็จ", expiresAt: holdTime });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 4. ระบบจ่ายเงินแบบ Mock
app.post('/api/payments/mock', async (req, res) => {
    const { movieId, seatNumbers, amount } = req.body;
    try {
        await Payment.create({ amount, method: "PromptPay Mock", status: "completed" });
        const theater = await Theater.findOne({ movieId });
        theater.seats.forEach(seat => {
            if (seatNumbers.includes(seat.seatNumber)) {
                seat.reservedUntil = null; // ยืนยันจองถาวร
            }
        });
        await theater.save();
        res.json({ message: "ชำระเงินและยืนยันที่นั่งสำเร็จ!" });
    } catch (err) { res.status(500).json({ error: "การชำระเงินผิดพลาด" }); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));