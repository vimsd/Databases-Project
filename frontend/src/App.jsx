import { useState, useEffect } from "react";

const API = "http://127.0.0.1:5000";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎬 Cinema System</h1>
        <Login onLogin={setUser} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Cinema user={user} />
    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");

  const login = () => {
    onLogin({ user_id: 1, email });
  };

  return (
    <div style={styles.card}>
      <input
        style={styles.input}
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button style={styles.button} onClick={login}>
        Login
      </button>
    </div>
  );
}

/* ================= CINEMA ================= */

function Cinema({ user }) {
  const [movies, setMovies] = useState([]);
  const [movieId, setMovieId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeId, setShowtimeId] = useState(null);
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    setMovies([
      { movie_id: 1, title: "Dune" },
      { movie_id: 2, title: "Oppenheimer" }
    ]);
  }, []);

  useEffect(() => {
    if (!movieId) return;
    fetch(`${API}/api/showtimes?movie_id=${movieId}`)
      .then(r => r.json())
      .then(setShowtimes);
  }, [movieId]);

  useEffect(() => {
    if (!showtimeId) return;
    fetch(`${API}/api/seats?showtime_id=${showtimeId}`)
      .then(r => r.json())
      .then(setSeats);
  }, [showtimeId]);

  const bookSeat = (seat_id) => {
    fetch(`${API}/api/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        showtime_id: showtimeId,
        seat_id,
        amount: 250
      })
    })
      .then(r => r.json())
      .then(res => alert(res.message));
  };

  const step =
    !movieId ? 1 :
    !showtimeId ? 2 :
    3;

  return (
    <>
      <h2 style={styles.welcome}>Welcome User #{user.user_id}</h2>

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
                {s.available ? (
                  <button style={styles.button}
                    onClick={() => bookSeat(s.seat_id)}>
                    Book
                  </button>
                ) : (
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
