from flask import Blueprint, request, jsonify
from db import get_connection

showtimes_bp = Blueprint("showtimes", __name__)

@showtimes_bp.route("/api/showtimes", methods=["GET"])
def get_showtimes():
    movie_id = request.args.get("movie_id")

    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT showtime_id, theater_id, showtime
            FROM showtimes
            WHERE movie_id = %s
        """, (movie_id,))
        data = cursor.fetchall()

    conn.close()
    return jsonify(data)


@showtimes_bp.route("/api/showtimes", methods=["POST"])
def add_showtime():
    data = request.json
    if not data or not all(k in data for k in ("movie_id", "theater_id", "showtime")):
        return jsonify({"error": "missing fields (movie_id, theater_id, showtime)"}), 400
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO showtimes (movie_id, theater_id, showtime) VALUES (%s, %s, %s)",
                (data["movie_id"], data["theater_id"], data["showtime"])
            )
        conn.commit()
        return jsonify({"message": "Showtime added"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@showtimes_bp.route("/api/showtimes/<int:showtime_id>", methods=["DELETE"])
def delete_showtime(showtime_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM showtimes WHERE showtime_id = %s", (showtime_id,))
        conn.commit()
        return jsonify({"message": "Showtime deleted"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@showtimes_bp.route("/api/movies", methods=["POST"])
def add_movie():
    data = request.json
    if not data or not data.get("title"):
        return jsonify({"error": "title required"}), 400
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO movies (title) VALUES (%s)", (data["title"],))
        conn.commit()
        return jsonify({"message": "Movie added"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@showtimes_bp.route("/api/movies/<int:movie_id>", methods=["DELETE"])
def delete_movie(movie_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Note: cascades or foreign key errors might occur if linked to showtimes
            cursor.execute("DELETE FROM movies WHERE movie_id = %s", (movie_id,))
        conn.commit()
        return jsonify({"message": "Movie deleted"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@showtimes_bp.route("/api/movies", methods=["GET"])
def get_movies():
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT movie_id, title FROM movies")
        movies = cursor.fetchall()
    conn.close()
    return jsonify(movies)