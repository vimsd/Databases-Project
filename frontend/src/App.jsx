import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Transactions from "./Transactions";

const API = import.meta.env.VITE_API || "/api";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
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
    <Routes>
      <Route path="/transactions" element={transactionsEl} />

      <Route
        path="/*"
        element={
          <>
            {page === "login" && !user && (
              <div style={styles.container}>
                <h1 style={styles.title}>🎬 Cinema System</h1>
                <Login
                  onLogin={handleLogin}
                  switchToRegister={() => setPage("register")}
                />
              </div>
            )}

            {page === "register" && (
              <div style={styles.container}>
                <h1 style={styles.title}>🎬 Cinema System</h1>
                <Register
                  onRegister={handleRegister}
                  switchToLogin={() => setPage("login")}
                />
              </div>
            )}

            {page === "cinema" && user && (
              <div style={styles.container}>
                <button onClick={handleLogout} style={{ float: "right" }}>
                  Logout
                </button>
                <Cinema user={user} navigate={navigate} />
              </div>
            )}
          </>
        }
      />
    </Routes>
  );
}

/* ================= CINEMA ================= */

function Cinema({ user, navigate }) {
  const [movies, setMovies] = useState([]);
  const [movieId, setMovieId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeId, setShowtimeId] = useState(null);
  const [seats, setSeats] = useState([]);

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

      alert("Seat held pending payment. Pay later on the Transactions page.");
      // refresh seats to show pending status
      const s2 = await fetch(`${API}/seats?showtime_id=${showtimeId}`);
      const data = await s2.json();
      setSeats(data);
    } catch (e) {
      alert(e.message);
      console.error(e);
    }
  };

  const step =
    !movieId ? 1 :
    !showtimeId ? 2 :
    3;

  return (
    <>
      <h2 style={styles.welcome}>Welcome User #{user.user_id}</h2>
      <div>Balance: {Number(user.balance || 0).toFixed(2)} ฿</div>
      <button onClick={() => navigate("/transactions")}>My Transactions</button>

      {/* STEP INDICATOR */}
      <div style={styles.steps}>
        <span style={step === 1 ? styles.activeStep : styles.step}>Movie</span>
        <span style={step === 2 ? styles.activeStep : styles.step}>Showtime</span>
        <span style={step === 3 ? styles.activeStep : styles.step}>Seat</span>
      </div>

      {/* SELECT MOVIE */}
      {!movieId && (
        <div style={styles.grid}>
          {movies.map(m => (
            <div key={m.movie_id} style={styles.card}>
              <h3>{m.title}</h3>
              <button style={styles.button}
                onClick={() => setMovieId(m.movie_id)}>
                Select
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SELECT SHOWTIME */}
      {movieId && !showtimeId && (
        <>
          <button style={styles.back}
            onClick={() => setMovieId(null)}>
            ⬅ Back
          </button>

          <div style={styles.grid}>
            {showtimes.map(s => (
              <div key={s.showtime_id} style={styles.card}>
                <h3>{new Date(s.showtime).toLocaleString()}</h3>
                <button style={styles.button}
                  onClick={() => setShowtimeId(s.showtime_id)}>
                  Select
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SELECT SEAT */}
      {showtimeId && (
        <>
          <button style={styles.back}
            onClick={() => setShowtimeId(null)}>
            ⬅ Back
          </button>

          <div style={styles.grid}>
            {seats.map(s => (
              <div key={s.seat_id} style={styles.card}>
                <h3>{s.seat}</h3>
                <div style={{fontSize:'12px', marginBottom: '8px'}}>Price: {Number(s.price ?? 250).toFixed(2)} ฿ </div>
                {s.status === "free" && (
                  <button style={styles.button}
                    onClick={() => bookSeat(s.seat_id)}>
                    Book
                  </button>
                )}
                {s.status === "pending" && (
                  <span style={{ color: "orange" }}>Pending</span>
                )}
                {s.status === "booked" && (
                  <span style={{ color: "red" }}>Booked</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
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
