from flask import Blueprint, request, jsonify
from db import get_connection

seats_bp = Blueprint("seats", __name__)

@seats_bp.route("/api/seats")
def get_seats():
    showtime_id = request.args.get("showtime_id")

    conn = get_connection()
    with conn.cursor() as cursor:
        # all seats
        cursor.execute("SELECT seat_id, seat FROM seats")
        seats = cursor.fetchall()

        # booked seats
        cursor.execute("""
            SELECT seat_id
            FROM book_seat
            WHERE showtime_id = %s
        """, (showtime_id,))
        booked = {row["seat_id"] for row in cursor.fetchall()}

    conn.close()

    for seat in seats:
        seat["available"] = seat["seat_id"] not in booked

    return jsonify(seats)
