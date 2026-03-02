from flask import Blueprint, request, jsonify
from db import get_connection

booking_bp = Blueprint("booking", __name__)

# ================= CREATE BOOKING (SINGLE SEAT) =================
@booking_bp.route("/api/booking", methods=["POST"])
def create_booking():
    """
    Legacy endpoint for creating a booking for a single seat.
    New UI will mostly use /api/booking/bulk for multi-seat flows.
    """
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
            # any existing row means seat is already held or booked
            if existing:
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


# ================= CREATE MULTIPLE BOOKINGS (MULTI-SEAT) =================
@booking_bp.route("/api/booking/bulk", methods=["POST"])
def create_booking_bulk():
    """
    Create bookings for multiple seats in a single showtime for a user.
    Each seat becomes its own booking + payment, so that payments
    still map 1:1 with seats while allowing a single confirmation flow.
    """
    data = request.json or {}
    user_id = data.get("user_id")
    showtime_id = data.get("showtime_id")
    seat_ids = data.get("seat_ids") or []

    if not user_id or not showtime_id or not isinstance(seat_ids, list) or not seat_ids:
        return jsonify({"error": "user_id, showtime_id and seat_ids[] are required"}), 400

    conn = get_connection()
    created = []
    try:
        with conn.cursor() as cursor:
            for seat_id in seat_ids:
                # get seat price
                cursor.execute(
                    "SELECT price FROM seats WHERE seat_id = %s",
                    (seat_id,)
                )
                seat = cursor.fetchone()
                if not seat:
                    conn.rollback()
                    return jsonify({"error": f"seat not found: {seat_id}"}), 404
                seat_price = float(seat["price"])

                # check seat availability (lock)
                cursor.execute("""
                    SELECT status FROM book_seat
                    WHERE showtime_id = %s AND seat_id = %s
                    FOR UPDATE
                """, (showtime_id, seat_id))
                existing = cursor.fetchone()
                if existing:
                    conn.rollback()
                    return jsonify({"error": f"seat already taken: {seat_id}"}), 409

                # create booking
                cursor.execute(
                    "INSERT INTO booking (user_id, showtime_id) VALUES (%s, %s)",
                    (user_id, showtime_id)
                )
                book_id = cursor.lastrowid

                # hold seat
                cursor.execute(
                    """
                    INSERT INTO book_seat (book_id, showtime_id, seat_id, status)
                    VALUES (%s, %s, %s, 'pending')
                    """,
                    (book_id, showtime_id, seat_id)
                )

                # payment record
                cursor.execute(
                    """
                    INSERT INTO payments (book_id, amount, status)
                    VALUES (%s, %s, 'Pending')
                    """,
                    (book_id, seat_price)
                )

                created.append({"book_id": book_id, "seat_id": seat_id, "amount": seat_price})

        conn.commit()
        return jsonify({
            "message": "Bookings pending",
            "items": created
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


# ================= CONFIRM ALL (PAY ALL PENDING) =================
@booking_bp.route("/api/booking/confirm-all", methods=["POST"])
def confirm_all_bookings():
    data = request.json
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT b.book_id, p.amount
                FROM booking b
                JOIN payments p ON p.book_id = b.book_id
                WHERE b.user_id = %s AND p.status = 'Pending'
                FOR UPDATE
            """, (user_id,))
            pending = cursor.fetchall()
            if not pending:
                return jsonify({"error": "no pending payments"}), 400

            total = sum(float(row["amount"]) for row in pending)
            cursor.execute(
                "SELECT balance FROM users WHERE user_id = %s FOR UPDATE",
                (user_id,)
            )
            u = cursor.fetchone()
            if not u or float(u["balance"]) < total:
                return jsonify({"error": "insufficient balance"}), 400

            cursor.execute(
                "UPDATE users SET balance = balance - %s WHERE user_id = %s",
                (total, user_id)
            )
            for row in pending:
                bid = row["book_id"]
                cursor.execute(
                    "UPDATE payments SET status = 'Paid' WHERE book_id = %s",
                    (bid,)
                )
                cursor.execute(
                    "UPDATE book_seat SET status = 'booked' WHERE book_id = %s",
                    (bid,)
                )

        conn.commit()
        return jsonify({"message": "All payments confirmed"})

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

            # free seat by removing book_seat row (status ENUM is 'pending'|'booked' only)
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
                       s.seat,
                       m.title AS movie
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

        return jsonify(result)
    finally:
        conn.close()
# ================= ADMIN: LIST ALL BOOKINGS =================
@booking_bp.route("/api/admin/bookings")
def list_bookings():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.payment_id,
                       p.book_id,
                       p.amount,
                       p.payment_time,
                       p.status,
                       u.email as user_email,
                       m.title AS movie,
                       s.seat
                FROM payments p
                JOIN booking b ON p.book_id = b.book_id
                JOIN users u ON b.user_id = u.user_id
                JOIN showtimes st ON b.showtime_id = st.showtime_id
                JOIN movies m ON st.movie_id = m.movie_id
                JOIN book_seat bs ON b.book_id = bs.book_id
                JOIN seats s ON bs.seat_id = s.seat_id
                ORDER BY p.payment_time DESC
            """)
            result = cursor.fetchall()
        return jsonify(result)
    finally:
        conn.close()


# ================= ADMIN: REFUND BOOKING =================
@booking_bp.route("/api/admin/booking/refund", methods=["POST"])
def refund_booking():
    data = request.json
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"error": "book_id required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Get payment and user details
            cursor.execute("""
                SELECT p.amount, p.status, b.user_id
                FROM payments p
                JOIN booking b ON p.book_id = b.book_id
                WHERE p.book_id = %s
                FOR UPDATE
            """, (book_id,))
            payment = cursor.fetchone()
            
            if not payment:
                return jsonify({"error": "Payment not found"}), 404
            
            if payment["status"] != "Paid":
                # If it's pending, just cancel it normally
                cursor.execute("DELETE FROM book_seat WHERE book_id = %s", (book_id,))
                cursor.execute("DELETE FROM payments WHERE book_id = %s", (book_id,))
                cursor.execute("DELETE FROM booking WHERE book_id = %s", (book_id,))
                conn.commit()
                return jsonify({"message": "Pending booking cancelled (no refund needed)"})

            # 2. Refund balance
            amount = float(payment["amount"])
            user_id = payment["user_id"]
            
            cursor.execute(
                "UPDATE users SET balance = balance + %s WHERE user_id = %s",
                (amount, user_id)
            )

            # 3. Remove booking records to free seat
            cursor.execute("DELETE FROM book_seat WHERE book_id = %s", (book_id,))
            cursor.execute("DELETE FROM payments WHERE book_id = %s", (book_id,))
            cursor.execute("DELETE FROM booking WHERE book_id = %s", (book_id,))

        conn.commit()
        return jsonify({"message": f"Booking refunded {amount} ฿ and cancelled successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
