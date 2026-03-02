import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API || "/api";

export default function Admin() {
    const navigate = useNavigate();

    // Data lists for the Showtime form dropdowns
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);

    // Form states
    const [movieForm, setMovieForm] = useState({ title: "", duration_minutes: "", genres: "" });
    const [theaterForm, setTheaterForm] = useState({ branch_name: "" });
    const [showtimeForm, setShowtimeForm] = useState({ movie_id: "", theater_id: "", showtime: "" });

    const fetchMoviesAndTheaters = () => {
        fetch(`${API}/movies`).then(r => r.json()).then(setMovies).catch(console.error);
        fetch(`${API}/mongo/theaters`).then(r => r.json()).then(setTheaters).catch(console.error);
    };

    useEffect(() => {
        fetchMoviesAndTheaters();
    }, []);

    // Submit Handlers
    const handleAddMovie = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`${API}/mongo/movies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: movieForm.title,
                    duration_minutes: Number(movieForm.duration_minutes),
                    genres: movieForm.genres.split(",").map(g => g.trim())
                })
            });
            if (resp.ok) {
                alert("Movie added successfully!");
                setMovieForm({ title: "", duration_minutes: "", genres: "" });
                fetchMoviesAndTheaters(); // Refresh list for showtimes dropdown
            } else {
                const err = await resp.json();
                alert("Failed to add movie: " + err.error);
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleAddTheater = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`${API}/mongo/theaters`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ branch_name: theaterForm.branch_name })
            });
            if (resp.ok) {
                alert("Theater added successfully!");
                setTheaterForm({ branch_name: "" });
                fetchMoviesAndTheaters(); // Refresh list for showtimes dropdown
            } else {
                const err = await resp.json();
                alert("Failed to add theater: " + err.error);
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleAddShowtime = async (e) => {
        e.preventDefault();
        try {
            const resp = await fetch(`${API}/showtimes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movie_id: showtimeForm.movie_id,
                    // Convert theater_id from MongoDB String ID to integer if matching MySQL 
                    // Note: In our current setup, theater_id in init.sql is INT 
                    // For simplicity in this dummy form, we'll extract an integer or pass a raw ID
                    // Actual production might need the MySQL theater_id, we will assume theater mapping here.
                    theater_id: 1, // hardcoded to 1 for this demo to sync with MySQL init.sql structure
                    showtime: showtimeForm.showtime
                })
            });
            if (resp.ok) {
                alert("Showtime added successfully!");
                setShowtimeForm({ movie_id: "", theater_id: "1", showtime: "" });
            } else {
                const err = await resp.json();
                alert("Failed to add showtime: " + err.error);
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate("/")} style={styles.backButton}>⬅ Back to Home</button>
            <h1 style={styles.title}>Admin Panel</h1>

            <div style={styles.grid}>
                {/* ADD MOVIE FORM */}
                <div style={styles.card}>
                    <h2 style={{ color: "#00ffcc" }}>1. Add Movie (MongoDB)</h2>
                    <form onSubmit={handleAddMovie}>
                        <input style={styles.input} required placeholder="Movie Title" value={movieForm.title} onChange={e => setMovieForm({ ...movieForm, title: e.target.value })} />
                        <input style={styles.input} type="number" required placeholder="Duration (mins)" value={movieForm.duration_minutes} onChange={e => setMovieForm({ ...movieForm, duration_minutes: e.target.value })} />
                        <input style={styles.input} placeholder="Genres (comma separated)" value={movieForm.genres} onChange={e => setMovieForm({ ...movieForm, genres: e.target.value })} />
                        <button style={styles.button} type="submit">Add Movie</button>
                    </form>
                </div>

                {/* ADD THEATER FORM */}
                <div style={styles.card}>
                    <h2 style={{ color: "#00ffcc" }}>2. Add Theater (MongoDB)</h2>
                    <form onSubmit={handleAddTheater}>
                        <input style={styles.input} required placeholder="Branch Name" value={theaterForm.branch_name} onChange={e => setTheaterForm({ ...theaterForm, branch_name: e.target.value })} />
                        <button style={styles.button} type="submit">Add Theater</button>
                    </form>
                </div>

                {/* ADD SHOWTIME FORM */}
                <div style={styles.card}>
                    <h2 style={{ color: "#00ffcc" }}>3. Add Showtime (MySQL)</h2>
                    <form onSubmit={handleAddShowtime}>
                        <select style={styles.input} required value={showtimeForm.movie_id} onChange={e => setShowtimeForm({ ...showtimeForm, movie_id: e.target.value })}>
                            <option value="">-- Select Movie --</option>
                            {movies.map(m => <option key={m.movie_id} value={m.movie_id}>{m.title}</option>)}
                        </select>

                        <p style={{ fontSize: 12, margin: '0 0 10px 0' }}>Note: Theater defaults to ID 1 for MySQL compatibility.</p>

                        <input style={styles.input} type="datetime-local" required value={showtimeForm.showtime} onChange={e => setShowtimeForm({ ...showtimeForm, showtime: e.target.value })} />
                        <button style={styles.button} type="submit">Add Showtime</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: 40
    },
    title: {
        textAlign: "center",
        marginBottom: 40
    },
    grid: {
        display: "flex",
        gap: 30,
        justifyContent: "center",
        flexWrap: "wrap"
    },
    card: {
        background: "#222",
        padding: 25,
        borderRadius: 10,
        minWidth: 300,
        display: "flex",
        flexDirection: "column",
        gap: 10
    },
    input: {
        padding: 10,
        marginBottom: 15,
        width: "100%",
        borderRadius: 5,
        border: "1px solid #444",
        backgroundColor: "#333",
        color: "white",
        boxSizing: "border-box"
    },
    button: {
        padding: "10px",
        background: "#00ffcc",
        border: "none",
        borderRadius: 5,
        cursor: "pointer",
        fontWeight: "bold",
        width: "100%"
    },
    backButton: {
        padding: "8px 15px",
        background: "#444",
        color: "white",
        border: "none",
        borderRadius: 5,
        cursor: "pointer",
        marginBottom: 20
    }
};
