from flask import Blueprint, request, jsonify
from db import get_connection

users_bp = Blueprint("users", __name__)

@users_bp.route("/api/users", methods=["POST"])
def create_user():
    data = request.json
    email = data["email"]
    password = data["password"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (email, password)
                VALUES (%s, %s)
            """, (email, password))
        conn.commit()
        return jsonify({"message": "User created"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
