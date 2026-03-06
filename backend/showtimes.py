from flask import Blueprint, request, jsonify
from db import get_connection, get_mongo_db
from bson.objectid import ObjectId
import datetime

showtimes_bp = Blueprint("showtimes", __name__)

@showtimes_bp.route("/api/showtimes", methods=["GET"])
def get_showtimes():
    movie_id = request.args.get("movie_id")

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            if movie_id:
                cursor.execute("""
                    SELECT showtime_id, theater_id, movie_id, showtime
                    FROM showtimes
                    WHERE movie_id = %s
                    ORDER BY showtime ASC
                """, (movie_id,))
            else:
                cursor.execute("""
                    SELECT showtime_id, theater_id, movie_id, showtime
                    FROM showtimes
                    ORDER BY showtime ASC
                """)
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

    mongo_db = get_mongo_db()
    try:
        movie = mongo_db.movies.find_one({"_id": ObjectId(data['movie_id'])})
    except Exception:
        movie = None
        
    if not movie:
        return jsonify({"error": "Movie not found"}), 404
        
    new_duration = movie.get('duration_minutes') or 120

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            st_time = data['showtime'].replace('T', ' ')
            try:
                new_start = datetime.datetime.strptime(st_time, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                new_start = datetime.datetime.strptime(st_time, "%Y-%m-%d %H:%M")
                st_time += ":00"

            new_end = new_start + datetime.timedelta(minutes=new_duration)

            cursor.execute("SELECT movie_id, showtime FROM showtimes WHERE theater_id = %s", (data['theater_id'],))
            existing_showtimes = cursor.fetchall()

            for ext in existing_showtimes:
                try:
                    ext_movie = mongo_db.movies.find_one({"_id": ObjectId(ext['movie_id'])})
                    ext_duration = ext_movie.get('duration_minutes') or 120 if ext_movie else 120
                except Exception:
                    ext_duration = 120
                
                ext_start = ext['showtime']
                if isinstance(ext_start, str):
                    try:
                        ext_start = datetime.datetime.strptime(ext_start, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        ext_start = datetime.datetime.strptime(ext_start, "%Y-%m-%d %H:%M")
                        
                ext_end = ext_start + datetime.timedelta(minutes=ext_duration)

                if max(new_start, ext_start) < min(new_end, ext_end):
                    return jsonify({"error": f"Overlapping showtime detected. Screen is busy from {ext_start.strftime('%H:%M')} to {ext_end.strftime('%H:%M')}."}), 409

            cursor.execute("""
                INSERT INTO showtimes (movie_id, theater_id, showtime)
                VALUES (%s, %s, %s)
            """, (data['movie_id'], data['theater_id'], st_time))
            new_id = cursor.lastrowid
        conn.commit()
        return jsonify({"message": "Showtime created", "showtime_id": new_id}), 201
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals(): conn.close()


@showtimes_bp.route("/api/showtimes/<int:showtime_id>", methods=["DELETE"])
def delete_showtime(showtime_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM showtimes WHERE showtime_id = %s", (showtime_id,))
        conn.commit()
        return jsonify({"message": "Showtime deleted"})
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals(): conn.close()
