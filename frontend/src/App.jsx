import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Transactions from "./Transactions";
import Admin from "./Admin";
import Profile from "./Profile";

const API = import.meta.env.VITE_API || "/api";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Persistence: Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("cinebook_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch (e) {
        localStorage.removeItem("cinebook_user");
      }
    }
  }, []);

  useEffect(() => {
    if (user) setPage("cinema");
  }, [user]);

  const handleLogin = (userData) => {
    const u = { ...userData, balance: Number(userData.balance || 0) };
    setUser(u);
    localStorage.setItem("cinebook_user", JSON.stringify(u));
    if (location.pathname === "/transactions") {
      // stay on /transactions so they see the page
    } else {
      navigate("/");
    }
  };

  const refreshUser = () => {
    if (!user) return;
    fetch(`${API}/users/${user.user_id}`)
      .then(r => r.json())
      .then(data => {
        const newBalance = Number(data.balance || 0);
        // Only update if balance changed to prevent unnecessary re-renders during input
        if (newBalance !== user.balance) {
          setUser(prev => {
            const updated = { ...prev, ...data, balance: newBalance };
            localStorage.setItem("cinebook_user", JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(console.error);
  };

  // realtime polling so balance updates when changed by payments/admin
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      refreshUser();
    }, 5000);
    return () => clearInterval(id);
  }, [user]);

  const handleRegister = () => {
    setPage("login");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cinebook_user");
    setPage("login");
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-slate-100 font-display transition-colors">
      {/* Top Navigation */}
      <Header
        user={user}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onGoHome={() => {
          setSearchTerm("");
          navigate("/");
        }}
      />

      <main className="flex-1 layout-container w-full p-4 md:p-10">
        <Routes>
          <Route path="/transactions" element={<TransactionsPage user={user} page={page} setPage={setPage} handleLogin={handleLogin} handleRegister={handleRegister} refreshUser={refreshUser} />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/*" element={
            <>
              {(!user && page === "login") && (
                <div className="max-w-md mx-auto mt-20 bg-neutral-dark/30 p-10 rounded-2xl border border-neutral-dark">
                  <h1 className="text-3xl font-bold text-center mb-8 text-primary">CineBook Login</h1>
                  <Login onLogin={handleLogin} switchToRegister={() => setPage("register")} />
                </div>
              )}
              {(!user && page === "register") && (
                <div className="max-w-md mx-auto mt-20 bg-neutral-dark/30 p-10 rounded-2xl border border-neutral-dark">
                  <h1 className="text-3xl font-bold text-center mb-8 text-primary">Create Account</h1>
                  <Register onRegister={handleRegister} switchToLogin={() => setPage("login")} />
                </div>
              )}
              {user && (
                user.role === 'admin' ?
                  <Admin /> :
                  <Cinema user={user} navigate={navigate} searchTerm={searchTerm} />
              )}
            </>
          } />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function Header({ user, onLogout, searchTerm, setSearchTerm, onGoHome }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between border-b border-solid border-neutral-dark px-6 md:px-10 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 text-primary cursor-pointer" onClick={onGoHome}>
          <div className="size-6">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-slate-100 text-xl font-bold leading-tight tracking-tight">CineBook</h2>
        </div>
        <nav className="hidden md:flex items-center gap-9">
          <button onClick={onGoHome} className="text-neutral-muted hover:text-white text-sm font-medium transition-colors">Movies</button>
          <button onClick={() => navigate("/transactions")} className="text-neutral-muted hover:text-white text-sm font-medium transition-colors">My Bookings</button>
        </nav>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <label className="relative hidden sm:flex items-center min-w-48">
          <span className="absolute left-3 text-neutral-muted material-symbols-outlined">search</span>
          <input
            className="w-full h-10 rounded-xl bg-neutral-dark border-none focus:ring-2 focus:ring-primary text-white placeholder:text-neutral-muted pl-10 text-sm"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        {user ? (
          <div className="flex items-center gap-4">
            {user.role === 'admin' && (
              <button onClick={() => navigate("/admin")} className="text-primary hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-base">admin_panel_settings</span> Admin Panel
              </button>
            )}
            <div className="text-sm font-medium flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
              {user.email} (฿{Number(user.balance || 0).toFixed(2)})
            </div>
            <button onClick={onLogout} className="text-neutral-muted hover:text-white transition-colors material-symbols-outlined" title="Logout">logout</button>
          </div>
        ) : (
          <button onClick={() => window.location.reload()} className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Sign In</button>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="px-10 py-6 border-t border-neutral-dark bg-background-dark/50 mt-10">
      <div className="layout-container flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-muted">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-xs">Secure Payment SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span className="text-xs">Privacy Protected</span>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-widest opacity-50">© 2026 CineBook Entertainment Ltd.</p>
      </div>
    </footer>
  );
}

function TransactionsPage({ user, page, setPage, handleLogin, handleRegister, refreshUser }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto">
      {user ? (
        <>
          <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-neutral-muted hover:text-primary transition-colors text-sm">
            <span className="material-symbols-outlined">arrow_back</span> Back to Cinema
          </button>
          <Transactions user={user} refreshUser={refreshUser} />
        </>
      ) : (
        <div className="max-w-md mx-auto mt-10 bg-neutral-dark/30 p-10 rounded-2xl border border-neutral-dark">
          {page === "register" ? (
            <Register onRegister={handleRegister} switchToLogin={() => setPage("login")} />
          ) : (
            <Login onLogin={handleLogin} switchToRegister={() => setPage("register")} />
          )}
        </div>
      )}
    </div>
  );
}

/* ================= CINEMA ================= */

function Cinema({ user, navigate, searchTerm }) {
  const [movies, setMovies] = useState([]);
  const [movieId, setMovieId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showtimeId, setShowtimeId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [theaters, setTheaters] = useState([]);

  const fetchMovies = () => {
    fetch(`${API}/movies`).then(r => r.json()).then(d => setMovies(Array.isArray(d) ? d : [])).catch(console.error);
  };

  useEffect(() => {
    fetchMovies();
    fetch(`${API}/mongo/theaters`).then(r => r.json()).then(d => setTheaters(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!movieId) return;
    fetch(`${API}/showtimes?movie_id=${movieId}`)
      .then(r => r.json())
      .then(data => {
        setShowtimes(Array.isArray(data) ? data : []);
        setSelectedFormat(null); // Reset format when new movie is loaded
      }).catch(console.error);
  }, [movieId]);

  useEffect(() => {
    if (!showtimeId) return;
    fetch(`${API}/seats?showtime_id=${showtimeId}`)
      .then(r => r.json())
      .then(d => setSeats(Array.isArray(d) ? d : [])).catch(console.error);
  }, [showtimeId]);

  const toggleSeat = (seat) => {
    const isBooked = seat.status === 'booked' || seat.status === 'pending';
    if (isBooked) return;
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.seat_id === seat.seat_id);
      if (exists) {
        return prev.filter(s => s.seat_id !== seat.seat_id);
      }
      return [...prev, seat];
    });
  };

  const confirmSelection = async () => {
    if (!showtimeId || selectedSeats.length === 0) return;
    try {
      const resp = await fetch(`${API}/booking/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          showtime_id: showtimeId,
          seat_ids: selectedSeats.map(s => s.seat_id)
        })
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "booking failed");

      alert("Seats held! Please proceed to payment.");
      navigate("/transactions");
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredMovies = movies.filter(m =>
    (m.title || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const selectedMovie = movies.find(m => m.movie_id === movieId);
  const selectedShowtime = showtimes.find(s => s.showtime_id === showtimeId);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-neutral-muted text-xs md:text-sm mb-4">
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => { setMovieId(null); setSelectedFormat(null); setShowtimeId(null); }}>Movies</span>
        {movieId && (
          <>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => { setSelectedFormat(null); setShowtimeId(null); }}>{selectedMovie?.title}</span>
          </>
        )}
        {selectedFormat && !showtimeId && (
          <>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-white font-medium">{selectedFormat}</span>
          </>
        )}
        {showtimeId && (
          <>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-neutral-muted cursor-pointer hover:text-white transition-colors" onClick={() => setShowtimeId(null)}>{selectedFormat || 'Seat Selection'}</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-white font-medium">Seats</span>
          </>
        )}
      </div>

      {/* STEP 1: SELECT MOVIE */}
      {!movieId && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredMovies.map(m => (
            <div key={m.movie_id} onClick={() => setMovieId(m.movie_id)} className="group cursor-pointer">
              <div className="aspect-[2/3] bg-neutral-dark/40 rounded-2xl overflow-hidden mb-3 relative border border-neutral-dark/50 group-hover:border-primary/50 transition-all duration-300 shadow-lg">
                {m.media?.poster_url ? (
                  <img
                    src={m.media.poster_url}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=No+Image'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-10 group-hover:opacity-30 transition-opacity">🎬</div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">{m.content_rating || 'NR'}</div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold truncate max-w-[70%]">{m.title}</div>
                    {m.stats?.total_reviews > 0 && (
                      <div className="flex items-center gap-1 text-xs font-black text-yellow-400">
                        <span className="material-symbols-outlined text-xs">star</span>
                        {m.stats.average_rating}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 2: SELECT SHOWTIME */}
      {movieId && !showtimeId && (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-48 md:w-64 aspect-[2/3] bg-neutral-dark/40 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-neutral-dark/50 flex items-center justify-center text-5xl">
              {selectedMovie?.media?.poster_url ? (
                <img
                  src={selectedMovie.media.poster_url}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=No+Image'; }}
                />
              ) : "🎬"}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{selectedMovie?.title}</h1>
              {selectedMovie?.stats?.total_reviews > 0 && (
                <div className="flex items-center gap-2 mb-4 text-yellow-400">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`material-symbols-outlined text-sm ${star <= Math.round(selectedMovie.stats.average_rating) ? 'fill-1' : 'opacity-30'}`}>star</span>
                    ))}
                  </div>
                  <span className="font-bold text-sm">{selectedMovie.stats.average_rating}</span>
                  <span className="text-neutral-muted text-xs">({selectedMovie.stats.total_reviews} reviews)</span>
                </div>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">{selectedMovie?.content_rating || 'NR'}</span>
                {selectedMovie?.duration_minutes && <span className="bg-neutral-dark/50 px-3 py-1 rounded-full border border-neutral-dark">{selectedMovie.duration_minutes} MIN</span>}
                {selectedMovie?.genres?.slice(0, 3).map(g => (
                  <span key={g} className="bg-neutral-dark/50 px-3 py-1 rounded-full border border-neutral-dark">{g}</span>
                ))}
              </div>
              <p className="text-neutral-muted text-sm md:text-base leading-relaxed max-w-2xl mb-6">
                {selectedMovie?.synopsis || "No synopsis available."}
              </p>
              {selectedMovie?.cast?.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">Cast</h4>
                  <p className="text-sm text-neutral-muted">{selectedMovie.cast.map(c => c.name).join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-dark/50 pt-10">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">smart_display</span> Select Format
            </h3>

            {!selectedFormat ? (
              <div className="flex flex-wrap gap-4">
                {Array.from(new Set(showtimes.map(s => theaters.find(t => String(t._id) === String(s.theater_id))?.format || 'Standard'))).map(format => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className="bg-neutral-dark/30 hover:bg-primary transition-all p-6 rounded-2xl border border-neutral-dark hover:border-primary/50 group text-center shadow-lg hover:shadow-primary/20 hover:-translate-y-1 min-w-[160px]"
                  >
                    <div className="text-2xl font-black group-hover:text-white uppercase tracking-widest">{format}</div>
                    <div className="text-[10px] text-neutral-muted group-hover:text-white/70 mt-2 uppercase tracking-wide">
                      Select for Showtimes
                    </div>
                  </button>
                ))}
                {showtimes.length === 0 && <p className="text-neutral-muted italic px-2">No showtimes scheduled for this movie.</p>}
              </div>
            ) : (
              <div className="animate-fade-in transition-all">
                <button onClick={() => setSelectedFormat(null)} className="flex items-center gap-2 text-xs text-primary mb-6 hover:text-white transition-colors uppercase font-bold tracking-wider">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Change Format
                </button>
                <div className="flex flex-wrap gap-4">
                  {showtimes.filter(s => {
                    const format = theaters.find(t => String(t._id) === String(s.theater_id))?.format || 'Standard';
                    return format === selectedFormat;
                  }).map(s => {
                    return (
                      <button
                        key={s.showtime_id}
                        onClick={() => setShowtimeId(s.showtime_id)}
                        className="bg-neutral-dark/30 hover:bg-primary transition-all p-5 rounded-2xl border border-neutral-dark hover:border-primary/50 group text-center shadow-lg hover:shadow-primary/20 hover:-translate-y-1 relative overflow-hidden flex flex-col items-center min-w-[120px]"
                      >
                        <div className="text-2xl font-black mt-1 mb-2 group-hover:text-white">
                          {new Date(s.showtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] bg-neutral-dark/50 group-hover:bg-black/20 text-neutral-muted group-hover:text-white px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                          {new Date(s.showtime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Reviews movieId={movieId} user={user} onReviewSubmitted={fetchMovies} />
        </div>
      )}

      {/* STEP 3: SEAT SELECTION */}
      {showtimeId && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full bg-neutral-dark/10 rounded-2xl p-6 md:p-10 flex flex-col items-center">
            {/* Screen */}
            <div className="w-full max-w-xl mb-16">
              <div className="cinema-screen-curve"></div>
              <p className="text-center text-[10px] tracking-[0.5em] text-neutral-muted uppercase mt-4">Theater This Way</p>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid flex flex-col gap-3 items-center w-full">
              <div className="flex flex-col gap-3">
                {
                  // Group seats by row (e.g. "A1", "A2" -> Row "A")
                  Object.entries(
                    seats.reduce((acc, s) => {
                      const row = s.seat.charAt(0);
                      if (!acc[row]) acc[row] = [];
                      acc[row].push(s);
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => a.localeCompare(b)) // Sort A-Z
                    .map(([rowChar, rowSeats]) => {
                      const renderChunk = (chunk) => chunk.map(s => {
                        const isSelected = selectedSeats.some(sel => sel.seat_id === s.seat_id);
                        const isBooked = s.status === 'booked' || s.status === 'pending';
                        let stateStyles = "bg-neutral-muted/20 hover:bg-neutral-muted/40 text-transparent";
                        if (isBooked) stateStyles = "bg-neutral-dark text-neutral-muted/30 cursor-not-allowed";
                        if (isSelected) stateStyles = "bg-primary text-white shadow-[0_0_12px_rgba(234,42,51,0.6)]";

                        return (
                          <button
                            key={s.seat_id}
                            disabled={isBooked}
                            onClick={() => toggleSeat(s)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all text-[10px] font-bold ${stateStyles}`}
                          >
                            {isBooked ? '×' : (isSelected ? s.seat : <span className="opacity-0 hover:opacity-100">{s.seat}</span>)}
                          </button>
                        );
                      });

                      const leftHalf = rowSeats.slice(0, 8);
                      const rightHalf = rowSeats.slice(8);

                      return (
                        <div key={rowChar} className="flex items-center gap-4 seat-row group/row">
                          <span className="w-4 text-[10px] text-neutral-muted font-bold group-hover/row:text-primary transition-colors">{rowChar}</span>
                          <div className="flex gap-4">
                            <div className="flex gap-2">{renderChunk(leftHalf)}</div>
                            <div className="flex gap-2">{renderChunk(rightHalf)}</div>
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            </div>

            {/* Legend */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 bg-neutral-dark/30 px-6 py-3 rounded-full border border-neutral-dark/50">
              <div className="flex items-center gap-2"><div className="size-4 rounded-md bg-neutral-muted/20"></div><span className="text-[10px] text-neutral-muted uppercase font-bold">Free</span></div>
              <div className="flex items-center gap-2"><div className="size-4 rounded-md bg-primary"></div><span className="text-[10px] text-neutral-muted uppercase font-bold">Selected</span></div>
              <div className="flex items-center gap-2"><div className="size-4 rounded-md bg-neutral-dark flex items-center justify-center text-neutral-muted/30">×</div><span className="text-[10px] text-neutral-muted uppercase font-bold">Booked</span></div>
            </div>
          </div>

          {/* Right Summary Panel */}
          <aside className="w-full lg:w-96 flex flex-col gap-6 sticky top-24">
            <div className="bg-neutral-dark/20 rounded-2xl border border-neutral-dark overflow-hidden flex flex-col shadow-xl">
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-16 bg-neutral-dark/50 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-dark">
                      {selectedMovie?.media?.poster_url ? (
                        <img
                          src={selectedMovie.media.poster_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=No+Image'; }}
                        />
                      ) : (
                        <span className="text-2xl">🎬</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Selected Movie</div>
                      <h3 className="font-bold text-white text-lg leading-tight">{selectedMovie?.title}</h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 py-4 border-y border-neutral-dark/50">
                    <div className="flex items-center gap-3 text-neutral-muted">
                      <span className="material-symbols-outlined text-primary text-xl">smart_display</span>
                      <div>
                        <div className="text-[10px] uppercase font-bold">Theater Info</div>
                        <div className="text-white text-xs">
                          {theaters.find(t => String(t._id) === String(selectedShowtime?.theater_id))?.branch_name || 'Theater'}
                          <span className="text-primary ml-1 font-bold">({theaters.find(t => String(t._id) === String(selectedShowtime?.theater_id))?.format || 'Standard'})</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-muted">
                      <span className="material-symbols-outlined text-primary text-xl">event</span>
                      <div>
                        <div className="text-[10px] uppercase font-bold">Date & Time</div>
                        <div className="text-white text-xs">{new Date(selectedShowtime?.showtime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-muted">
                      <span className="material-symbols-outlined text-primary text-xl">chair</span>
                      <div>
                        <div className="text-[10px] uppercase font-bold">Selected Seats</div>
                        <div className="text-white text-xs">
                          {selectedSeats.length
                            ? selectedSeats.map(s => `${s.seat} (฿${Number(s.price || 250)})`).join(", ")
                            : '--'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-6 px-4 py-3 bg-primary/5 rounded-xl border border-primary/20">
                    <span className="text-neutral-muted font-bold text-xs uppercase tracking-widest">Total Price</span>
                    <span className="text-2xl font-black text-primary">
                      {selectedSeats.length
                        ? `${selectedSeats.reduce((sum, s) => sum + Number(s.price || 250), 0).toFixed(2)} ฿`
                        : '0.00 ฿'}
                    </span>
                  </div>

                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={confirmSelection}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${selectedSeats.length
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                      : 'bg-neutral-dark text-neutral-muted cursor-not-allowed border border-neutral-dark/50'
                      }`}
                  >
                    <span>Confirm Booking</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#111",
    color: "white",
    padding: 40
  },
  title: {
    textAlign: "center"
  },
  welcome: {
    textAlign: "center",
    marginBottom: 20
  },
  steps: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginBottom: 30
  },
  step: {
    opacity: 0.4
  },
  activeStep: {
    fontWeight: "bold",
    color: "#00ffcc"
  },
  grid: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap"
  },
  card: {
    background: "#222",
    padding: 20,
    borderRadius: 10,
    minWidth: 150
  },
  input: {
    padding: 10,
    marginBottom: 10,
    width: 200
  },
  button: {
    padding: "8px 12px",
    background: "#00ffcc",
    border: "none",
    cursor: "pointer"
  },
  back: {
    marginBottom: 20,
    padding: "6px 10px"
  }
};

function Reviews({ movieId, user, onReviewSubmitted }) {
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [loadingObj, setLoadingObj] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [movieId, user]);

  const fetchReviews = () => {
    fetch(`${API}/mongo/movies/${movieId}/reviews`)
      .then(r => r.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const checkCanReview = async () => {
    if (!user) {
      setLoadingObj(false);
      return;
    }
    try {
      const res = await fetch(`${API}/booking/check-watched?user_id=${user.user_id}&movie_id=${movieId}`);
      const data = await res.json();
      setCanReview(data.can_review);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingObj(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/mongo/movies/${movieId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mysql_user_id: user.user_id,
          rating,
          comment
        })
      });
      if (res.ok) {
        setComment("");
        setRating(5);
        fetchReviews();
        if (onReviewSubmitted) setTimeout(onReviewSubmitted, 500);
        alert("Review submitted!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit review");
      }
    } catch (e) {
      console.error("Submission error:", e);
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t border-neutral-dark/50 pt-10">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">star</span> Audience Reviews
      </h3>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Review Form */}
        <div className="w-full lg:w-1/3 bg-neutral-dark/20 p-6 rounded-2xl border border-neutral-dark">
          <h4 className="text-lg font-bold mb-4">Write a Review</h4>

          {!user ? (
            <div className="text-sm text-neutral-muted bg-neutral-dark/40 p-4 rounded-xl text-center">
              Please sign in to write a review.
            </div>
          ) : loadingObj ? (
            <div className="text-sm text-neutral-muted text-center p-4">Checking eligibility...</div>
          ) : !canReview ? (
            <div className="text-sm text-neutral-muted bg-neutral-dark/40 p-4 rounded-xl text-center border border-dashed border-neutral-muted/30">
              <span className="material-symbols-outlined text-3xl opacity-50 mb-2 block">lock</span>
              You must purchase a ticket & watch this movie before reviewing to prevent spoilers!
            </div>
          ) : (
            <form onSubmit={submitReview} className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase font-bold text-neutral-muted mb-2 block">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`material-symbols-outlined text-2xl transition-colors ${rating >= star ? 'text-yellow-400' : 'text-neutral-dark'}`}
                    >
                      star
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-neutral-muted mb-2 block">Your Thoughts</label>
                <textarea
                  required
                  rows="4"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full bg-neutral-dark/50 border border-neutral-dark rounded-xl p-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="What did you think of the movie?"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </form>
          )}
        </div>

        {/* Review List */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {reviews.length === 0 ? (
            <div className="text-center p-10 bg-neutral-dark/10 rounded-2xl border border-neutral-dark/30">
              <span className="material-symbols-outlined text-4xl text-neutral-muted opacity-50 mb-2 block">forum</span>
              <p className="text-neutral-muted">No reviews yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r._id} className="bg-neutral-dark/30 p-5 rounded-2xl border border-neutral-dark/50 flex gap-4 items-start">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium shrink-0 text-[10px] overflow-hidden px-1">
                  {r.email?.split('@')[0].substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-sm text-primary">{r.email}</div>
                    <div className="flex text-yellow-400 text-sm">
                      {[...Array(Number(r.rating))].map((_, i) => <span key={i} className="material-symbols-outlined text-[14px]">star</span>)}
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-muted uppercase tracking-wider mb-3">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed break-words">{r.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
