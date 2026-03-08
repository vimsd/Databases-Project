from flask import Blueprint, request, jsonify
from db import get_connection, get_mongo_db
import datetime
from bson.objectid import ObjectId

wallet_bp = Blueprint("wallet", __name__)

# ================= USER: TOP-UP REQUEST =================
@wallet_bp.route("/api/wallet/topup", methods=["POST"])
def request_topup():
    data = request.json
    user_id = data.get("user_id")
    amount = data.get("amount")

    if not user_id or not amount:
        return jsonify({"error": "Missing user_id or amount"}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO topup_requests (user_id, amount) VALUES (%s, %s)",
                (user_id, amount)
            )
        conn.commit()
        return jsonify({"message": "Top-up request sent. Waiting for approval."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals(): conn.close()

@wallet_bp.route("/api/wallet/qr", methods=["GET"])
def get_qr_code():
    try:
        db = get_mongo_db()
        setting = db.settings.find_one({"key": "payment_qr"})
        qr_url = setting["value"] if setting else ""
        return jsonify({"qr_url": qr_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= ADMIN: MANAGE TOP-UPS =================
@wallet_bp.route("/api/admin/wallet/requests", methods=["GET"])
def list_topup_requests():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT tr.*, u.email 
                FROM topup_requests tr
                JOIN users u ON tr.user_id = u.user_id
                ORDER BY tr.created_at DESC
            """)
            requests = cursor.fetchall()
            # Convert decimal and datetime for JSON
            for r in requests:
                r["amount"] = float(r["amount"])
                r["created_at"] = r["created_at"].isoformat()
            return jsonify(requests)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals(): conn.close()

@wallet_bp.route("/api/admin/wallet/approve", methods=["POST"])
def approve_topup():
    data = request.json
    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"error": "Missing request_id"}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Get request info
            cursor.execute("SELECT user_id, amount, status FROM topup_requests WHERE request_id = %s FOR UPDATE", (request_id,))
            req = cursor.fetchone()

            if not req:
                return jsonify({"error": "Request not found"}), 404
            if req["status"] != "Pending":
                return jsonify({"error": "Request already processed"}), 400

            # Update balance
            cursor.execute("UPDATE users SET balance = balance + %s WHERE user_id = %s", (req["amount"], req["user_id"]))
            # Update status
            cursor.execute("UPDATE topup_requests SET status = 'Approved' WHERE request_id = %s", (request_id,))
            
        conn.commit()
        return jsonify({"message": "Top-up approved successfully"})
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals(): conn.close()

@wallet_bp.route("/api/admin/wallet/reject", methods=["POST"])
def reject_topup():
    data = request.json
    request_id = data.get("request_id")

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("UPDATE topup_requests SET status = 'Rejected' WHERE request_id = %s AND status = 'Pending'", (request_id,))
            if cursor.rowcount == 0:
                return jsonify({"error": "Request not found or already processed"}), 404
        conn.commit()
        return jsonify({"message": "Top-up request rejected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals(): conn.close()

@wallet_bp.route("/api/admin/wallet/qr", methods=["POST"])
def update_qr_code():
    data = request.json
    qr_url = data.get("qr_url")

    if not qr_url:
        return jsonify({"error": "Missing qr_url"}), 400

    try:
        db = get_mongo_db()
        db.settings.update_one(
            {"key": "payment_qr"},
            {"$set": {"value": qr_url, "updated_at": datetime.datetime.utcnow()}},
            upsert=True
        )
        return jsonify({"message": "QR code updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
