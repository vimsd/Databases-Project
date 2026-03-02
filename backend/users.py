from flask import Blueprint, request, jsonify
from db import get_connection

users_bp = Blueprint("users", __name__)

@users_bp.route("/api/users", methods=["POST"])
def create_user():
    data = request.json
    email = data["email"]
    password = data["password"]

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (email, password)
                VALUES (%s, %s)
            """, (email, password))
        conn.commit()
        return jsonify({"message": "User created"}), 201
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals(): conn.close()


@users_bp.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, email, balance FROM users WHERE user_id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "not found"}), 404
            return jsonify(user)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals(): conn.close()


@users_bp.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
            if cursor.rowcount == 0:
                return jsonify({"error": "not found"}), 404
        conn.commit()
        return jsonify({"message": "User deleted"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
