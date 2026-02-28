import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import Transactions from "./Transactions";

const API = import.meta.env.VITE_API || "/api";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  useEffect(() => {
    if (user) setPage("cinema");
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const refreshUser = () => {
    if (!user) return;
    fetch(`${API}/users/${user.user_id}`)
      .then(r => r.json())
      .then(setUser)
      .catch(console.error);
  };

  const handleRegister = () => {
    setPage("login");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  if (page === "login" && !user) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎬 Cinema System</h1>
        <Login
          onLogin={handleLogin}
          switchToRegister={() => setPage("register")}
        />
      </div>
    );
  }

  if (page === "register") {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎬 Cinema System</h1>
        <Register
          onRegister={handleRegister}
          switchToLogin={() => setPage("login")}
        />
      </div>
    );
  }

  if (page === "cinema") {
    return (
      <div style={styles.container}>
        <button onClick={handleLogout} style={{ float: "right" }}>
          Logout
        </button>
        <Cinema user={user} />
      </div>
    );
  }

  return null;
}

/* ================= CINEMA ================= */

function Cinema({ user }) {
  const [movies, setMovies] = useState([]);
  const [movieId, setMovieId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeId, setShowtimeId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [viewTransactions, setViewTransactions] = useState(false);

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
          seat_id,
          amount: 250
        })
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "booking failed");

      // ask user to confirm payment
      const ok = window.confirm(`Pay ${res.amount} from your balance?`);
      if (!ok) {
        await fetch(`${API}/booking/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book_id: res.book_id })
        });
        return;
      }

      const payResp = await fetch(`${API}/booking/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: res.book_id })
      });
      const payRes = await payResp.json();
      if (!payResp.ok) throw new Error(payRes.error || "payment failed");
      alert("Payment confirmed");
      // refresh user balance from server
      refreshUser();
      // refresh seats
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

  if (viewTransactions) {
    return (
      <>
        <button onClick={() => setViewTransactions(false)} style={styles.back}>
          ⬅ Back
        </button>
        <Transactions user={user} />
      </>
    );
  }

  return (
    <>
      <h2 style={styles.welcome}>Welcome User #{user.user_id}</h2>
      <div>Balance: {user.balance?.toFixed(2) || 0} ฿</div>
      <button onClick={() => setViewTransactions(true)}>My Transactions</button>

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
