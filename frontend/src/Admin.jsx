import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API || "/api";

export default function Admin() {
    const navigate = useNavigate();

    // Data lists for the Showtime form dropdowns
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);

    // Form states
    const [movieForm, setMovieForm] = useState({
        title: "", duration_minutes: "", genres: "",
        synopsis: "", release_date: "", content_rating: "PG-13",
        poster_url: "", cast: ""
    });
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
            const resp = await fetch(`${API}/movies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: movieForm.title,
                    duration_minutes: Number(movieForm.duration_minutes),
                    genres: movieForm.genres.split(",").map(g => g.trim()),
                    synopsis: movieForm.synopsis,
                    release_date: movieForm.release_date ? new Date(movieForm.release_date).toISOString() : null,
                    content_rating: movieForm.content_rating,
                    cast: movieForm.cast.split(",").map(c => ({ name: c.trim(), role: "" })),
                    media: { poster_url: movieForm.poster_url }
                })
            });
            if (resp.ok) {
                alert("Movie added successfully!");
                setMovieForm({
                    title: "", duration_minutes: "", genres: "",
                    synopsis: "", release_date: "", content_rating: "PG-13",
                    poster_url: "", cast: ""
                });
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
                    theater_id: showtimeForm.theater_id,
                    showtime: showtimeForm.showtime
                })
            });
            if (resp.ok) {
                alert("Showtime added successfully!");
                setShowtimeForm({ movie_id: "", theater_id: "", showtime: "" });
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
                        <textarea style={styles.input} required placeholder="Synopsis..." rows="3" value={movieForm.synopsis} onChange={e => setMovieForm({ ...movieForm, synopsis: e.target.value })} />
                        <input style={styles.input} type="date" required value={movieForm.release_date} onChange={e => setMovieForm({ ...movieForm, release_date: e.target.value })} />
                        <input style={styles.input} type="number" required placeholder="Duration (mins)" value={movieForm.duration_minutes} onChange={e => setMovieForm({ ...movieForm, duration_minutes: e.target.value })} />
                        <input style={styles.input} placeholder="Genres (Sci-Fi, Action)" value={movieForm.genres} onChange={e => setMovieForm({ ...movieForm, genres: e.target.value })} />
                        <input style={styles.input} placeholder="Actor Name 1, Actor Name 2" value={movieForm.cast} onChange={e => setMovieForm({ ...movieForm, cast: e.target.value })} />
                        <input style={styles.input} placeholder="Poster URL (https://...)" value={movieForm.poster_url} onChange={e => setMovieForm({ ...movieForm, poster_url: e.target.value })} />
                        <select style={styles.input} value={movieForm.content_rating} onChange={e => setMovieForm({ ...movieForm, content_rating: e.target.value })}>
                            <option value="G">G - General Audiences</option>
                            <option value="PG">PG - Parental Guidance</option>
                            <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                            <option value="R">R - Restricted</option>
                        </select>

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

                        <select style={styles.input} required value={showtimeForm.theater_id} onChange={e => setShowtimeForm({ ...showtimeForm, theater_id: e.target.value })}>
                            <option value="">-- Select Theater --</option>
                            {theaters.map(t => <option key={t._id} value={t._id}>{t.branch_name}</option>)}
                        </select>

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
    textarea: {
        padding: 10,
        marginBottom: 15,
        width: "100%",
        borderRadius: 5,
        border: "1px solid #444",
        backgroundColor: "#333",
        color: "white",
        boxSizing: "border-box",
        minHeight: "100px",
        fontFamily: "inherit"
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
