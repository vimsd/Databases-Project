from flask import Blueprint, request, jsonify
from db import get_connection

booking_bp = Blueprint("booking", __name__)

@booking_bp.route("/api/booking", methods=["POST"])
def create_booking():
    data = request.json
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            # 1. create booking
            cursor.execute("""
                INSERT INTO booking (user_id, showtime_id)
                VALUES (%s, %s)
            """, (data["user_id"], data["showtime_id"]))
            book_id = cursor.lastrowid

            # 2. lock seat
            cursor.execute("""
                INSERT INTO book_seat (book_id, showtime_id, seat_id)
                VALUES (%s, %s, %s)
            """, (book_id, data["showtime_id"], data["seat_id"]))

            # 3. payment
            cursor.execute("""
                INSERT INTO payments (book_id, amount, status)
                VALUES (%s, %s, 'Paid')
            """, (book_id, data["amount"]))

        conn.commit()
        return jsonify({"message": "Booking success", "book_id": book_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@booking_bp.route('/api/transactions/<int:user_id>')
def transactions(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT payments.payment_id,
               payments.amount,
               payments.payment_time
        FROM payments
        JOIN booking ON payments.booking_id = booking.booking_id
        WHERE booking.user_id = %s
    """, (user_id,))

    result = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(result)
