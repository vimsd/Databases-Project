import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { getMovies, createMovie, deleteMovie } from './services/api';

// --- 1. หน้าจัดการและลบหนัง (Manage Movie Page) ---
function ManageMoviePage({ movies, setMovies }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const movie = movies.find(m => m.id === parseInt(id));

  const handleDelete = async () => {
    if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบหนังเรื่อง "${movie?.title || id}"?`)) {
      try {
        await deleteMovie(id);
        const updatedMovies = movies.filter(m => m.id !== parseInt(id));
        setMovies(updatedMovies);
        alert("🗑️ ลบหนังออกจากระบบเรียบร้อย!");
        navigate('/');
      } catch (err) {
        alert("❌ ลบไม่สำเร็จ: " + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-black mb-4 text-cyan-400 text-center uppercase italic tracking-tighter">Manage Movie</h2>
        <div className="space-y-6 text-center">
          <div className="bg-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-500 uppercase font-bold">Current Movie</p>
            <p className="text-xl font-bold text-white">{movie?.title || `ID: ${id}`}</p>
          </div>
          <p className="text-slate-400 text-sm">การลบข้อมูลจะลบออกจากฐานข้อมูล MySQL ถาวร</p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => navigate('/')} className="flex-1 bg-slate-800 py-4 rounded-xl font-bold uppercase text-[10px]">Back</button>
            <button 
              onClick={handleDelete} 
              className="flex-1 bg-red-600 text-white py-4 rounded-xl font-bold uppercase text-[10px] shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. หน้าสำหรับเพิ่มหนังใหม่ (Add Movie Page) ---
function AddMoviePage({ movies, setMovies }) {
  const [newMovie, setNewMovie] = useState({ title: '', genre: '', duration: '', poster_url: '' });
  const navigate = useNavigate();

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      const res = await createMovie(newMovie);
      setMovies([res.data, ...movies]);
      alert("✅ บันทึกลง MySQL สำเร็จ!");
      navigate('/');
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาด: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-black mb-8 text-cyan-400 text-center italic uppercase tracking-tighter">Add New Movie</h2>
        <form onSubmit={handleAddMovie} className="space-y-4">
          <input placeholder="Movie Title" className="w-full p-4 rounded-xl bg-slate-800 text-white outline-none" 
            onChange={(e) => setNewMovie({...newMovie, title: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Genre" className="p-4 rounded-xl bg-slate-800 text-white outline-none" 
              onChange={(e) => setNewMovie({...newMovie, genre: e.target.value})} />
            <input placeholder="Duration (min)" type="number" className="p-4 rounded-xl bg-slate-800 text-white outline-none" 
              onChange={(e) => setNewMovie({...newMovie, duration: e.target.value})} />
          </div>
          <input placeholder="Poster URL" className="w-full p-4 rounded-xl bg-slate-800 text-white text-xs outline-none" 
            onChange={(e) => setNewMovie({...newMovie, poster_url: e.target.value})} />
          <div className="flex gap-4 mt-10">
            <Link to="/" className="flex-1 text-center py-4 text-slate-500 font-bold uppercase text-[10px]">Cancel</Link>
            <button type="submit" className="flex-1 bg-cyan-600 py-4 rounded-xl font-bold text-slate-950 uppercase text-[10px]">Save to MySQL</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 3. หน้าหลัก (Home Page) ---
function HomePage({ movies, user, setUser }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10">
      <nav className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
        <h1 className="text-3xl font-black text-cyan-500 italic uppercase">MovieSQL</h1>
        <div className="flex items-center gap-6">
          <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold uppercase">ROLE: {user.role}</span>
          <button onClick={() => setUser(null)} className="text-red-500 text-[10px] font-black uppercase hover:text-red-400 transition">Logout</button>
        </div>
      </nav>

      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Now Showing</h2>
        {user.role === 'admin' && (
          <Link to="/add-movie" className="bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-2xl font-black shadow-xl shadow-cyan-900/30 transition-all active:scale-95">
            + Add Movie
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {movies.map(m => (
          <div key={m.id} className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-all">
            <div className="h-96 bg-slate-800 relative">
              <img src={m.poster_url || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" alt={m.title} />
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold truncate mb-6">{m.title}</h3>
              <Link 
                to={user.role === 'admin' ? `/manage/${m.id}` : '#'} 
                className={`block w-full text-center py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  user.role === 'admin' ? 'bg-slate-800 hover:bg-cyan-600 hover:text-slate-950' : 'bg-cyan-600 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {user.role === 'admin' ? 'Manage Movie' : 'Book Now'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 4. ส่วนประกอบหลัก (Main App) ---
export default function App() {
  const [movies, setMovies] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMovies().then(res => setMovies(res.data)).catch(err => console.error(err));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <h1 className="text-5xl font-black mb-12 text-cyan-400 italic uppercase">Cinema Admin</h1>
        <div className="flex gap-6">
          <button onClick={() => setUser({ role: 'admin' })} className="bg-cyan-600 px-10 py-5 rounded-2xl font-bold uppercase shadow-lg shadow-cyan-900/20">Login as Admin</button>
          <button onClick={() => setUser({ role: 'user' })} className="bg-slate-800 px-10 py-5 rounded-2xl font-bold uppercase border border-white/5">Login as User</button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage movies={movies} user={user} setUser={setUser} />} />
        <Route path="/add-movie" element={<AddMoviePage movies={movies} setMovies={setMovies} />} />
        <Route path="/manage/:id" element={<ManageMoviePage movies={movies} setMovies={setMovies} />} />
      </Routes>
    </Router>
  );
}