from flask import Blueprint, request, jsonify
from db import get_connection

booking_bp = Blueprint("booking", __name__)

# ================= CREATE BOOKING =================
@booking_bp.route("/api/booking", methods=["POST"])
def create_booking():
    data = request.json
    if not data or not all(k in data for k in ("user_id", "showtime_id", "seat_id")):
        return jsonify({"error": "missing required fields"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # get seat price
            cursor.execute(
                "SELECT price FROM seats WHERE seat_id = %s",
                (data["seat_id"],)
            )
            seat = cursor.fetchone()
            if not seat:
                return jsonify({"error": "seat not found"}), 404
            seat_price = float(seat["price"])

            # check seat availability (lock)
            cursor.execute("""
                SELECT status FROM book_seat
                WHERE showtime_id = %s AND seat_id = %s
                FOR UPDATE
            """, (data["showtime_id"], data["seat_id"]))
            existing = cursor.fetchone()
            if existing and existing["status"] != "free":
                return jsonify({"error": "seat already taken"}), 409

            # create booking
            cursor.execute(
                "INSERT INTO booking (user_id, showtime_id) VALUES (%s, %s)",
                (data["user_id"], data["showtime_id"])
            )
            book_id = cursor.lastrowid

            # hold seat
            cursor.execute(
                """
                INSERT INTO book_seat (book_id, showtime_id, seat_id, status)
                VALUES (%s, %s, %s, 'pending')
                """,
                (book_id, data["showtime_id"], data["seat_id"])
            )

            # payment record
            cursor.execute(
                """
                INSERT INTO payments (book_id, amount, status)
                VALUES (%s, %s, 'Pending')
                """,
                (book_id, seat_price)
            )

        conn.commit()
        return jsonify({
            "message": "Booking pending",
            "book_id": book_id,
            "amount": seat_price
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# ================= CONFIRM BOOKING =================
@booking_bp.route("/api/booking/confirm", methods=["POST"])
def confirm_booking():
    data = request.json
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"error": "book_id required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # lock payment
            cursor.execute("""
                SELECT amount FROM payments
                WHERE book_id = %s AND status = 'Pending'
                FOR UPDATE
            """, (book_id,))
            payment = cursor.fetchone()
            if not payment:
                return jsonify({"error": "no pending payment"}), 400
            amount = float(payment["amount"])

            # get user
            cursor.execute(
                "SELECT user_id FROM booking WHERE book_id = %s",
                (book_id,)
            )
            b = cursor.fetchone()
            if not b:
                return jsonify({"error": "booking not found"}), 404
            user_id = b["user_id"]

            cursor.execute(
                "SELECT balance FROM users WHERE user_id = %s FOR UPDATE",
                (user_id,)
            )
            u = cursor.fetchone()
            if not u or u["balance"] < amount:
                return jsonify({"error": "insufficient balance"}), 400

            # deduct balance
            cursor.execute(
                "UPDATE users SET balance = balance - %s WHERE user_id = %s",
                (amount, user_id)
            )

            # update payment & seat
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


# ================= CANCEL BOOKING =================
@booking_bp.route("/api/booking/cancel", methods=["POST"])
def cancel_booking():
    data = request.json
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"error": "book_id required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT status FROM payments WHERE book_id = %s",
                (book_id,)
            )
            pay = cursor.fetchone()
            if not pay or pay["status"] != "Pending":
                return jsonify({"error": "cannot cancel"}), 400

            # free seat instead of deleting blindly
            cursor.execute(
                "UPDATE book_seat SET status = 'free' WHERE book_id = %s",
                (book_id,)
            )
            cursor.execute(
                "DELETE FROM payments WHERE book_id = %s",
                (book_id,)
            )
            cursor.execute(
                "DELETE FROM booking WHERE book_id = %s",
                (book_id,)
            )

        conn.commit()
        return jsonify({"message": "Booking canceled"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# ================= TRANSACTIONS =================
@booking_bp.route("/api/transactions/<int:user_id>")
def transactions(user_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.payment_id,
                       p.book_id,
                       p.amount,
                       p.payment_time,
                       p.status,
                       st.showtime,
                       s.seat
                FROM payments p
                JOIN booking b ON p.book_id = b.book_id
                JOIN showtimes st ON b.showtime_id = st.showtime_id
                JOIN book_seat bs ON b.book_id = bs.book_id
                JOIN seats s ON bs.seat_id = s.seat_id
                WHERE b.user_id = %s
                ORDER BY p.payment_time DESC
            """, (user_id,))
            result = cursor.fetchall()

        return jsonify(result)
    finally:
        conn.close()
