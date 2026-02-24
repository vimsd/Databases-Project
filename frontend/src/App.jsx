import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// --- 1. หน้าจองที่นั่ง (Seating Page - เชื่อม MongoDB) ---
function BookingPage() {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const [theater, setTheater] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/theater/${movieId}`).then(res => setTheater(res.data));
    }, [movieId]);

    const handleHoldSeats = async () => {
        try {
            await axios.post(`${API_URL}/bookings/hold`, { movieId, seatNumbers: selectedSeats });
            const total = selectedSeats.length * 200;
            if(window.confirm(`ยอดชำระ ${total} บาท ยืนยันการชำระเงินแบบ Mock?`)) {
                await axios.post(`${API_URL}/payments/mock`, { movieId, seatNumbers: selectedSeats, amount: total });
                alert("✅ ชำระเงินสำเร็จ!");
                navigate('/');
            }
        } catch (err) { alert(err.response?.data?.error || "จองไม่สำเร็จ"); }
    };

    if (!theater) return <div className="text-white p-10">Loading Layout...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center">
            <h2 className="text-3xl font-black mb-10 text-cyan-400 italic">SELECT SEATS</h2>
            <div className="w-full max-w-2xl bg-slate-900 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="grid grid-cols-5 gap-4">
                    {theater.seats.map(seat => {
                        const isSold = seat.isReserved && !seat.reservedUntil;
                        const isSelected = selectedSeats.includes(seat.seatNumber);
                        return (
                            <button key={seat.seatNumber} disabled={isSold}
                                onClick={() => setSelectedSeats(prev => isSelected ? prev.filter(s => s !== seat.seatNumber) : [...prev, seat.seatNumber])}
                                className={`p-4 rounded-xl font-bold ${isSold ? 'bg-red-900/50 text-red-500' : isSelected ? 'bg-cyan-500 text-black' : 'bg-slate-800'}`}
                            > {seat.seatNumber} </button>
                        );
                    })}
                </div>
                <button onClick={handleHoldSeats} disabled={selectedSeats.length === 0} className="w-full mt-10 bg-cyan-600 py-4 rounded-2xl font-black uppercase">Confirm & Pay</button>
            </div>
        </div>
    );
}

// --- 2. หน้าจัดการหนัง (Manage/Delete Page) ---
function ManageMoviePage({ movies, setMovies }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const movie = movies.find(m => m.id === parseInt(id));

    const handleDelete = async () => {
        if (window.confirm(`⚠️ ยืนยันการลบ "${movie?.title}"?`)) {
            try {
                await axios.delete(`${API_URL}/movies/${id}`);
                setMovies(movies.filter(m => m.id !== parseInt(id)));
                alert("🗑️ ลบสำเร็จ!");
                navigate('/');
            } catch (err) { alert("ลบไม่สำเร็จ"); }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md border border-white/10 text-center">
                <h2 className="text-2xl font-bold mb-6 text-cyan-400">Manage Movie</h2>
                <p className="mb-8 text-slate-400">Movie: {movie?.title}</p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="flex-1 bg-slate-800 py-3 rounded-xl">Back</button>
                    <button onClick={handleDelete} className="flex-1 bg-red-600 py-3 rounded-xl font-bold">Delete</button>
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
        <div className="min-h-screen bg-slate-950 text-white p-10">
            <nav className="flex justify-between items-center mb-10 border-b border-white/5 pb-5">
                <h1 className="text-2xl font-black text-cyan-500 italic">MovieSQL</h1>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold uppercase">ROLE: {user.role}</span>
                    <button onClick={() => setUser(null)} className="text-red-500 text-xs font-bold uppercase">Logout</button>
                </div>
            </nav>

            <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Now Showing</h2>
                {user.role === 'admin' && (
                    <Link to="/add-movie" className="bg-cyan-600 px-6 py-3 rounded-xl font-bold">+ Add Movie</Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {movies.map(m => (
                    <div key={m.id} className="bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 p-6">
                        <h3 className="text-xl font-bold truncate mb-6">{m.title}</h3>
                        <div className="space-y-3">
                            <Link to={`/book/${m.id}`} className="block w-full text-center py-3 bg-cyan-600 rounded-xl font-bold text-slate-950">Book Now</Link>
                            {user.role === 'admin' && (
                                <Link to={`/manage/${m.id}`} className="block w-full text-center py-3 bg-slate-800 rounded-xl font-bold text-cyan-500">Manage</Link>
                            )}
                        </div>
                    </div>
                ))}
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
                <Route path="/book/:movieId" element={<BookingPage />} />
            </Routes>
        </Router>
    );
}