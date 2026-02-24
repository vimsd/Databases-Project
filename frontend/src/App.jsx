import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// --- 1. หน้าจองที่นั่ง (Seating Page - เชื่อม MongoDB) ---
// --- 1. หน้าจองที่นั่ง (Seating Page - เชื่อม MongoDB แยกตามรอบฉาย) ---
function BookingPage() {
    // แก้ไข: ใช้ showtimeId เพื่อให้ตรงกับ Logic ของรอบฉาย
    const { showtimeId } = useParams(); 
    const navigate = useNavigate();
    const [theater, setTheater] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);

    // 1. ดึงข้อมูลที่นั่งตามรอบฉาย (Showtime ID)
    useEffect(() => {
        // ดึงผังที่นั่งจาก MongoDB โดยใช้ ID ของรอบฉาย
        axios.get(`${API_URL}/theater/showtime/${showtimeId}`)
            .then(res => setTheater(res.data))
            .catch(err => {
                console.error("Fetch error:", err);
                alert("ไม่สามารถโหลดผังที่นั่งได้");
            });
    }, [showtimeId]);

    // 2. ฟังก์ชันจองและชำระเงิน
    const handleBookingProcess = async () => {
        if (selectedSeats.length === 0) return;

        try {
            // สั่ง Hold ที่นั่งชั่วคราว
            await axios.post(`${API_URL}/bookings/hold`, { 
                showtimeId: showtimeId, 
                seatNumbers: selectedSeats 
            });

            const total = selectedSeats.length * 200;
            const confirmPay = window.confirm(
                `🎬 ยืนยันการจองที่นั่ง: ${selectedSeats.join(', ')}\nยอดชำระ: ${total.toLocaleString()} บาท`
            );

            if (confirmPay) {
                // ยืนยันการชำระเงิน (จะทำให้ isReserved กลายเป็น true ถาวรในรอบนั้น)
                await axios.post(`${API_URL}/payments/mock`, { 
                    showtimeId: showtimeId, 
                    seatNumbers: selectedSeats, 
                    amount: total 
                });
                alert("✨ ชำระเงินสำเร็จ! ขอให้สนุกกับการชมภาพยนตร์");
                navigate('/');
            }
        } catch (err) {
            alert(err.response?.data?.error || "เกิดข้อผิดพลาดในการจอง");
            window.location.reload(); // รีโหลดเพื่ออัปเดตสถานะที่นั่งล่าสุด
        }
    };

    if (!theater) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
        </div>
    );

    return (
        // เพิ่ม pb-40 เพื่อป้องกันไม่ให้แถบชำระเงินด้านล่างทับที่นั่งแถวสุดท้าย
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 pb-40 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-16">
                    <div className="space-y-2">
                        <button onClick={() => navigate('/')} className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-70 transition-all">
                            ← Back to Home
                        </button>
                        <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
                            {theater.theaterName || "Main Hall"}
                        </h2>
                        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Premium Experience</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Seat Price</p>
                        <p className="text-2xl font-black text-cyan-400">200.00 <span className="text-xs">THB</span></p>
                    </div>
                </div>

                {/* Cinema Screen Layout */}
                <div className="relative mb-24 group">
                    <div className="w-full h-4 bg-cyan-500 opacity-20 rounded-[100%] blur-2xl group-hover:opacity-40 transition-opacity"></div>
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full shadow-[0_0_25px_rgba(6,182,212,1)]"></div>
                    <p className="text-center text-[9px] font-black tracking-[1.5em] text-cyan-500/40 mt-6 uppercase">Screen</p>
                </div>

                {/* Seating Grid */}
                <div className="bg-slate-900/40 backdrop-blur-2xl p-10 sm:p-14 rounded-[4rem] border border-white/5 shadow-2xl">
                    <div className="grid grid-cols-5 gap-4 sm:gap-6 mb-16">
                        {theater.seats.map(seat => {
                            const isSold = seat.isReserved && !seat.reservedUntil;
                            const isHeld = seat.isReserved && seat.reservedUntil && new Date(seat.reservedUntil) > new Date();
                            const isSelected = selectedSeats.includes(seat.seatNumber);

                            return (
                                <button
                                    key={seat.seatNumber}
                                    disabled={isSold || isHeld}
                                    onClick={() => setSelectedSeats(prev => 
                                        isSelected ? prev.filter(s => s !== seat.seatNumber) : [...prev, seat.seatNumber]
                                    )}
                                    className={`
                                        relative h-14 sm:h-20 rounded-2xl font-black text-sm transition-all duration-300 transform
                                        ${isSold ? 'bg-slate-800/30 text-slate-700 cursor-not-allowed' : 
                                          isHeld ? 'bg-amber-600/20 text-amber-600 cursor-wait' :
                                          isSelected ? 'bg-cyan-500 text-black scale-110 shadow-[0_0_30px_rgba(6,182,212,0.6)]' : 
                                          'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:scale-105'}
                                    `}
                                >
                                    {seat.seatNumber}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-10 py-8 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-500 rounded-sm"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-slate-800 opacity-30 rounded-sm"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Reserved</span>
                        </div>
                    </div>
                </div>

                {/* Floating Payment Bar (z-50 เพื่อให้อยู่หน้าสุด) */}
                <div className={`
                    fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white p-6 rounded-[2.5rem] 
                    flex justify-between items-center transition-all duration-700 shadow-2xl z-50
                    ${selectedSeats.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0 pointer-events-none'}
                `}>
                    <div className="pl-4">
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Total Price</p>
                        <p className="text-slate-900 font-black text-xl tracking-tighter">
                            {selectedSeats.length} SEATS <span className="text-slate-300 mx-2">|</span> ฿{(selectedSeats.length * 200).toLocaleString()}
                        </p>
                    </div>
                    <button 
                        onClick={handleBookingProcess}
                        className="bg-cyan-500 hover:bg-slate-900 hover:text-white text-black px-10 py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95"
                    >
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
// Helper Component สำหรับ Legend
function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${color} rounded-sm`}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
    );
}
// --- 2. หน้าจัดการหนัง (Manage/Delete Page) ---
// --- เพิ่ม/แก้ไขฟังก์ชัน ManageMoviePage เพื่อให้รองรับการอัปเดต List หนัง ---
function ManageMoviePage({ movies, setMovies }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState({
        title: '',
        genre: '',
        duration: '',
        poster_url: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ดึงข้อมูลจาก State แทนการยิง API ใหม่เพื่อความเร็ว
        const targetMovie = movies.find(m => m.id === parseInt(id));
        if (targetMovie) {
            setMovie(targetMovie);
            setLoading(false);
        } else {
            // ถ้าหาใน State ไม่เจอ (เช่น กด Refresh หน้าจัดการ) ให้ดึงจาก API
            axios.get(`${API_URL}/movies`)
                .then(res => {
                    const found = res.data.find(m => m.id === parseInt(id));
                    if (found) setMovie(found);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [id, movies]);

    const handleUpdateMovie = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/movies/${id}`, movie);
            
            // *** สำคัญ: อัปเดต State หลัก (movies) เพื่อให้หน้า Home เปลี่ยนตามทันที ***
            setMovies(prev => prev.map(m => m.id === parseInt(id) ? { ...m, ...movie } : m));
            
            alert("✅ อัปเดตข้อมูลหนังสำเร็จ");
            navigate('/');
        } catch (err) {
            alert("❌ อัปเดตไม่สำเร็จ: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteMovie = async () => {
        if(window.confirm("🚨 ลบหนังเรื่องนี้ออกจากระบบถาวร? (รอบฉายและผังที่นั่งจะถูกลบด้วย)")) {
            try {
                await axios.delete(`${API_URL}/movies/${id}`);
                // อัปเดต State โดยการกรองหนังที่ลบออก
                setMovies(prev => prev.filter(m => m.id !== parseInt(id)));
                navigate('/');
            } catch (err) {
                alert("ลบไม่สำเร็จ");
            }
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-black italic animate-pulse">LOADING CORE DATA...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-20">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
                
                {/* ฝั่งซ้าย: ฟอร์มแก้ไขข้อมูลหนัง */}
                <div className="space-y-8">
                    <button onClick={() => navigate('/')} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-cyan-500 transition-all flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
                    </button>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
                        Edit Movie Info
                    </h2>

                    <form onSubmit={handleUpdateMovie} className="space-y-4 bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Movie Title</label>
                            <input 
                                type="text" 
                                value={movie.title}
                                onChange={e => setMovie({...movie, title: e.target.value})}
                                className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Genre</label>
                                <input 
                                    type="text" 
                                    value={movie.genre}
                                    onChange={e => setMovie({...movie, genre: e.target.value})}
                                    className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Min</label>
                                <input 
                                    type="number" 
                                    value={movie.duration}
                                    onChange={e => setMovie({...movie, duration: e.target.value})}
                                    className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Poster URL</label>
                            <input 
                                type="text" 
                                value={movie.poster_url}
                                onChange={e => setMovie({...movie, poster_url: e.target.value})}
                                className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-xs"
                            />
                        </div>
                        <button type="submit" className="w-full bg-cyan-500 hover:bg-white text-black font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest mt-4">
                            Save Movie Changes
                        </button>
                    </form>
                </div>

                {/* ฝั่งขวา: จัดการรอบฉาย */}
                <div className="flex flex-col">
                    <div className="mb-8">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-800">
                            Showtimes
                        </h2>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">Manage session timing</p>
                    </div>
                    
                    <ManageShowtimes movieId={id} />

                    <div className="mt-auto pt-10">
                        <div className="bg-red-500/5 p-6 rounded-[2rem] border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                            <p className="text-[9px] font-black text-red-500/40 uppercase tracking-[0.2em] mb-3 text-center">System Termination</p>
                            <button 
                                onClick={handleDeleteMovie}
                                className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black transition-all border border-red-500/20"
                            >
                                DELETE FILM
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 3. หน้าเพิ่มหนังใหม่ (Add Movie Page) ---
function AddMoviePage({ setMovies }) {
    const [newMovie, setNewMovie] = useState({ title: '', genre: '', duration: '', poster_url: '' });
    const navigate = useNavigate();

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/movies`, newMovie);
            setMovies(prev => [res.data, ...prev]);
            alert("✅ เพิ่มหนังสำเร็จ!");
            navigate('/');
        } catch (err) { alert("เพิ่มไม่สำเร็จ"); }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center">
            <form onSubmit={handleAdd} className="bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md border border-white/10 space-y-4">
                <h2 className="text-2xl font-bold mb-6 text-cyan-400 text-center">Add New Movie</h2>
                <input placeholder="Title" className="w-full p-4 rounded-xl bg-slate-800" onChange={e => setNewMovie({...newMovie, title: e.target.value})} required />
                <button type="submit" className="w-full bg-cyan-600 py-4 rounded-xl font-bold">Save to MySQL</button>
            </form>
        </div>
    );
}

// --- 4. หน้าหลัก (Home Page) ---
function HomePage({ movies, user, setUser }) {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-12 selection:bg-cyan-500/30">
            {/* Navigation Bar - บีบเข้ากึ่งกลางด้วย max-w-7xl */}
            <nav className="flex justify-between items-center mb-16 max-w-7xl mx-auto border-b border-white/5 pb-8">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 italic tracking-tighter">
                        MOVIESQL.CORE
                    </h1>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em]">Integrated Cinema System</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Session</p>
                        <p className="text-xs font-bold text-cyan-500 uppercase">{user.role}</p>
                    </div>
                    <button 
                        onClick={() => setUser(null)} 
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-2xl transition-all group"
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Main Content Area - บีบเข้ากึ่งกลางด้วย max-w-7xl */}
            <main className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div className="space-y-1">
                        <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
                            Now Showing
                        </h2>
                        <p className="text-cyan-500/50 font-bold text-sm uppercase tracking-[0.3em] ml-1">Current Feature Presentations</p>
                    </div>

                    {user.role === 'admin' && (
                        <Link 
                            to="/add-movie" 
                            className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                            + Add New Film
                        </Link>
                    )}
                </div>

                {/* Grid Layout - ปรับการเรียงตัวของแผ่นหนัง */}
                {movies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {movies.map(m => (
                            <MovieCard key={m.id} movie={m} user={user} />
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-slate-600 font-black uppercase tracking-widest animate-pulse">No Movies Found in Database</p>
                    </div>
                )}
            </main>

            <footer className="mt-32 text-center border-t border-white/5 pt-10 max-w-7xl mx-auto">
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.5em]">
                    Powered by Node.js • MySQL • MongoDB • Docker
                </p>
            </footer>
        </div>
    );
}

function MovieCard({ movie, user }) {
    const [showtimes, setShowtimes] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/movies/${movie.id}/showtimes`)
            .then(res => {
                console.log(`Showtimes for ${movie.title}:`, res.data);
                setShowtimes(res.data);
            })
            .catch(err => console.error("Error fetching showtimes:", err));
    }, [movie.id]);

    return (
        <div className="bg-slate-900/50 rounded-[2.5rem] overflow-hidden border border-white/5 p-6 flex flex-col h-full hover:border-cyan-500/50 transition-all duration-500 group shadow-2xl backdrop-blur-sm">
            
            {/* 1. Poster Section - จำกัดความสูงไว้ที่ h-48 เพื่อให้ UI ไม่ยืดเกินไป */}
            <div className="relative h-48 mb-6 bg-slate-800 rounded-3xl overflow-hidden shrink-0">
                <img 
                    src={movie.poster_url || 'https://via.placeholder.com/300x450'} 
                    alt={movie.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-cyan-400 uppercase tracking-widest border border-white/10">
                    {movie.genre || 'Action'}
                </div>
            </div>
            
            {/* 2. Movie Info - ใช้ flex-grow เพื่อดันส่วน Select Showtime ลงไปด้านล่างเสมอ */}
            <div className="flex-grow mb-6">
                <h3 className="text-xl font-black mb-1 truncate text-white uppercase tracking-tighter italic group-hover:text-cyan-400 transition-colors">
                    {movie.title}
                </h3>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                    Duration: {movie.duration || '120'} MIN
                </p>
            </div>
            
            {/* 3. Showtime Selection Section - เพิ่มเส้นคั่นและจัดระเบียบปุ่ม */}
            <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-slate-400 text-[9px] font-black mb-4 uppercase tracking-[0.3em] opacity-60 text-center">
                    Select Showtime
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {showtimes && showtimes.length > 0 ? (
                        showtimes.map(st => (
                            <Link 
                                key={st.id} 
                                to={`/book/${st.id}`} 
                                className="text-center py-2.5 bg-slate-800 hover:bg-cyan-500 hover:text-black rounded-xl text-[11px] font-black transition-all transform active:scale-90 border border-white/5"
                            >
                                {st.show_time ? st.show_time.substring(0, 5) : "N/A"}
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-2 py-4 bg-slate-950/40 rounded-2xl border border-dashed border-white/5 text-center">
                            <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest italic">No Rounds Scheduled</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Admin Management Link */}
            {user.role === 'admin' && (
                <Link 
                    to={`/manage/${movie.id}`} 
                    className="mt-2 block w-full text-center py-2 text-slate-600 hover:text-cyan-500 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                    [ Management Console ]
                </Link>
            )}
        </div>
    );
}
function ManageShowtimes({ movieId }) {
    const [showtimes, setShowtimes] = useState([]);
    const [newTime, setNewTime] = useState('');

    const fetchShowtimes = () => {
        axios.get(`${API_URL}/movies/${movieId}/showtimes`)
            .then(res => setShowtimes(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => { 
        if (movieId) fetchShowtimes(); 
    }, [movieId]);

    const handleAdd = async () => {
        if (!newTime) return alert("กรุณาเลือกเวลา");
        try {
            await axios.post(`${API_URL}/showtimes`, { 
                movie_id: movieId, 
                show_time: newTime, 
                theater_no: 1 
            });
            setNewTime('');
            fetchShowtimes(); 
        } catch (err) {
            alert("ไม่สามารถเพิ่มรอบฉายได้");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("ยืนยันการลบรอบฉายนี้? ข้อมูลการจองในรอบนี้จะหายไปทั้งหมด")) {
            try {
                await axios.delete(`${API_URL}/showtimes/${id}`);
                fetchShowtimes();
            } catch (err) {
                alert("ลบไม่สำเร็จ");
            }
        }
    };

    return (
        <div className="mt-8 bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
            <h4 className="text-xs font-black text-cyan-500 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                Manage Showtimes
            </h4>
            
            <div className="flex gap-3 mb-6">
                <input 
                    type="time" 
                    value={newTime} 
                    onChange={e => setNewTime(e.target.value)}
                    className="bg-slate-800 border-none rounded-xl text-white p-3 flex-1 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                />
                <button 
                    onClick={handleAdd} 
                    className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 rounded-xl font-black text-xl transition-all active:scale-90"
                >
                    +
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {showtimes.length > 0 ? showtimes.map(st => (
                    <div key={st.id} className="flex justify-between items-center bg-slate-800/40 p-4 rounded-2xl border border-white/5 group hover:bg-slate-800 transition-all">
                        <span className="font-black text-white tracking-widest">{st.show_time.substring(0, 5)}</span>
                        <button 
                            onClick={() => handleDelete(st.id)} 
                            className="text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-tighter transition-all"
                        >
                            [ Remove ]
                        </button>
                    </div>
                )) : (
                    <p className="text-slate-600 text-xs italic text-center py-4">No showtimes created yet.</p>
                )}
            </div>
        </div>
    );
}

// --- 5. Main App ---
export default function App() {
    const [movies, setMovies] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        axios.get(`${API_URL}/movies`).then(res => setMovies(res.data)).catch(err => console.error(err));
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <h1 className="text-5xl font-black mb-12 text-cyan-400 italic">CINEMA SYSTEM</h1>
                <div className="flex gap-6">
                    <button onClick={() => setUser({ role: 'admin' })} className="bg-cyan-600 px-10 py-5 rounded-2xl font-bold uppercase">Admin Login</button>
                    <button onClick={() => setUser({ role: 'user' })} className="bg-slate-800 px-10 py-5 rounded-2xl font-bold uppercase">User Login</button>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage movies={movies} user={user} setUser={setUser} />} />
                <Route path="/add-movie" element={<AddMoviePage setMovies={setMovies} />} />
                <Route path="/manage/:id" element={<ManageMoviePage movies={movies} setMovies={setMovies} />} />
                
                {/* 🟢 แก้ไขตรงนี้: เปลี่ยนจาก :movieId เป็น :showtimeId เพื่อความชัดเจน */}
                <Route path="/book/:showtimeId" element={<BookingPage />} />
            </Routes>
        </Router>
    );
}
