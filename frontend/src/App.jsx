import { useState, useEffect } from "react";

const API = "http://127.0.0.1:5000";

function App() {
  const [user, setUser] = useState(null);

  // ---------- LOGIN ----------
  if (!user) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        <h1>🎬 Cinema System</h1>
        <Login onLogin={setUser} />
      </div>
    );
  }

  // ---------- MAIN APP ----------
  return (
    <div style={{ padding: 40, color: "white" }}>
      <h2>Welcome User #{user.user_id}</h2>
      <Cinema user={user} />
    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");

  const login = async () => {
    // mock login (ยังไม่ต่อ backend จริง)
    onLogin({ user_id: 1, email });
  };

  return (
    <>
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <br /><br />
      <button onClick={login}>Login</button>
    </>
  );
}

/* ================= CINEMA ================= */

function Cinema({ user }) {
  const [movies, setMovies] = useState([]);
  const [movieId, setMovieId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeId, setShowtimeId] = useState(null);
  const [seats, setSeats] = useState([]);

  // โหลด movie (mock เพราะอยู่ NoSQL)
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

  return (
    <>
      {!movieId && (
        <>
          <h2>Select Movie</h2>
          {movies.map(m => (
            <div key={m.movie_id}>
              {m.title}
              <button onClick={() => setMovieId(m.movie_id)}>Select</button>
            </div>
          ))}
        </>
      )}

      {movieId && !showtimeId && (
        <>
          <button onClick={() => setMovieId(null)}>⬅ Back</button>
          <h2>Select Showtime</h2>
          {showtimes.map(s => (
            <div key={s.showtime_id}>
              {s.showtime}
              <button onClick={() => setShowtimeId(s.showtime_id)}>
                Select
              </button>
            </div>
          ))}
        </>
      )}

      {showtimeId && (
        <>
          <button onClick={() => setShowtimeId(null)}>⬅ Back</button>
          <h2>Select Seat</h2>
          {seats.map(s => (
            <div key={s.seat_id}>
              {s.seat}{" "}
              {s.available ? (
                <button onClick={() => bookSeat(s.seat_id)}>Book</button>
              ) : (
                "(Booked)"
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}

export default App;
