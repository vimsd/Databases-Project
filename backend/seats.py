from flask import Blueprint, request, jsonify
from db import get_connection

seats_bp = Blueprint("seats", __name__)

@seats_bp.route("/api/seats")
def get_seats():
    showtime_id = request.args.get("showtime_id")

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # all seats with prices
            cursor.execute("SELECT seat_id, seat, price FROM seats")
            seats = cursor.fetchall()

            # reservations (pending/booked)
            cursor.execute("""
                SELECT seat_id, status
                FROM book_seat
                WHERE showtime_id = %s
            """, (showtime_id,))
            reserved = {row["seat_id"]: row["status"] for row in cursor.fetchall()}
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals(): conn.close()

    for seat in seats:
        st = reserved.get(seat["seat_id"])
        if st == "booked":
            seat["status"] = "booked"
            seat["available"] = False
        elif st == "pending":
            seat["status"] = "pending"
            seat["available"] = False
        else:
            seat["status"] = "free"
            seat["available"] = True

    return jsonify(seats)
