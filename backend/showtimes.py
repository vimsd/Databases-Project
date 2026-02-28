from flask import Blueprint, request, jsonify
from db import get_connection

showtimes_bp = Blueprint("showtimes", __name__)

@showtimes_bp.route("/api/showtimes", methods=["GET"])
def get_showtimes():
    movie_id = request.args.get("movie_id")

    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT showtime_id, showtime
            FROM showtimes
            WHERE movie_id = %s
        """, (movie_id,))
        data = cursor.fetchall()

    conn.close()
    return jsonify(data)


@showtimes_bp.route("/api/movies", methods=["GET"])
def get_movies():
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT movie_id, title FROM movies")
        movies = cursor.fetchall()
    conn.close()
    return jsonify(movies)