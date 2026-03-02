from flask import Blueprint, request, jsonify
from db import get_connection

showtimes_bp = Blueprint("showtimes", __name__)

@showtimes_bp.route("/api/showtimes", methods=["GET"])
def get_showtimes():
    movie_id = request.args.get("movie_id")

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT showtime_id, showtime
                FROM showtimes
                WHERE movie_id = %s
            """, (movie_id,))
            data = cursor.fetchall()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals(): conn.close()

@showtimes_bp.route("/api/showtimes", methods=["POST"])
def create_showtime():
    data = request.get_json() or {}
    required = ['movie_id', 'theater_id', 'showtime']
    if any(field not in data for field in required):
        return jsonify({"error": "movie_id, theater_id, showtime are required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO showtimes (movie_id, theater_id, showtime)
                VALUES (%s, %s, %s)
            """, (data['movie_id'], data['theater_id'], data['showtime']))
            new_id = cursor.lastrowid
        conn.commit()
        return jsonify({"message": "Showtime created", "showtime_id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


