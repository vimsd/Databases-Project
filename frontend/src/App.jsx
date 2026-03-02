import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Transactions from "./Transactions";

const API = import.meta.env.VITE_API || "/api";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) setPage("cinema");
  }, [user]);

  const handleLogin = (userData) => {
    const u = { ...userData, balance: Number(userData.balance || 0) };
    setUser(u);
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
      .then(data => setUser({ ...data, balance: Number(data.balance || 0) }))
      .catch(console.error);
  };

  const handleRegister = () => {
    setPage("login");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
    navigate("/");
  };

  // Route: /transactions — หน้า transaction (ต้อง login ก่อน หรือแสดง login/register)
  const transactionsEl = (
    <div style={styles.container}>
      {user ? (
        <>
          <button onClick={() => navigate("/")} style={styles.back}>
            ⬅ Back
          </button>
          <Transactions user={user} refreshUser={refreshUser} />
        </>
      ) : page === "register" ? (
        <>
          <h1 style={styles.title}>🎬 Cinema System</h1>
          <Register
            onRegister={handleRegister}
            switchToLogin={() => setPage("login")}
          />
        </>
      ) : (
        <>
          <h1 style={styles.title}>🎬 Cinema System</h1>
          <p style={{ marginBottom: 16 }}>Log in to view your transactions.</p>
          <Login
            onLogin={handleLogin}
            switchToRegister={() => setPage("register")}
          />
        </>
      )}
    </div>
  );

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
                  <AdminDashboard user={user} /> :
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
          <a className="text-neutral-muted hover:text-white text-sm font-medium transition-colors" href="#">Cinemas</a>
          <a className="text-neutral-muted hover:text-white text-sm font-medium transition-colors" href="#">Offers</a>
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
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold truncate max-w-[120px]">{user.email.split('@')[0]}</div>
              <div className="text-[10px] text-primary uppercase font-bold tracking-tighter">{user.role}</div>
            </div>
            <button onClick={onLogout} className="text-xs bg-neutral-dark hover:bg-neutral-dark/80 px-3 py-2 rounded-lg transition-colors">Logout</button>
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
  const [showtimeId, setShowtimeId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    fetch(`${API}/movies`)
      .then(r => r.json())
      .then(setMovies)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!movieId) return;
    fetch(`${API}/showtimes?movie_id=${movieId}`)
      .then(r => r.json())
      .then(setShowtimes);
  }, [movieId]);

  useEffect(() => {
    if (!showtimeId) return;
    fetch(`${API}/seats?showtime_id=${showtimeId}`)
      .then(r => r.json())
      .then(setSeats);
  }, [showtimeId]);

  const bookSeat = async (seat_id) => {
    if (!showtimeId || !seat_id) return;
    try {
      const resp = await fetch(`${API}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          showtime_id: showtimeId,
          seat_id
        })
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "booking failed");

      alert("Selection held! Please proceed to payments.");
      navigate("/transactions");
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredMovies = movies.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMovie = movies.find(m => m.movie_id === movieId);
  const selectedShowtime = showtimes.find(s => s.showtime_id === showtimeId);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-neutral-muted text-xs md:text-sm mb-4">
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => { setMovieId(null); setShowtimeId(null); }}>Movies</span>
        {movieId && (
          <>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => setShowtimeId(null)}>{selectedMovie?.title}</span>
          </>
        )}
        {showtimeId && (
          <>
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
                {/* Placeholder for movie image until real ones used */}
                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-10 group-hover:opacity-30 transition-opacity">🎬</div>
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="text-xs text-primary font-bold uppercase tracking-tighter mb-1">Now Showing</div>
                  <div className="text-sm font-bold truncate">{m.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 2: SELECT SHOWTIME */}
      {movieId && !showtimeId && (
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-6">
            <div className="size-24 md:size-32 bg-neutral-dark/40 rounded-2xl flex items-center justify-center text-5xl border border-neutral-dark/50">🎬</div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{selectedMovie?.title}</h1>
              <div className="flex gap-4 text-sm text-neutral-muted">
                <span>IMAX 2D</span>
                <span>UA | 2h 49min</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span> Available Showtimes
            </h3>
            <div className="flex flex-wrap gap-4">
              {showtimes.map(s => (
                <button
                  key={s.showtime_id}
                  onClick={() => setShowtimeId(s.showtime_id)}
                  className="bg-neutral-dark/30 hover:bg-primary transition-all p-4 rounded-xl border border-neutral-dark group"
                >
                  <div className="text-sm font-bold group-hover:text-white">{new Date(s.showtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[10px] text-neutral-muted group-hover:text-white/80 mt-1 uppercase">Theater {s.theater_id}</div>
                </button>
              ))}
              {showtimes.length === 0 && <p className="text-neutral-muted italic">No showtimes scheduled for this movie.</p>}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SEAT SELECTION */}
      {showtimeId && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full bg-neutral-dark/10 rounded-2xl p-6 md:p-10 flex flex-col items-center">
            {/* Screen */}
            <div className="w-full max-w-xl mb-16">
              <div className="cinema-screen-curve"></div>
              <p className="text-center text-[10px] tracking-[0.5em] text-neutral-muted uppercase mt-4">Cinema Screen This Way</p>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid flex flex-col gap-3 items-center w-full">
              <div className="flex flex-col gap-3">
                {/* Rows A-H logic based on current DB setup usually A1-A10 etc */}
                {/* We'll dynamic map seats into rows of 10 for display */}
                {
                  Array.from({ length: Math.ceil(seats.length / 10) }).map((_, rowIndex) => {
                    const rowSeats = seats.slice(rowIndex * 10, (rowIndex + 1) * 10);
                    const rowChar = String.fromCharCode(65 + rowIndex);
                    return (
                      <div key={rowIndex} className="flex items-center gap-4 seat-row">
                        <span className="w-4 text-[10px] text-neutral-muted font-bold">{rowChar}</span>
                        <div className="flex gap-2">
                          {rowSeats.map(s => {
                            const isSelected = selectedSeat?.seat_id === s.seat_id;
                            const isBooked = s.status === 'booked' || s.status === 'pending';

                            let stateStyles = "bg-neutral-muted/20 hover:bg-neutral-muted/40 text-transparent";
                            if (isBooked) stateStyles = "bg-neutral-dark text-neutral-muted/30 cursor-not-allowed";
                            if (isSelected) stateStyles = "bg-primary text-white shadow-[0_0_12px_rgba(234,42,51,0.6)]";

                            return (
                              <button
                                key={s.seat_id}
                                disabled={isBooked}
                                onClick={() => setSelectedSeat(s)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all text-[10px] font-bold ${stateStyles}`}
                              >
                                {isBooked ? '×' : (isSelected ? s.seat : <span className="opacity-0 hover:opacity-100">{s.seat}</span>)}
                              </button>
                            )
                          })}
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
                    <div className="size-16 bg-neutral-dark/50 rounded-xl flex items-center justify-center text-2xl border border-neutral-dark">🎬</div>
                    <div>
                      <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Selected Movie</div>
                      <h3 className="font-bold text-white text-lg leading-tight">{selectedMovie?.title}</h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 py-4 border-y border-neutral-dark/50">
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
                        <div className="text-[10px] uppercase font-bold">Selected Seat</div>
                        <div className="text-white text-xs">{selectedSeat ? `Seat ${selectedSeat.seat} (Theater ${selectedShowtime?.theater_id})` : '--'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-6 px-4 py-3 bg-primary/5 rounded-xl border border-primary/20">
                    <span className="text-neutral-muted font-bold text-xs uppercase tracking-widest">Total Price</span>
                    <span className="text-2xl font-black text-primary">{selectedSeat ? `${Number(selectedSeat.price || 250).toFixed(2)} ฿` : '0.00 ฿'}</span>
                  </div>

                  <button
                    disabled={!selectedSeat}
                    onClick={() => bookSeat(selectedSeat.seat_id)}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${selectedSeat
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

/* ================= ADMIN DASHBOARD ================= */

/* ================= ADMIN DASHBOARD ================= */

function AdminDashboard({ user }) {
  const [tab, setTab] = useState("movies");
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newMovie, setNewMovie] = useState("");

  const fetchMovies = () => fetch(`${API}/movies`).then(r => r.json()).then(setMovies);
  const fetchUsers = () => fetch(`${API}/admin/users`).then(r => r.json()).then(setUsers);
  const fetchBookings = () => fetch(`${API}/admin/bookings`).then(r => r.json()).then(setBookings);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [newShowtime, setNewShowtime] = useState({ theater_id: 1, showtime: "" });

  const fetchShowtimes = (movieId) => {
    fetch(`${API}/showtimes?movie_id=${movieId}`)
      .then(r => r.json())
      .then(setShowtimes);
  };

  useEffect(() => {
    if (selectedMovie) fetchShowtimes(selectedMovie.movie_id);
  }, [selectedMovie]);

  const addShowtime = async () => {
    if (!newShowtime.showtime) return;
    await fetch(`${API}/showtimes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newShowtime, movie_id: selectedMovie.movie_id })
    });
    setNewShowtime({ ...newShowtime, showtime: "" });
    fetchShowtimes(selectedMovie.movie_id);
  };

  const deleteShowtime = async (id) => {
    await fetch(`${API}/showtimes/${id}`, { method: "DELETE" });
    fetchShowtimes(selectedMovie.movie_id);
  };

  useEffect(() => {
    if (tab === "movies") fetchMovies();
    if (tab === "users") fetchUsers();
    if (tab === "bookings") fetchBookings();
  }, [tab]);

  const addMovie = async () => {
    if (!newMovie) return;
    await fetch(`${API}/movies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newMovie })
    });
    setNewMovie("");
    fetchMovies();
  };

  const deleteMovie = async (id) => {
    await fetch(`${API}/movies/${id}`, { method: "DELETE" });
    fetchMovies();
  };

  const updateBalance = async (userId, newBalance) => {
    await fetch(`${API}/admin/users/${userId}/balance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: Number(newBalance) })
    });
    fetchUsers();
  };

  const refundBooking = async (bookId) => {
    const res = await fetch(`${API}/admin/booking/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book_id: bookId })
    });
    const data = await res.json();
    if (res.ok) alert(data.message);
    else alert(data.error);
    fetchBookings();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h1 style={{ textAlign: "center", color: "#00ffcc" }}>🛠 Admin Control Panel</h1>

      {/* TABS */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30 }}>
        {["movies", "users", "bookings"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px",
              background: tab === t ? "#00ffcc" : "#333",
              color: tab === t ? "#000" : "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              textTransform: "capitalize"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: "#222", padding: 30, borderRadius: 15, border: "1px solid #333" }}>

        {/* MOVIES TAB */}
        {tab === "movies" && (
          <div>
            <h2>Manage Movies</h2>
            <div style={{ marginBottom: 20 }}>
              <input
                placeholder="New Movie Title"
                value={newMovie}
                onChange={e => setNewMovie(e.target.value)}
                style={{ ...styles.input, marginRight: 10, width: "300px" }}
              />
              <button style={styles.button} onClick={addMovie}>Add Movie</button>
            </div>
            <div style={styles.grid}>
              {movies.map(m => (
                <div key={m.movie_id} style={{ ...styles.card, minWidth: "300px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontWeight: "bold" }}>{m.title}</span>
                    <div>
                      <button
                        style={{ background: "#444", color: "#00ffcc", border: "none", padding: "5px 10px", cursor: "pointer", marginRight: 5 }}
                        onClick={() => setSelectedMovie(m)}
                      >
                        🕒 Showtimes
                      </button>
                      <button style={{ background: "salmon", border: "none", padding: "5px 10px", cursor: "pointer" }} onClick={() => deleteMovie(m.movie_id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SHOWTIME MODAL-ISH OVERLAY */}
            {selectedMovie && (
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
              }}>
                <div style={{ background: "#222", padding: 30, borderRadius: 15, width: "500px", border: "1px solid #444" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2>Showtimes: {selectedMovie.title}</h2>
                    <button onClick={() => setSelectedMovie(null)} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer" }}>×</button>
                  </div>

                  <div style={{ marginBottom: 20, borderBottom: "1px solid #444", paddingBottom: 20 }}>
                    <h3>Add New Showtime</h3>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        type="number" placeholder="Theater ID"
                        value={newShowtime.theater_id}
                        onChange={e => setNewShowtime({ ...newShowtime, theater_id: e.target.value })}
                        style={{ ...styles.input, width: 80 }}
                      />
                      <input
                        type="datetime-local"
                        value={newShowtime.showtime}
                        onChange={e => setNewShowtime({ ...newShowtime, showtime: e.target.value })}
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button style={styles.button} onClick={addShowtime}>Add</button>
                    </div>
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {showtimes.map(st => (
                      <div key={st.showtime_id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: 10, background: "#333", marginBottom: 5, borderRadius: 5
                      }}>
                        <span>Theater {st.theater_id} - {new Date(st.showtime).toLocaleString()}</span>
                        <button style={{ background: "salmon", border: "none", padding: "3px 8px", cursor: "pointer" }} onClick={() => deleteShowtime(st.showtime_id)}>Delete</button>
                      </div>
                    ))}
                    {showtimes.length === 0 && <p style={{ opacity: 0.5 }}>No showtimes scheduled.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            <h2>User Management</h2>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #444" }}>
                  <th style={{ padding: 10 }}>Email</th>
                  <th style={{ padding: 10 }}>Role</th>
                  <th style={{ padding: 10 }}>Balance (฿)</th>
                  <th style={{ padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: "1px solid #333" }}>
                    <td style={{ padding: 10 }}>{u.email}</td>
                    <td style={{ padding: 10 }}>{u.role}</td>
                    <td style={{ padding: 10 }}>{Number(u.balance).toFixed(2)}</td>
                    <td style={{ padding: 10 }}>
                      <button
                        style={{ ...styles.button, fontSize: "12px", background: "#444", color: "#fff" }}
                        onClick={() => {
                          const val = prompt("Enter new balance:", u.balance);
                          if (val !== null) updateBalance(u.user_id, val);
                        }}
                      >
                        Edit Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {tab === "bookings" && (
          <div>
            <h2>Global Bookings & Refunds</h2>
            <div style={styles.grid}>
              {bookings.map(b => (
                <div key={b.payment_id} style={{ ...styles.card, minWidth: "350px", border: b.status === 'Paid' ? '1px solid #00ffcc' : '1px solid #444' }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>{b.movie}</div>
                  <div style={{ opacity: 0.7 }}>User: {b.user_email}</div>
                  <div style={{ marginTop: 5 }}>Seat: {b.seat} | Price: {Number(b.amount).toFixed(2)} ฿</div>
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "12px",
                      background: b.status === 'Paid' ? '#006644' : '#666',
                      color: "#fff"
                    }}>{b.status}</span>

                    <button
                      style={{
                        background: "orange",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        borderRadius: 4,
                        fontWeight: "bold"
                      }}
                      onClick={() => refundBooking(b.book_id)}
                    >
                      Cancel & Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

export default App;
