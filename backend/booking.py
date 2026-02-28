from flask import Blueprint, request, jsonify
from db import get_connection

booking_bp = Blueprint("booking", __name__)

@booking_bp.route("/api/booking", methods=["POST"])
def create_booking():
    """Initiate a booking and hold a seat (status pending).

    Request JSON should include user_id, showtime_id, seat_id and amount.
    The user balance is checked but not deducted yet. A payment row is
    created with status 'Pending'.
    """
    data = request.json
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            # verify enough balance
            cursor.execute(
                "SELECT balance FROM users WHERE user_id = %s",
                (data["user_id"],)
            )
            user = cursor.fetchone()
            if not user or user["balance"] < data["amount"]:
                return jsonify({"error": "insufficient balance"}), 400

            # 1. create booking
            cursor.execute(
                "INSERT INTO booking (user_id, showtime_id) VALUES (%s, %s)",
                (data["user_id"], data["showtime_id"])
            )
            book_id = cursor.lastrowid

            # 2. lock seat as pending
            cursor.execute(
                "INSERT INTO book_seat (book_id, showtime_id, seat_id, status) \
                 VALUES (%s, %s, %s, 'pending')",
                (book_id, data["showtime_id"], data["seat_id"])
            )

            # 3. payment record
            cursor.execute(
                "INSERT INTO payments (book_id, amount, status) VALUES (%s, %s, 'Pending')",
                (book_id, data["amount"])
            )

        conn.commit()
        return jsonify({
            "message": "Booking pending",
            "book_id": book_id,
            "amount": data["amount"],
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@booking_bp.route("/api/booking/confirm", methods=["POST"])
def confirm_booking():
    """Deduct user balance, mark payment paid and seat booked."""
    data = request.json
    book_id = data.get("book_id")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # fetch pending payment
            cursor.execute(
                "SELECT amount FROM payments WHERE book_id = %s AND status = 'Pending'",
                (book_id,)
            )
            payment = cursor.fetchone()
            if not payment:
                return jsonify({"error": "no pending payment"}), 400
            amount = payment["amount"]

            # get user
            cursor.execute("SELECT user_id FROM booking WHERE book_id = %s", (book_id,))
            b = cursor.fetchone()
            if not b:
                return jsonify({"error": "booking not found"}), 404
            user_id = b["user_id"]

            cursor.execute("SELECT balance FROM users WHERE user_id = %s", (user_id,))
            u = cursor.fetchone()
            if not u or u["balance"] < amount:
                return jsonify({"error": "insufficient balance"}), 400

            # deduct balance
            cursor.execute(
                "UPDATE users SET balance = balance - %s WHERE user_id = %s",
                (amount, user_id)
            )

            cursor.execute(
                "UPDATE payments SET status = 'Paid' WHERE book_id = %s",
                (book_id,)
            )
            cursor.execute(
                "UPDATE book_seat SET status = 'booked' WHERE book_id = %s",
                (book_id,)
            )

        conn.commit()
        return jsonify({"message": "Payment confirmed"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@booking_bp.route("/api/booking/cancel", methods=["POST"])
def cancel_booking():
    data = request.json
    book_id = data.get("book_id")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT status FROM payments WHERE book_id = %s", (book_id,)
            )
            pay = cursor.fetchone()
            if not pay or pay["status"] != "Pending":
                return jsonify({"error": "cannot cancel"}), 400
            cursor.execute("DELETE FROM book_seat WHERE book_id = %s", (book_id,))
            cursor.execute("DELETE FROM payments WHERE book_id = %s", (book_id,))
            cursor.execute("DELETE FROM booking WHERE book_id = %s", (book_id,))
        conn.commit()
        return jsonify({"message": "Booking canceled"})
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
        SELECT p.payment_id,
               p.book_id,
               p.amount,
               p.payment_time,
               p.status,
               m.title AS movie,
               st.showtime,
               s.seat
        FROM payments p
        JOIN booking b ON p.book_id = b.book_id
        JOIN showtimes st ON b.showtime_id = st.showtime_id
        JOIN movies m ON st.movie_id = m.movie_id
        JOIN book_seat bs ON b.book_id = bs.book_id
        JOIN seats s ON bs.seat_id = s.seat_id
        WHERE b.user_id = %s
        ORDER BY p.payment_time DESC
    """, (user_id,))

    result = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(result)


